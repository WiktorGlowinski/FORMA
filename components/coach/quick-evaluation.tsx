"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useCoachStore } from "@/store/useCoachStore";
import Link from "next/link";
import {
  ChevronLeft,
  RotateCcw,
  ArrowLeft,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  X,
  Minus,
  UserX,
  Share2,
  Check,
  ClipboardCopy,
  Phone,
  Search,
  Lock,
  Activity,
  Smile,
  Clock,
  MessageSquare,
  Users,
  UserPlus,
  CloudCheck,
  CloudOff,
  RefreshCw,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  ABSENCE_REASONS,
  INJURY_KINDS,
  markLabel,
  playerName,
  ratedCount,
  type AbsenceReason,
  type Mark,
  type SquadPlayer,
} from "@/components/coach/data";
import { InjuryIcon } from "@/components/coach/injury-icon";
import {
  getTrainingEvaluationDataAction,
  savePlayerMarkAction,
  resetTrainingEvaluationsAction,
  enableTrainingSurveyAction,
  type SurveySummary,
} from "@/app/actions/coach";
import { AddGuestPlayerModal } from "@/components/coach/add-guest-player-modal";
import { cn } from "@/lib/utils";

export type EvaluationPlayer = SquadPlayer & {
  avatarUrl?: string | null;
  parentName?: string | null;
  parentPhone?: string | null;
  phone?: string | null;
  isGuest?: boolean;
};

interface OfflineQueueItem {
  trainingId: string;
  playerId: string;
  mark: Mark;
  timestamp: number;
}

