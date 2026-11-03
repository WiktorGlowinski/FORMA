"use client";

import { useState, useRef } from "react";
import { 
  Calendar, 
  Plus, 
  Shield, 
  CheckCircle2, 
  Archive, 
  Clock, 
  Upload, 
  Trash2, 
  Loader2, 
  X, 
  AlertCircle 
} from "lucide-react";
import { 
  createAndActivateSeasonAction, 
  setCurrentSeasonAction, 
  updateClubLogoAction 
} from "@/app/actions/admin";
import { uploadImageAction } from "@/app/actions/upload";
import { cn } from "@/lib/utils";

interface SeasonItem {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function SeasonsManager({
  initialSeasons,
  clubName,
  initialLogoUrl,
}: {
  initialSeasons: SeasonItem[];
  clubName: string;
  initialLogoUrl: string | null;
}) {
  const [seasons, setSeasons] = useState<SeasonItem[]>(initialSeasons);
  const [logoUrl, setLogoUrl] = useState<string>(initialLogoUrl || "");
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoSuccessMsg, setLogoSuccessMsg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modal nowego sezonu
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newSeasonName, setNewSeasonName] = useState("2026/2027");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2027-06-30");
  const [isSubmittingSeason, setIsSubmittingSeason] = useState(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  // Tworzenie i automatyczna aktywacja nowego sezonu
  async function handleCreateSeason(e: React.FormEvent) {
    e.preventDefault();
    if (!newSeasonName.trim() || !startDate || !endDate) return;

    setIsSubmittingSeason(true);
    const res = await createAndActivateSeasonAction({
      name: newSeasonName.trim(),
      startDate,
      endDate,
    });

    if (res.success && res.seasonId) {
      setSeasons((prev) => [
        {
          id: res.seasonId!,
          name: newSeasonName.trim(),
          start_date: startDate,
          end_date: endDate,
          is_current: true,
        },
        ...prev.map((s) => ({ ...s, is_current: false })),
      ]);
      setIsCreateModalOpen(false);
    } else {
      alert(res.error || "Nie udało się utworzyć sezonu.");
    }
    setIsSubmittingSeason(false);
  }

  // Przełączanie aktywnego sezonu
  async function handleSetCurrent(seasonId: string) {
    setSwitchingId(seasonId);
    const res = await setCurrentSeasonAction(seasonId);

    if (res.success) {
      setSeasons((prev) =>
        prev.map((s) => ({
          ...s,
          is_current: s.id === seasonId,
        }))
      );
    } else {
      alert(res.error || "Nie udało się zmienić aktywnego sezonu.");
    }
    setSwitchingId(null);
  }

  // Bezpośredni upload herbu do Supabase Storage
  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setLogoSuccessMsg(false);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bucket", "club-assets");
    formData.append("folder", "logos");

    const uploadRes = await uploadImageAction(formData);

    if (uploadRes.success && uploadRes.url) {
      const saveRes = await updateClubLogoAction(uploadRes.url);

      if (saveRes.success) {
        setLogoUrl(uploadRes.url);
        setLogoSuccessMsg(true);
        setTimeout(() => setLogoSuccessMsg(false), 3500);
      } else {
        alert(saveRes.error || "Plik wgrany, ale nie udało się zaktualizować bazy.");
      }
    } else {
      alert(uploadRes.error || "Wystąpił błąd podczas wgrywania pliku.");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setIsUploadingLogo(false);
  }

  // Usunięcie herbu
  async function handleRemoveLogo() {
    if (!window.confirm("Czy na pewno chcesz usunąć herb klubu?")) return;

    setIsUploadingLogo(true);
    const res = await updateClubLogoAction("");

    if (res.success) {
      setLogoUrl("");
      setLogoSuccessMsg(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } else {
      alert(res.error || "Błąd podczas usuwania herbu.");
    }
    setIsUploadingLogo(false);
  }

  const currentSeason = seasons.find((s) => s.is_current);

  return (
    <div className="space-y-8 pb-16">
      {/* UKRYTY INPUT PLIKU DO OBSŁUGI BUCKETA */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        onChange={handleLogoUpload}
        className="hidden"
      />

      {/* NAGŁÓWEK MODUŁU */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between border-b-2 border-foreground/15 pb-6">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Cykl Rozgrywkowy & Identyfikacja
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight sm:text-5xl">
            Sezony & Herb
          </h1>
          <p className="mt-1 font-mono text-xs text-muted-foreground">
            Zarządzaj cyklem ewaluacji, archiwizacją okresów oraz oficjalnym herbem {clubName}.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border-2 border-foreground bg-primary px-4 text-xs font-heading uppercase tracking-wider font-black text-primary-foreground transition active:scale-95 shadow-[3px_3px_0_0_var(--foreground)] shrink-0"
        >
          <Plus className="size-4 stroke-[3]" />
          <span>Nowy sezon</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEWA STRONA: LISTA SEZONÓW (7/12) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Historia Cykli Rozgrywkowych ({seasons.length})
            </span>
            {currentSeason && (
              <span className="font-mono text-xs text-primary font-bold">
                Aktywny: {currentSeason.name}
              </span>
            )}
          </div>

          {seasons.length === 0 ? (
            <div className="rounded-2xl border-2 border-foreground/20 bg-card p-8 text-center text-xs font-mono text-muted-foreground">
              Brak zdefiniowanych sezonów. Kliknij przycisk powyżej, aby otworzyć pierwszy cykl.
            </div>
          ) : (
            <div className="space-y-3">
              {seasons.map((s) => (
                <div
                  key={s.id}
                  className={cn(
                    "rounded-2xl border-2 p-5 transition-all",
                    s.is_current
                      ? "border-foreground bg-card shadow-[3px_3px_0_0_var(--foreground)]"
                      : "border-foreground/15 bg-card/60"
                  )}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-heading text-2xl uppercase tracking-tight">
                          {s.name}
                        </span>
                        {s.is_current ? (
                          <span className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 font-mono text-[10px] font-black uppercase text-primary-foreground">
                            <CheckCircle2 className="size-3" />
                            Bieżący
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-muted border border-foreground/15 px-2 py-0.5 font-mono text-[10px] uppercase text-muted-foreground">
                            <Archive className="size-3" />
                            Zarchiwizowany
                          </span>
                        )}
                      </div>

                      <div className="mt-2 flex items-center gap-2 text-xs font-mono text-muted-foreground">
                        <Clock className="size-3.5 text-primary" />
                        <span>
                          {s.start_date} &rarr; {s.end_date}
                        </span>
                      </div>
                    </div>

                    {!s.is_current && (
                      <button
                        type="button"
                        disabled={switchingId === s.id}
                        onClick={() => handleSetCurrent(s.id)}
                        className="inline-flex h-9 items-center justify-center rounded-xl border-2 border-foreground/20 bg-background px-3 text-xs font-heading uppercase tracking-wider font-bold hover:bg-muted transition-all active:scale-95 shadow-[2px_2px_0_0_var(--foreground)] shrink-0 disabled:opacity-50"
                      >
                        {switchingId === s.id ? "Aktywacja..." : "Ustaw jako bieżący"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PRAWA STRONA: HERB I IDENTYFIKACJA KLUBU Z BUCKETEM STORAGE (5/12) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="px-1">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Identyfikacja Wizualna
            </span>
          </div>

          <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 sm:p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-4">
              {/* Klikalny kontener herbu (otwiera wybór pliku) */}
              <div 
                onClick={() => !isUploadingLogo && fileInputRef.current?.click()}
                className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-foreground/30 bg-muted/40 transition hover:border-foreground hover:bg-muted overflow-hidden shadow-[2px_2px_0_0_var(--foreground)]"
              >
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt={`Herb ${clubName}`}
                    className="size-full object-contain p-2 group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <Shield className="size-8 text-muted-foreground group-hover:text-foreground transition-colors" />
                )}

                {isUploadingLogo ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-xs">
                    <Loader2 className="size-6 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-foreground/60 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="font-mono text-[10px] font-bold text-background uppercase">Zmień</span>
                  </div>
                )}
              </div>

              <div>
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-primary block">
                  Herb Organizacji
                </span>
                <h3 className="font-heading text-xl uppercase tracking-tight">
                  {clubName}
                </h3>
                <p className="font-mono text-xs text-muted-foreground mt-0.5">
                  Widoczny w nagłówkach raportów i podsumowań sztabu.
                </p>
              </div>
            </div>

            {logoSuccessMsg && (
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5 text-xs font-mono text-primary flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="size-4 shrink-0" />
                <span>Herb klubu został pomyślnie zaktualizowany!</span>
              </div>
            )}

            <div className="pt-2 border-t border-border flex items-center gap-2.5">
              <button
                type="button"
                disabled={isUploadingLogo}
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] transition-all active:scale-95 disabled:opacity-50"
              >
                {isUploadingLogo ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    <span>Wgrywanie...</span>
                  </>
                ) : (
                  <>
                    <Upload className="size-4" />
                    <span>{logoUrl ? "Zmień plik herbu" : "Wgraj herb z dysku"}</span>
                  </>
                )}
              </button>

              {logoUrl && (
                <button
                  type="button"
                  disabled={isUploadingLogo}
                  onClick={handleRemoveLogo}
                  title="Usuń herb"
                  className="size-11 inline-flex items-center justify-center rounded-xl border-2 border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20 active:scale-95 transition-all shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50 shrink-0"
                >
                  <Trash2 className="size-4" />
                </button>
              )}
            </div>

            <p className="font-mono text-[10px] text-muted-foreground text-center">
              Obsługiwane formaty: PNG, SVG, JPG lub WEBP (do 4.5 MB).
            </p>
          </div>
        </div>
      </div>

      {/* MODAL: TWORZENIE NOWEGO SEZONU */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground bg-card p-6 shadow-[5px_5px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-heading text-2xl uppercase tracking-tight">Nowy Sezon</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="rounded-full border p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSeason} className="space-y-4">
              <div>
                <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                  Nazwa cyklu
                </label>
                <input
                  type="text"
                  required
                  placeholder="np. 2026/2027"
                  value={newSeasonName}
                  onChange={(e) => setNewSeasonName(e.target.value)}
                  className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Data startu
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-xs outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="font-mono text-xs font-bold uppercase text-muted-foreground block mb-1">
                    Data końca
                  </label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 font-mono text-xs outline-none focus:border-foreground"
                  />
                </div>
              </div>

              <div className="rounded-xl border border-foreground/15 bg-background p-3 text-xs font-mono text-muted-foreground flex items-start gap-2">
                <AlertCircle className="size-4 text-primary shrink-0 mt-0.5" />
                <span>Utworzenie nowego sezonu automatycznie oznaczy go jako bieżący i zarchiwizuje poprzedni.</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground/20 bg-background font-heading text-xs uppercase hover:bg-muted"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSeason}
                  className="h-11 w-1/2 rounded-xl border-2 border-foreground bg-primary font-heading text-xs font-bold uppercase text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)] disabled:opacity-50"
                >
                  {isSubmittingSeason ? "Zapisuję..." : "Otwórz cykl"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}