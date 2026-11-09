"use client";

import { 
  Copy, 
  Check, 
  Activity, 
  Smile, 
  Clock, 
  MessageSquare, 
  Users, 
  Share2, 
  ChevronDown, 
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SurveyStatusItem, SurveySummary } from "@/app/actions/coach";
import { useSurveyStore } from "@/store/useSurveyStore";

interface TrainingSurveyPanelProps {
  surveys: SurveyStatusItem[];
  summary?: SurveySummary;
  shareText?: string;
}

export function TrainingSurveyPanel({
  surveys,
  summary,
  shareText,
}: TrainingSurveyPanelProps) {
  const copied = useSurveyStore((state) => state.allCopied);
  const showFullSquadList = useSurveyStore((state) => state.showFullSquadList);
  const setAllCopied = useSurveyStore((state) => state.setAllCopied);
  const setShowFullSquadList = useSurveyStore((state) => state.setShowFullSquadList);

  const isExpired = summary?.isExpired ?? false;

  const handleCopyLink = () => {
    if (!shareText) return;
    navigator.clipboard.writeText(shareText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2000);
  };

  // =========================================================================
  // STAN 1: ANKIETA WYGASŁA -> RAPORT PODSUMOWUJĄCY DLA TRENERA
  // =========================================================================
  if (isExpired) {
    return (
      <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 sm:p-6 shadow-[3px_3px_0_0_var(--foreground)] space-y-5 animate-in fade-in duration-200">
        {/* Nagłówek raportu */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
              <Activity className="size-4" />
            </span>
            <div>
              <h3 className="font-heading text-lg uppercase tracking-tight">
                Podsumowanie Ankiet RPE
              </h3>
              <p className="font-mono text-[11px] text-muted-foreground">
                Termin zbierania odpowiedzi wygasł · Dane zarchiwizowane
              </p>
            </div>
          </div>

          <span className="rounded-md border border-foreground/15 bg-muted/60 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Clock className="size-3" /> Wygasła
          </span>
        </div>

        {/* 3 Kafle Wskaźników KPI */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* 1. Zwrotność / Frekwencja w ankiecie */}
          <div className="rounded-xl border-2 border-foreground/15 bg-background p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs uppercase tracking-wide">Zwrotność ankiet</span>
              <Users className="size-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-black">
                {summary?.completedSurveys}
              </span>
              <span className="font-mono text-xs text-muted-foreground">
                / {summary?.totalSurveys} ({summary?.responseRate}%)
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-500" 
                style={{ width: `${summary?.responseRate || 0}%` }} 
              />
            </div>
          </div>

          {/* 2. Średnie zmęczenie RPE (1-5) */}
          <div className="rounded-xl border-2 border-foreground/15 bg-background p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs uppercase tracking-wide">Średnie Zmęczenie</span>
              <Activity className="size-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-black text-amber-700 dark:text-amber-400">
                {summary?.avgFatigue !== null ? `${summary?.avgFatigue}` : "—"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">/ 5.0</span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {Number(summary?.avgFatigue) >= 4
                ? "Wysokie obciążenie jednostki"
                : Number(summary?.avgFatigue) >= 2.5
                ? "Optymalny wysiłek meczowy/treningowy"
                : "Niski poziom zmęczenia (rozruch)"}
            </p>
          </div>

          {/* 3. Średnie zadowolenie (1-5) */}
          <div className="rounded-xl border-2 border-foreground/15 bg-background p-4 space-y-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="font-heading text-xs uppercase tracking-wide">Zadowolenie</span>
              <Smile className="size-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-heading text-3xl font-black text-emerald-700 dark:text-emerald-400">
                {summary?.avgSatisfaction !== null ? `${summary?.avgSatisfaction}` : "—"}
              </span>
              <span className="font-mono text-xs text-muted-foreground">/ 5.0</span>
            </div>
            <p className="font-mono text-[10px] text-muted-foreground">
              {Number(summary?.avgSatisfaction) >= 4
                ? "Bardzo wysoka satysfakcja szatni"
                : "Umiarkowany odbiór jednostki"}
            </p>
          </div>
        </div>

        {/* Notatki i uwagi zgłoszone przez graczy */}
        {summary?.notes && summary.notes.length > 0 && (
          <div className="space-y-2.5 pt-2">
            <span className="font-heading text-xs uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
              <MessageSquare className="size-3.5 text-primary" /> Uwagi od zawodników ({summary.notes.length})
            </span>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {summary.notes.map((n, idx) => (
                <div 
                  key={idx} 
                  className="rounded-xl border border-foreground/15 bg-background p-3 space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-heading text-xs font-bold uppercase">
                      {n.jerseyNumber ? `#${n.jerseyNumber} ` : ""}{n.playerName}
                    </span>
                    <span className="font-mono text-[10px] text-muted-foreground">
                      Zmęczenie: {n.fatigue}/5 · Ocena: {n.satisfaction}/5
                    </span>
                  </div>
                  <p className="text-xs text-foreground/90 italic">
                    „{n.feedbackNote}”
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rozwijana lista odpowiedzi poszczególnych zawodników */}
        <div className="pt-2 border-t border-border/80">
          <button
            type="button"
            onClick={() => setShowFullSquadList(!showFullSquadList)}
            className="flex w-full items-center justify-between py-1 text-xs font-heading uppercase text-muted-foreground hover:text-foreground transition"
          >
            <span>Szczegółowa lista odpowiedzi zawodników ({surveys.length})</span>
            {showFullSquadList ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          </button>

          {showFullSquadList && (
            <div className="mt-3 divide-y divide-border/60 rounded-xl border border-foreground/15 bg-background max-h-60 overflow-y-auto">
              {surveys.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[11px] font-bold text-muted-foreground w-6">
                      {s.jerseyNumber ? `#${s.jerseyNumber}` : "—"}
                    </span>
                    <span className="font-semibold text-foreground">{s.playerName}</span>
                  </div>

                  <div>
                    {s.isCompleted ? (
                      <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        Zmęczenie: {s.fatigue}/5 · Ocena: {s.satisfaction}/5
                      </span>
                    ) : (
                      <span className="font-mono text-[10px] text-muted-foreground italic">
                        Brak odpowiedzi przed wygaśnięciem
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // STAN 2: ANKIETA AKTYWNA -> PANEL WYSYŁANIA I MONITOROWANIA ZWROTÓW
  // =========================================================================
  return (
    <div className="rounded-2xl border-2 border-foreground/20 bg-card p-5 sm:p-6 shadow-[3px_3px_0_0_var(--foreground)] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            <Share2 className="size-4" />
          </span>
          <div>
            <h3 className="font-heading text-lg uppercase tracking-tight">
              Ankieta Potreningowa (Aktywna)
            </h3>
            <p className="font-mono text-[11px] text-muted-foreground">
              Link wygasa 24h po wygenerowaniu · Zbieranie parametrów zmęczenia
            </p>
          </div>
        </div>

        <span className="rounded-md border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
          {summary?.completedSurveys || 0} / {summary?.totalSurveys || 0} wypełnionych
        </span>
      </div>

      <div className="rounded-xl border border-foreground/15 bg-background p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Skopiuj wiadomość z linkiem do wklejenia na grupę zespołu (np. WhatsApp):
        </p>
        <Button
          type="button"
          onClick={handleCopyLink}
          className="w-full sm:w-auto h-10 gap-2 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--foreground)]"
        >
          {copied ? <Check className="size-4 text-emerald-400" /> : <Copy className="size-4" />}
          <span>{copied ? "Skopiowano treść!" : "Kopiuj link do grupy"}</span>
        </Button>
      </div>
    </div>
  );
}