export function QuickEvaluation({ trainingId }: { trainingId: string }) {
  const {
    evaluationsCache,
    cacheEvaluationData,
    updateMarkInCache,
    resetCachedMarks,
    updateCachedSurveyStatus,
    invalidateCache,
  } = useCoachStore();

  const cached = evaluationsCache[trainingId];

  const [loading, setLoading] = useState(!cached);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [training, setTraining] = useState<{
    id: string;
    teamName: string;
    date: string;
    startTime: string;
    endTime: string;
    place: string;
    topic?: string;
    status: string;
    surveyEnabled?: boolean;
    isOwner?: boolean;
    leadCoachName?: string;
  } | null>(cached?.training || null);
  const [players, setPlayers] = useState<EvaluationPlayer[]>(cached?.squad || []);
  const [marks, setMarks] = useState<Record<string, Mark>>(cached?.initialMarks || {});
  const [surveySummary, setSurveySummary] = useState<SurveySummary | null>(null);
  const [index, setIndex] = useState(0);

  // BR-021: Stany synchronizacji i odporności offline
  const [syncStatus, setSyncStatus] = useState<"synced" | "offline" | "syncing">("synced");
  const [pendingQueueCount, setPendingQueueCount] = useState(0);

  const [absenceModalOpen, setAbsenceModalOpen] = useState(false);
  const [selectedAbsenceReason, setSelectedAbsenceReason] = useState<AbsenceReason | null>(null);

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosSearch, setSosSearch] = useState("");

  const [guestModalOpen, setGuestModalOpen] = useState(false);

  // Klucze pamięci podręcznej per jednostka treningowa
  const STORAGE_KEY_INDEX = `forma_eval_index_${trainingId}`;
  const STORAGE_KEY_QUEUE = `forma_eval_queue_${trainingId}`;

  // BR-021: Automatyczne opróżnianie kolejki offline po powrocie połączenia
  const flushOfflineQueue = useCallback(async () => {
    if (typeof window === "undefined") return;
    const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (!rawQueue) {
      setPendingQueueCount(0);
      setSyncStatus("synced");
      return;
    }

    try {
      const queue: OfflineQueueItem[] = JSON.parse(rawQueue);
      if (queue.length === 0) {
        setPendingQueueCount(0);
        setSyncStatus("synced");
        return;
      }

      setSyncStatus("syncing");
      const remaining: OfflineQueueItem[] = [];

      for (const item of queue) {
        try {
          const res = await savePlayerMarkAction(item.trainingId, item.playerId, item.mark);
          if (!res.success) remaining.push(item);
        } catch {
          remaining.push(item);
        }
      }

      if (remaining.length > 0) {
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(remaining));
        setPendingQueueCount(remaining.length);
        setSyncStatus("offline");
      } else {
        localStorage.removeItem(STORAGE_KEY_QUEUE);
        setPendingQueueCount(0);
        setSyncStatus("synced");
      }
    } catch {
      setSyncStatus("offline");
    }
  }, [trainingId, STORAGE_KEY_QUEUE]);

  // BR-021: Nasłuch przywrócenia połączenia sieciowego
  useEffect(() => {
    function handleOnline() {
      flushOfflineQueue();
    }
    function handleOffline() {
      setSyncStatus("offline");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Sprawdzenie czy w buforze czekają niezsynchronizowane wpisy
    const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
    if (rawQueue) {
      try {
        const q = JSON.parse(rawQueue);
        if (q.length > 0) {
          setPendingQueueCount(q.length);
          flushOfflineQueue();
        }
      } catch {}
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [flushOfflineQueue, STORAGE_KEY_QUEUE]);

  async function fetchEvaluationData(initialLoad = false) {
    if (!trainingId) {
      setErrorMsg("Brak identyfikatora jednostki treningowej.");
      setLoading(false);
      return;
    }

    if (initialLoad && !cached) {
      setLoading(true);
    }
    setErrorMsg(null);

    const res = await getTrainingEvaluationDataAction(trainingId);

    if (!res.success) {
      if (initialLoad && !cached) {
        setErrorMsg(res.error || "Nie udało się pobrać jednostki.");
      }
    } else if (res.training && res.squad) {
      const squad = res.squad as EvaluationPlayer[];
      const initialMarks = res.initialMarks || {};

      setTraining(res.training);
      setPlayers(squad);
      setMarks(initialMarks);
      setSurveySummary(res.surveySummary || null);

      cacheEvaluationData(trainingId, {
        training: res.training,
        squad,
        initialMarks,
      });

      // BR-021: Wznawianie pozycji z localStorage lub pierwszego nieocenionego
      if (initialLoad) {
        const savedIndexRaw = localStorage.getItem(STORAGE_KEY_INDEX);
        const savedIndex = savedIndexRaw !== null ? parseInt(savedIndexRaw, 10) : null;

        if (savedIndex !== null && !isNaN(savedIndex) && savedIndex >= 0 && savedIndex <= squad.length) {
          setIndex(savedIndex);
        } else {
          const firstUnrated = squad.findIndex((p: SquadPlayer) => !initialMarks[p.id]);
          if (firstUnrated !== -1) {
            setIndex(firstUnrated);
          } else if (squad.length > 0) {
            setIndex(squad.length);
          }
        }
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchEvaluationData(true);
  }, [trainingId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground font-mono">Ładowanie protokołu jednostki…</p>;
  }

  if (errorMsg || !training) {
    return (
      <div className="print-card rounded-md border-2 border-destructive/40 bg-card p-6">
        <h1 className="font-heading text-4xl text-destructive uppercase">Nie udało się otworzyć jednostki</h1>
        <p className="mt-3 font-mono text-sm text-destructive">{errorMsg || "Brak danych treningu."}</p>
        <Link href="/trener" className={cn(buttonVariants({ size: "lg" }), "mt-6 inline-flex h-11 px-4")}>
          Wróć do jednostek
        </Link>
      </div>
    );
  }

  const total = players.length;
  const done = ratedCount(players, marks);
  const player = players[index];
  const finished = index >= total;
  const isOwner = training.isOwner ?? true;

  const hasAnyParentContacts = players.some((p) => Boolean(p.parentPhone));

  // BR-021: Zapis z natychmiastowym buforem lokalnym i kolejką offline
  async function commit(mark: Mark) {
    if (!player) return;
    if (!isOwner) {
      alert("Nie możesz edytować ocen treningu prowadzonego przez innego trenera.");
      return;
    }

    const nextIndex = Math.min(index + 1, total);

    // 1. Natychmiastowy stan UI i cache Zustand
    setMarks((curr) => ({ ...curr, [player.id]: mark }));
    setAbsenceModalOpen(false);
    setSelectedAbsenceReason(null);
    setIndex(nextIndex);
    updateMarkInCache(trainingId, player.id, mark);

    // 2. BR-021: Zapis pozycji sesji w pamięci urządzenia
    try {
      localStorage.setItem(STORAGE_KEY_INDEX, nextIndex.toString());
    } catch {}

    // 3. Wysłanie na serwer lub do kolejki offline w razie braku sieci
    try {
      const res = await savePlayerMarkAction(trainingId, player.id, mark);
      if (!res.success) {
        throw new Error(res.error || "Błąd zapisu");
      }
      setSyncStatus("synced");
    } catch {
      // Zapisujemy do kolejki w localStorage na wypadek utraty zasięgu
      try {
        const rawQueue = localStorage.getItem(STORAGE_KEY_QUEUE);
        const queue: OfflineQueueItem[] = rawQueue ? JSON.parse(rawQueue) : [];
        queue.push({
          trainingId,
          playerId: player.id,
          mark,
          timestamp: Date.now(),
        });
        localStorage.setItem(STORAGE_KEY_QUEUE, JSON.stringify(queue));
        setPendingQueueCount(queue.length);
        setSyncStatus("offline");
      } catch {}
    }
  }

  async function handleReset() {
    if (!isOwner) {
      alert("Nie masz uprawnień do resetowania ocen w tym treningu.");
      return;
    }
    if (!window.confirm("Czy na pewno chcesz usunąć wszystkie wystawione oceny dla tego treningu?")) {
      return;
    }
    setResetting(true);
    const res = await resetTrainingEvaluationsAction(trainingId);
    if (res.success) {
      setMarks({});
      setIndex(0);
      setAbsenceModalOpen(false);
      setSelectedAbsenceReason(null);
      resetCachedMarks(trainingId);

      // BR-021: Czyszczenie bufora lokalnego
      try {
        localStorage.removeItem(STORAGE_KEY_INDEX);
        localStorage.removeItem(STORAGE_KEY_QUEUE);
        setPendingQueueCount(0);
        setSyncStatus("synced");
      } catch {}
    } else {
      alert(res.error || "Wystąpił błąd podczas usuwania ocen.");
    }
    setResetting(false);
  }

  function goTo(next: number) {
    setAbsenceModalOpen(false);
    setSelectedAbsenceReason(null);
    setIndex(next);
    try {
      localStorage.setItem(STORAGE_KEY_INDEX, next.toString());
    } catch {}
  }

  async function handleGuestAdded() {
    setLoading(true);
    invalidateCache();

    const res = await getTrainingEvaluationDataAction(trainingId);
    if (res.success && res.training && res.squad) {
      const squad = res.squad as EvaluationPlayer[];
      const initialMarks = res.initialMarks || {};

      setTraining(res.training);
      setPlayers(squad);
      setMarks(initialMarks);
      setSurveySummary(res.surveySummary || null);

      cacheEvaluationData(trainingId, {
        training: res.training,
        squad,
        initialMarks,
      });

      const firstUnrated = squad.findIndex((p) => !initialMarks[p.id]);
      const targetIndex = firstUnrated !== -1 ? firstUnrated : squad.length - 1;
      setIndex(targetIndex);
      try {
        localStorage.setItem(STORAGE_KEY_INDEX, targetIndex.toString());
      } catch {}
    }
    setLoading(false);
  }

  const filteredSosPlayers = players.filter(
    (p) =>
      Boolean(p.parentPhone) &&
      `${p.firstName} ${p.lastName} ${p.jerseyNumber}`.toLowerCase().includes(sosSearch.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-xl pb-8">
      {/* GÓRNY PASEK NAWIGACYJNY ZE WSKAŹNIKIEM BR-021 */}
      <div className="flex items-center justify-between gap-2">
        <Link href="/trener" className="pitch-link text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          ← Wróć do jednostek
        </Link>

        <div className="flex items-center gap-2">
          {/* BR-021: Wskaźnik zapisu i odporności sesji */}
          {syncStatus === "syncing" ? (
            <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-primary animate-pulse">
              <RefreshCw className="size-3 animate-spin" />
              <span>Zapisuję...</span>
            </span>
          ) : syncStatus === "offline" ? (
            <button
              type="button"
              onClick={flushOfflineQueue}
              className="flex items-center gap-1 rounded-md bg-amber-500/15 border border-amber-600/30 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300"
              title="Czeka na połączenie z siecią. Kliknij, aby ponowić próbę."
            >
              <CloudOff className="size-3" />
              <span>Offline ({pendingQueueCount})</span>
            </button>
          ) : (
            <span className="hidden sm:flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
              <CloudCheck className="size-3 text-emerald-600" />
              <span>Zapisano w locie</span>
            </span>
          )}

          {isOwner && (
            <button
              type="button"
              onClick={() => setGuestModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border-2 border-foreground/20 bg-background px-2.5 py-1 font-mono text-[11px] font-bold text-foreground uppercase tracking-wide hover:border-primary hover:text-primary active:scale-95 transition-all shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <UserPlus className="size-3.5" />
              <span className="hidden sm:inline">+ Gość</span>
              <span className="sm:hidden">+</span>
            </button>
          )}

          {hasAnyParentContacts && (
            <button
              type="button"
              onClick={() => setSosModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border-2 border-destructive bg-destructive/10 px-2.5 py-1 font-mono text-[11px] font-bold text-destructive uppercase tracking-wide hover:bg-destructive/20 active:scale-95 transition-all shadow-[2px_2px_0_0_var(--foreground)]"
            >
              <span className="size-2 rounded-full bg-destructive animate-pulse" />
              <span>SOS · Rodzice</span>
            </button>
          )}

          <span className="font-mono text-xs font-semibold text-primary">
            {training.teamName} · {training.startTime}–{training.endTime}
          </span>
        </div>
      </div>

      {!isOwner && (
        <div className="mt-2.5 flex items-center justify-between rounded-lg border-2 border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-900 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <Lock className="size-4 shrink-0 text-amber-600" />
            <span>Tryb podglądu (Prowadzący: {training.leadCoachName || "Inny trener"})</span>
          </div>
          <span className="font-mono text-[10px] uppercase opacity-80">Tylko odczyt</span>
        </div>
      )}

      {/* GŁÓWNA KARTA OCENIANIA */}
      <div className="print-card mt-3 overflow-hidden rounded-xl border-2 border-foreground/20 bg-card shadow-sm">
        <div className="mow-stripes flex items-center justify-between gap-3 px-4 py-2.5 text-chalk">
          <p className="text-xs font-medium uppercase tracking-wider">Ocena składu</p>
          <p className="font-mono text-xs font-bold tabular-nums">
            {done} z {total} ocenionych
          </p>
        </div>
        <div className="h-1.5 bg-muted" role="progressbar">
          <div
            className="h-full bg-primary transition-[width] duration-300"
            style={{ width: `${total > 0 ? (done / total) * 100 : 0}%` }}
          />
        </div>

        {finished || !player ? (
          <Summary
            trainingId={trainingId}
            players={players}
            marks={marks}
            resetting={resetting}
            isOwner={isOwner}
            initialSurveyEnabled={training.surveyEnabled}
            surveySummary={surveySummary}
            onEdit={goTo}
            onReset={handleReset}
            onSurveyActivated={async () => {
              updateCachedSurveyStatus(trainingId, true);
              const fresh = await getTrainingEvaluationDataAction(trainingId);
              if (fresh.success && fresh.surveySummary) {
                setSurveySummary(fresh.surveySummary);
              }
            }}
          />
        ) : (
          <div className="p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between rounded-lg border border-foreground/10 bg-muted/40 px-3 py-1.5 font-mono text-[11px] font-semibold tracking-tight text-muted-foreground">
              <span className="flex items-center gap-1 text-minus">
                <ArrowLeft className="size-3" /> Słabiej
              </span>
              <span className="flex items-center gap-1 text-zero">
                <ArrowUp className="size-3" /> Typowo
              </span>
              <span className="flex items-center gap-1 text-plus">
                Powyżej <ArrowRight className="size-3" />
              </span>
              <span className="flex items-center gap-1 text-foreground">
                Uraz <ArrowDown className="size-3" />
              </span>
            </div>

            <TinderCard
              key={player.id}
              player={player}
              index={index}
              total={total}
              currentMark={marks[player.id]}
              disabled={!isOwner}
              onSwipeLeft={() => commit({ type: "score", score: "-" })}
              onSwipeRight={() => commit({ type: "score", score: "+" })}
              onSwipeUp={() => commit({ type: "score", score: "0" })}
              onSwipeDown={() => {
                if (!isOwner) return;
                setSelectedAbsenceReason(null);
                setAbsenceModalOpen(true);
              }}
            />

            <div className="mt-4 flex flex-col items-center gap-2.5">
              <div className="flex w-full items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => commit({ type: "score", score: "-" })}
                  aria-label="Ocena: Słabiej (-)"
                  className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-minus/50 bg-minus/10 font-heading text-xl font-bold text-minus shadow-[2px_2px_0_0_var(--foreground)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="size-5 stroke-[3]" />
                  <span>Słabiej</span>
                </button>

                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => commit({ type: "score", score: "0" })}
                  aria-label="Ocena: Typowo (0)"
                  className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-zero/60 bg-zero/15 font-heading text-xl font-bold text-foreground shadow-[2px_2px_0_0_var(--foreground)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl leading-none">0</span>
                  <span>Typowo</span>
                </button>

                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => commit({ type: "score", score: "+" })}
                  aria-label="Ocena: Powyżej (+)"
                  className="flex h-14 flex-1 items-center justify-center gap-1.5 rounded-xl border-2 border-plus/50 bg-plus/10 font-heading text-xl font-bold text-plus shadow-[2px_2px_0_0_var(--foreground)] transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="text-2xl leading-none">+</span>
                  <span>Powyżej</span>
                </button>
              </div>

              <div className="flex w-full items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-10 px-3 text-xs"
                  disabled={index === 0}
                  onClick={() => goTo(Math.max(0, index - 1))}
                >
                  <ChevronLeft className="size-4" />
                  Cofnij
                </Button>

                <button
                  type="button"
                  disabled={!isOwner}
                  onClick={() => {
                    setSelectedAbsenceReason(null);
                    setAbsenceModalOpen(true);
                  }}
                  className={cn(
                    "flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border-2 text-xs font-semibold transition active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
                    marks[player.id]?.type === "absence"
                      ? "border-foreground bg-secondary font-bold"
                      : "border-foreground/20 bg-background hover:bg-muted"
                  )}
                >
                  <UserX className="size-4" />
                  <span>Nieobecność / Kontuzja (↓)</span>
                </button>

                {done === total && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="h-10 px-3 text-xs font-bold"
                    onClick={() => goTo(total)}
                  >
                    Koniec
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <AddGuestPlayerModal
        trainingId={trainingId}
        isOpen={guestModalOpen}
        onClose={() => setGuestModalOpen(false)}
        onPlayerAdded={handleGuestAdded}
      />

      {sosModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-background/98 p-4 backdrop-blur-md sm:p-8 animate-in fade-in duration-200">
          <div className="mx-auto w-full max-w-lg">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold tracking-widest text-destructive uppercase">
                  Procedura awaryjna
                </span>
                <h2 className="font-heading text-3xl tracking-tight">Telefony do rodziców</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Natychmiastowe połączenie z opiekunem w razie urazu na boisku.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSosModalOpen(false)}
                className="rounded-full border-2 border-foreground/20 p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="mt-4">
              <div className="relative flex items-center">
                <Search className="absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Szukaj po nazwisku lub numerze..."
                  value={sosSearch}
                  onChange={(e) => setSosSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border-2 border-foreground/20 bg-card pl-9 pr-3 font-mono text-xs outline-none focus:border-foreground"
                />
              </div>
            </div>

            <div className="mt-4 max-h-[50vh] overflow-y-auto space-y-2 pr-1">
              {filteredSosPlayers.length === 0 ? (
                <p className="py-6 text-center font-mono text-xs text-muted-foreground">
                  Brak numerów do rodziców dla wybranego filtru.
                </p>
              ) : (
                filteredSosPlayers.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-lg border-2 border-foreground/20 bg-card p-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-heading text-lg">
                        <span className="mr-1.5 font-mono text-xs text-primary">#{p.jerseyNumber}</span>
                        {playerName(p)}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium truncate">
                        Opiekun: {p.parentName || "Rodzic / Opiekun"}
                      </p>
                    </div>

                    <a
                      href={`tel:${p.parentPhone}`}
                      className="flex items-center gap-1.5 rounded-lg border-2 border-emerald-700 bg-emerald-600 px-3 py-1.5 font-mono text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition shrink-0"
                    >
                      <Phone className="size-3.5" />
                      <span>{p.parentPhone}</span>
                    </a>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mx-auto w-full max-w-lg border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-11 text-sm font-semibold"
              onClick={() => setSosModalOpen(false)}
            >
              Zamknij kontakty
            </Button>
          </div>
        </div>
      )}

      {absenceModalOpen && player && (
        <div className="fixed inset-0 z-50 flex flex-col justify-between bg-background/98 p-4 backdrop-blur-md sm:p-8 animate-in fade-in duration-200">
          <div className="mx-auto w-full max-w-lg">
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <span className="text-xs font-bold tracking-widest text-primary uppercase">Status obecności</span>
                <h2 className="font-heading text-3xl tracking-tight">
                  {playerName(player)} (#{player.jerseyNumber})
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Nieobecność nie zaniża średniej ocen (nie jest traktowana jako minus).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAbsenceModalOpen(false)}
                className="rounded-full border-2 border-foreground/20 p-2 hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {!selectedAbsenceReason ? (
              <div className="mt-6 space-y-3">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Wybierz powód nieobecności:
                </p>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {ABSENCE_REASONS.map((reason) => (
                    <button
                      key={reason.id}
                      type="button"
                      onClick={() => {
                        if (reason.id === "injury") {
                          setSelectedAbsenceReason("injury");
                        } else {
                          commit({ type: "absence", reason: reason.id });
                        }
                      }}
                      className={cn(
                        "flex flex-col items-start justify-center rounded-xl border-2 p-4 text-left transition duration-150 active:scale-[0.98]",
                        reason.id === "injury"
                          ? "border-destructive/60 bg-destructive/5 hover:border-destructive hover:bg-destructive/10"
                          : "border-foreground/20 bg-card hover:border-foreground hover:bg-secondary"
                      )}
                    >
                      <span className="font-heading text-xl tracking-wide">{reason.label}</span>
                      <span className="mt-0.5 text-xs text-muted-foreground">
                        {reason.id === "injury" ? "Rejestracja urazu medycznego" : "Standardowe usprawiedliwienie"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold tracking-wider text-destructive uppercase">
                    Rodzaj kontuzji:
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedAbsenceReason(null)}
                    className="text-xs font-medium text-muted-foreground underline hover:text-foreground"
                  >
                    ← Inny powód
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {INJURY_KINDS.map((kind) => (
                    <button
                      key={kind.id}
                      type="button"
                      onClick={() => commit({ type: "absence", reason: "injury", injury: kind.id })}
                      className="flex flex-col items-center justify-center rounded-xl border-2 border-foreground/20 bg-card p-3 text-center transition duration-150 hover:border-destructive hover:bg-destructive/10 active:scale-[0.98]"
                    >
                      <InjuryIcon kind={kind.id} className="size-8 text-destructive" />
                      <span className="mt-2 font-heading text-base leading-tight">{kind.label}</span>
                      <span className="mt-0.5 text-[11px] text-muted-foreground">{kind.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="mx-auto w-full max-w-lg border-t pt-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full h-11 text-sm font-semibold"
              onClick={() => setAbsenceModalOpen(false)}
            >
              Anuluj i wróć
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function TinderCard({
  player,
  index,
  total,
  currentMark,
  disabled,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
}: {
  player: EvaluationPlayer;
  index: number;
  total: number;
  currentMark?: Mark;
  disabled?: boolean;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onSwipeUp: () => void;
  onSwipeDown: () => void;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [flyDirection, setFlyDirection] = useState<"left" | "right" | "up" | "down" | null>(null);

  const startPos = useRef({ x: 0, y: 0 });

  function handlePointerDown(e: React.PointerEvent) {
    if (flyDirection || disabled) return;
    setIsDragging(true);
    startPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging || flyDirection || disabled) return;
    const dx = e.clientX - startPos.current.x;
    const dy = e.clientY - startPos.current.y;
    setDrag({ x: dx, y: dy });
  }

  const distance = Math.hypot(drag.x, drag.y);
  const angle = (Math.atan2(drag.y, drag.x) * 180) / Math.PI;

  let activeDirection: "left" | "right" | "up" | "down" | null = null;
  if (distance > 22) {
    if (angle >= -145 && angle <= -35) {
      activeDirection = "up";
    } else if (angle >= 35 && angle <= 145) {
      activeDirection = "down";
    } else if (angle > -35 && angle < 35) {
      activeDirection = "right";
    } else {
      activeDirection = "left";
    }
  }

  function handlePointerUp(e: React.PointerEvent) {
    if (!isDragging || flyDirection || disabled) return;
    setIsDragging(false);

    const threshold = 70;

    if (distance >= threshold && activeDirection) {
      if (activeDirection === "right") {
        setFlyDirection("right");
        setTimeout(onSwipeRight, 200);
        return;
      }
      if (activeDirection === "left") {
        setFlyDirection("left");
        setTimeout(onSwipeLeft, 200);
        return;
      }
      if (activeDirection === "up") {
        setFlyDirection("up");
        setTimeout(onSwipeUp, 200);
        return;
      }
      if (activeDirection === "down") {
        setDrag({ x: 0, y: 0 });
        onSwipeDown();
        return;
      }
    }

    setDrag({ x: 0, y: 0 });
  }

  const stampStrength = Math.min(Math.max((distance - 20) / 55, 0), 1);
  const opacityLeft = activeDirection === "left" ? stampStrength : 0;
  const opacityRight = activeDirection === "right" ? stampStrength : 0;
  const opacityUp = activeDirection === "up" ? stampStrength : 0;
  const opacityDown = activeDirection === "down" ? stampStrength : 0;

  let transformStyle = "";
  let opacityStyle = 1;

  if (flyDirection === "left") {
    transformStyle = "translate3d(-130%, 0, 0) rotate(-20deg)";
    opacityStyle = 0;
  } else if (flyDirection === "right") {
    transformStyle = "translate3d(130%, 0, 0) rotate(20deg)";
    opacityStyle = 0;
  } else if (flyDirection === "up") {
    transformStyle = "translate3d(0, -90px, 0) scale(0.85)";
    opacityStyle = 0;
  } else {
    const isVerticalMove = activeDirection === "up" || activeDirection === "down";
    const rotate = isVerticalMove ? drag.x * 0.02 : drag.x * 0.08;
    transformStyle = `translate3d(${drag.x}px, ${drag.y}px, 0) rotate(${rotate}deg)`;
  }

  let borderGlow = "border-foreground/20";
  if (opacityLeft > 0.2) borderGlow = "border-minus shadow-[0_0_25px_rgba(239,68,68,0.4)]";
  else if (opacityRight > 0.2) borderGlow = "border-plus shadow-[0_0_25px_rgba(34,197,94,0.4)]";
  else if (opacityUp > 0.2) borderGlow = "border-zero shadow-[0_0_25px_rgba(234,179,8,0.45)]";
  else if (opacityDown > 0.2) borderGlow = "border-foreground shadow-[0_0_20px_rgba(0,0,0,0.3)]";

  return (
    <div className="relative mx-auto flex h-[360px] w-full max-w-sm items-center justify-center select-none touch-none sm:h-[400px]">
      <div className="absolute inset-x-2 inset-y-2 rounded-2xl border-2 border-foreground/10 bg-muted/70 opacity-50" />

      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: transformStyle,
          opacity: opacityStyle,
          transition: isDragging ? "none" : "transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.2s ease-out",
        }}
        className={cn(
          "relative flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-2xl border-4 bg-card p-5 shadow-[6px_6px_0_0_var(--foreground)] active:cursor-grabbing sm:p-6",
          borderGlow,
          disabled && "cursor-default active:cursor-default"
        )}
      >
        <div
          style={{ opacity: opacityLeft }}
          className="pointer-events-none absolute top-6 right-6 rotate-12 rounded-lg border-4 border-minus bg-background/95 px-4 py-1.5 text-xl font-black tracking-widest text-minus uppercase shadow-md"
        >
          Słabiej (−)
        </div>

        <div
          style={{ opacity: opacityRight }}
          className="pointer-events-none absolute top-6 left-6 -rotate-12 rounded-lg border-4 border-plus bg-background/95 px-4 py-1.5 text-xl font-black tracking-widest text-plus uppercase shadow-md"
        >
          Powyżej (+)
        </div>

        <div
          style={{ opacity: opacityUp }}
          className="pointer-events-none absolute inset-x-8 top-1/2 -translate-y-1/2 text-center rounded-xl border-4 border-zero bg-background/95 p-3 text-xl font-black tracking-widest text-zero uppercase shadow-xl z-20"
        >
          Typowy poziom (0)
        </div>

        <div
          style={{ opacity: opacityDown }}
          className="pointer-events-none absolute top-6 inset-x-8 text-center rounded-lg border-4 border-foreground bg-background/95 py-2 text-sm font-black tracking-widest text-foreground uppercase shadow-md"
        >
          Nieobecność (↓)
        </div>

        <div className="flex items-center justify-between border-b border-border/80 pb-3">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 font-mono text-[11px] font-bold text-primary uppercase">
            Zawodnik {index + 1} / {total}
          </span>
          <span className="font-mono text-[11px] font-medium text-muted-foreground">
            {disabled ? "Tryb tylko do odczytu" : "Przesuń w dowolną stronę"}
          </span>
        </div>

        <div className="my-auto flex flex-col items-center text-center">
          <div className="relative size-24 sm:size-28">
            <div className="grid size-full place-items-center rounded-full border-4 border-foreground bg-muted font-heading text-4xl shadow-[3px_3px_0_0_var(--foreground)] overflow-hidden">
              {player.avatarUrl ? (
                <img
                  src={player.avatarUrl}
                  alt={playerName(player)}
                  className="size-full object-cover"
                />
              ) : (
                <span>
                  {player.firstName[0]}
                  {player.lastName[0]}
                </span>
              )}
            </div>

            <span className="absolute -right-1 -bottom-1 grid size-8 place-items-center rounded-full bg-primary font-mono text-xs font-bold text-primary-foreground shadow-sm z-10">
              #{player.jerseyNumber}
            </span>
          </div>

          <div className="mt-3">
            <div className="flex items-center justify-center gap-1.5">
              <h2 className="font-heading text-3xl leading-tight tracking-tight sm:text-4xl">
                {playerName(player)}
              </h2>
              {player.isGuest && (
                <span className="rounded bg-amber-500/15 border border-amber-600/30 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                  Gość
                </span>
              )}
            </div>
            <p className="mt-1 text-xs font-medium text-muted-foreground">
              {player.role} · ocena względem własnej normy
            </p>
          </div>
        </div>

        <div className="border-t border-border/80 pt-2.5 text-center text-[11px] text-muted-foreground">
          {currentMark ? (
            <p className="text-foreground">
              Wystawiona ocena: <span className="font-bold underline">{markLabel(currentMark)}</span>
            </p>
          ) : (
            <p>{disabled ? "Brak wpisu" : "Brak oceny — przeciągnij lub użyj przycisku"}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function Summary({
  trainingId,
  players,
  marks,
  resetting,
  isOwner,
  initialSurveyEnabled,
  surveySummary,
  onEdit,
  onReset,
  onSurveyActivated,
}: {
  trainingId: string;
  players: EvaluationPlayer[];
  marks: Record<string, Mark>;
  resetting: boolean;
  isOwner: boolean;
  initialSurveyEnabled?: boolean;
  surveySummary?: SurveySummary | null;
  onEdit: (index: number) => void;
  onReset: () => void;
  onSurveyActivated: () => void;
}) {
  const [surveyLoading, setSurveyLoading] = useState(false);
  const [surveyLink, setSurveyLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== "undefined" && typeof navigator.share === "function");

    if (initialSurveyEnabled) {
      setSurveyLink(`${window.location.origin}/ankieta/${trainingId}`);
    }
  }, [initialSurveyEnabled, trainingId]);

  const counts = players.reduce(
    (acc, player) => {
      const mark = marks[player.id];
      if (!mark) acc.missing += 1;
      else if (mark.type === "absence") acc.absent += 1;
      else if (mark.score === "-") acc.minus += 1;
      else if (mark.score === "0") acc.zero += 1;
      else acc.plus += 1;
      return acc;
    },
    { minus: 0, zero: 0, plus: 0, absent: 0, missing: 0 }
  );

  async function triggerNativeShare(url: string) {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "FORMA — Ankieta potreningowa",
          text: "Cześć! Prośba o wypełnienie krótkiej ankiety potreningowej RPE (zajmie 30 sekund):",
          url: url,
        });
        return;
      } catch (err: any) {
        if (err.name === "AbortError") return;
      }
    }
    await copyToClipboard(url);
  }

  async function copyToClipboard(url: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } catch (err) {
        console.error("Błąd kopiowania:", err);
      }
    }
  }

  async function handleEnableAndShare() {
    setSurveyLoading(true);
    const res = await enableTrainingSurveyAction(trainingId);

    if (res.success && res.surveyUrl) {
      const fullUrl = `${window.location.origin}${res.surveyUrl}`;
      setSurveyLink(fullUrl);
      setSurveyLoading(false);
      onSurveyActivated();

      if (canShare) {
        await triggerNativeShare(fullUrl);
      } else {
        await copyToClipboard(fullUrl);
      }
    } else {
      setSurveyLoading(false);
      alert(res.error || "Nie udało się aktywować ankiety.");
    }
  }

  return (
    <div className="step-in p-4 sm:p-8">
      <p className="text-xs font-bold tracking-widest text-primary uppercase">Protokół zamknięty</p>
      <h2 className="mt-1 font-heading text-3xl tracking-tight sm:text-4xl">Wszyscy zawodnicy ocenieni.</h2>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        Nieobecności i zgłoszone kontuzje zostały wyłączone ze sportowego bilansu formy zespołu.
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-lg border-2 border-minus/40 bg-minus/10 p-3">
          <dt className="text-[11px] font-semibold text-minus uppercase">Słabiej (−)</dt>
          <dd className="mt-0.5 font-heading text-3xl leading-none text-minus">{counts.minus}</dd>
        </div>
        <div className="rounded-lg border-2 border-zero/40 bg-zero/10 p-3">
          <dt className="text-[11px] font-semibold text-zero uppercase">Typowo (0)</dt>
          <dd className="mt-0.5 font-heading text-3xl leading-none text-zero">{counts.zero}</dd>
        </div>
        <div className="rounded-lg border-2 border-plus/40 bg-plus/10 p-3">
          <dt className="text-[11px] font-semibold text-plus uppercase">Powyżej (+)</dt>
          <dd className="mt-0.5 font-heading text-3xl leading-none text-plus">{counts.plus}</dd>
        </div>
        <div className="rounded-lg border-2 border-foreground/20 bg-muted/60 p-3">
          <dt className="text-[11px] font-semibold text-muted-foreground uppercase">Nieobecni</dt>
          <dd className="mt-0.5 font-heading text-3xl leading-none text-foreground">{counts.absent}</dd>
        </div>
      </dl>

      {surveySummary && surveySummary.isExpired ? (
        <div className="mt-5 rounded-2xl border-2 border-foreground/20 bg-card p-4 sm:p-5 shadow-[3px_3px_0_0_var(--foreground)] space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Activity className="size-4" />
              </span>
              <div>
                <h3 className="font-heading text-lg uppercase tracking-tight">
                  Podsumowanie ankiet RPE
                </h3>
                <p className="font-mono text-[11px] text-muted-foreground">
                  Termin 24h minął · Zarchiwizowane wyniki
                </p>
              </div>
            </div>
            <span className="rounded-md border border-foreground/15 bg-muted/60 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <Clock className="size-3" /> Wygasła
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            <div className="rounded-xl border border-foreground/15 bg-background p-3 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Users className="size-3 text-primary" /> Zwrotność
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-bold">
                  {surveySummary.completedSurveys}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  / {surveySummary.totalSurveys} ({surveySummary.responseRate}%)
                </span>
              </div>
              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-500" 
                  style={{ width: `${surveySummary.responseRate}%` }} 
                />
              </div>
            </div>

            <div className="rounded-xl border border-foreground/15 bg-background p-3 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Activity className="size-3 text-amber-600" /> Śr. Zmęczenie
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {surveySummary.avgFatigue !== null ? surveySummary.avgFatigue : "—"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">/ 5.0</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {Number(surveySummary.avgFatigue) >= 4
                  ? "Wysokie obciążenie"
                  : Number(surveySummary.avgFatigue) >= 2.5
                  ? "Optymalny wysiłek"
                  : "Niski wysiłek / rozruch"}
              </p>
            </div>

            <div className="rounded-xl border border-foreground/15 bg-background p-3 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Smile className="size-3 text-emerald-600" /> Śr. Zadowolenie
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-heading text-2xl font-bold text-emerald-700 dark:text-emerald-400">
                  {surveySummary.avgSatisfaction !== null ? surveySummary.avgSatisfaction : "—"}
                </span>
                <span className="font-mono text-xs text-muted-foreground">/ 5.0</span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground">
                {Number(surveySummary.avgSatisfaction) >= 4
                  ? "Wysoka satysfakcja"
                  : "Średni odbiór"}
              </p>
            </div>
          </div>

          {surveySummary.notes && surveySummary.notes.length > 0 && (
            <div className="space-y-2 pt-1">
              <span className="font-heading text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <MessageSquare className="size-3.5 text-primary" /> Uwagi od zawodników ({surveySummary.notes.length})
              </span>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {surveySummary.notes.map((n, idx) => (
                  <div key={idx} className="rounded-xl border border-foreground/15 bg-background p-2.5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-heading font-bold uppercase">
                        {n.jerseyNumber ? `#${n.jerseyNumber} ` : ""}{n.playerName}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        Zmęczenie: {n.fatigue}/5
                      </span>
                    </div>
                    <p className="text-foreground/90 italic">„{n.feedbackNote}”</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-heading text-lg uppercase tracking-wide text-primary">
                Ankieta potreningowa RPE
              </h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Udostępnij link zawodnikom, aby ocenili zmęczenie i jakość treningu (30 sekund).
              </p>
            </div>
            <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold uppercase text-primary shrink-0">
              24h ważności
            </span>
          </div>

          {surveyLink ? (
            <div className="mt-4 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2.5">
                {canShare && (
                  <button
                    type="button"
                    onClick={() => triggerNativeShare(surveyLink)}
                    className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-primary text-primary-foreground font-heading text-xs uppercase tracking-wider shadow-[2px_2px_0_0_var(--foreground)] active:scale-95 transition-all"
                  >
                    <Share2 className="size-4" />
                    <span>Wyślij (WhatsApp / SMS / Inne)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => copyToClipboard(surveyLink)}
                  className={cn(
                    "flex items-center justify-center gap-2 h-12 px-5 rounded-xl border-2 font-heading text-xs uppercase tracking-wider shadow-[2px_2px_0_0_var(--foreground)] active:scale-95 transition-all",
                    canShare ? "sm:w-auto" : "w-full",
                    copied
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-foreground/20 bg-card hover:bg-muted text-foreground"
                  )}
                >
                  {copied ? <Check className="size-4 stroke-[3]" /> : <ClipboardCopy className="size-4" />}
                  <span>{copied ? "Skopiowano do schowka!" : "Kopiuj link"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2 rounded-xl border-2 border-foreground/15 bg-background p-2">
                <input
                  type="text"
                  readOnly
                  value={surveyLink}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 bg-transparent px-2 font-mono text-xs text-foreground outline-none select-all truncate"
                />
              </div>
            </div>
          ) : (
            <button
              type="button"
              disabled={surveyLoading}
              onClick={handleEnableAndShare}
              className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-heading text-xs uppercase tracking-wider shadow-[3px_3px_0_0_var(--foreground)] active:scale-95 transition-all disabled:opacity-50"
            >
              <Share2 className="size-4" />
              <span>{surveyLoading ? "Aktywowanie ankiety..." : "Udostępnij ankietę zawodnikom"}</span>
            </button>
          )}
        </div>
      )}

      <ul className="mt-4 divide-y divide-border rounded-lg border-2 border-foreground/20 bg-card">
        {players.map((p, playerIndex) => {
          const mark = marks[p.id];
          const injury = mark?.type === "absence" && mark.reason === "injury" ? mark.injury : undefined;
          return (
            <li key={p.id} className="flex items-center justify-between gap-3 p-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {p.avatarUrl ? (
                  <img
                    src={p.avatarUrl}
                    alt={playerName(p)}
                    className="size-8 rounded-full object-cover border border-foreground/20 shrink-0"
                  />
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-muted font-heading text-xs shrink-0 border">
                    {p.firstName[0]}
                    {p.lastName[0]}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold flex items-center gap-1.5">
                    <span className="font-mono text-muted-foreground">#{p.jerseyNumber}</span>
                    <span>{playerName(p)}</span>
                    {p.isGuest && (
                      <span className="rounded bg-amber-500/15 border border-amber-600/30 px-1 py-0.2 font-mono text-[9px] font-bold text-amber-800 dark:text-amber-300 uppercase">
                        Gość
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                    {injury ? <InjuryIcon kind={injury} className="size-3.5 shrink-0 text-destructive" /> : null}
                    <span>{mark ? markLabel(mark) : "Brak oceny"}</span>
                  </p>
                </div>
              </div>

              {isOwner && (
                <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => onEdit(playerIndex)}>
                  Popraw
                </Button>
              )}
            </li>
          );
        })}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {isOwner && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-10 px-4 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={resetting}
            onClick={onReset}
          >
            <RotateCcw className={cn("mr-1.5 size-3.5", resetting && "animate-spin")} />
            {resetting ? "Resetowanie..." : "Wyczyść oceny"}
          </Button>
        )}

        <Link href="/trener" className={cn(buttonVariants({ size: "default" }), "h-10 flex-1 px-4 font-semibold text-xs")}>
          Wróć do listy jednostek
        </Link>
      </div>
    </div>
  );
}