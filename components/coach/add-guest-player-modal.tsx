"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Search, UserPlus, X, Loader2, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  searchClubPlayersForGuestAction,
  addGuestPlayerToTrainingAction,
  type GuestCandidatePlayer,
} from "@/app/actions/coach";

interface AddGuestPlayerModalProps {
  trainingId: string;
  isOpen: boolean;
  onClose: () => void;
  onPlayerAdded: () => void;
}

export function AddGuestPlayerModal({
  trainingId,
  isOpen,
  onClose,
  onPlayerAdded,
}: AddGuestPlayerModalProps) {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState<GuestCandidatePlayer[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(async () => {
      setSearching(true);
      setError(null);
      const res = await searchClubPlayersForGuestAction(trainingId, query);
      if (res.success) {
        setCandidates(res.candidates || []);
      } else {
        setError(res.error || "Nie udało się pobrać listy kandydatów.");
      }
      setSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [query, isOpen, trainingId]);

  function handleClose() {
    setQuery("");
    setCandidates([]);
    setError(null);
    onClose();
  }

  async function handleAddGuest(player: GuestCandidatePlayer) {
    setAddingId(player.id);
    setError(null);

    const res = await addGuestPlayerToTrainingAction(trainingId, player.id);

    if (res.success) {
      onPlayerAdded();
      handleClose();
    } else {
      setError(res.error || "Wystąpił problem z dodaniem zawodnika.");
    }
    setAddingId(null);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl border-2 border-foreground/30 bg-card p-6 shadow-[4px_4px_0_0_var(--foreground)] space-y-4">
        {/* NAGŁÓWEK */}
        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <UserPlus className="size-5 text-primary" />
            <h3 className="font-heading text-xl uppercase tracking-tight">
              Dodaj zawodnika gościnnego
            </h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-border p-1 hover:bg-muted"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground">
          Wyszukaj gracza z innego rocznika akademii. Zostanie dopisany do tej jednostki z oznaczeniem{" "}
          <strong className="text-foreground font-mono">GOŚĆ</strong>, zachowując przynależność do swojej drużyny bazowej.
        </p>

        {/* POLE WYSZUKIWARKI */}
        <div className="relative">
          <Search className="absolute left-3.5 top-3 size-4 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj po nazwisku lub imieniu..."
            className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background pl-10 pr-3 text-xs outline-none focus:border-foreground"
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
            {error}
          </div>
        )}

        {/* WYNIKI WYSZUKIWANIA */}
        <div className="max-h-72 overflow-y-auto divide-y divide-border/60 rounded-xl border border-border/70 bg-background">
          {searching ? (
            <div className="flex items-center justify-center gap-2 p-6 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin text-primary" />
              <span>Wyszukiwanie w bazie klubu...</span>
            </div>
          ) : candidates.length > 0 ? (
            candidates.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-foreground/20 bg-muted">
                    {player.avatarUrl ? (
                      <Image
                        src={player.avatarUrl}
                        alt=""
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-heading text-xs font-bold text-muted-foreground">
                        {player.firstName[0]}{player.lastName[0]}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm uppercase">
                      {player.jerseyNumber ? `#${player.jerseyNumber} ` : ""}
                      {player.firstName} {player.lastName}
                    </p>
                    <p className="truncate font-mono text-[10px] text-muted-foreground">
                      Drużyna: {player.teamName} {player.ageGroup ? `(${player.ageGroup})` : ""}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={addingId === player.id}
                  onClick={() => handleAddGuest(player)}
                  className="h-8 shrink-0 text-xs font-bold uppercase tracking-wide shadow-[1px_1px_0_0_var(--foreground)]"
                >
                  {addingId === player.id ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="mr-1 size-3" />
                      Dodaj
                    </>
                  )}
                </Button>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-muted-foreground">
              {query ? "Nie znaleziono pasujących zawodników w klubie." : "Wpisz nazwisko, aby wyszukać zawodnika."}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="button"
            variant="ghost"
            onClick={handleClose}
            className="h-10 text-xs text-muted-foreground"
          >
            Zamknij
          </Button>
        </div>
      </div>
    </div>
  );
}