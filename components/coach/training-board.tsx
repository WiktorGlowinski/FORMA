"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Plus,
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Tag,
  Target,
  Info,
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Timer,
  Lock,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTrainingDate } from "@/components/coach/data";
import {
  getCoachTrainingsAction,
  createTrainingAction,
  type DbTrainingCard,
} from "@/app/actions/coach";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Zaplanowany",
  planned: "Zaplanowany",
  completed: "Zrealizowany",
  cancelled: "Odwołany",
};

const TIME_SLOTS = [
  { label: "16:00 – 17:15", start: "16:00", end: "17:15" },
  { label: "17:30 – 18:45", start: "17:30", end: "18:45" },
  { label: "19:00 – 20:15", start: "19:00", end: "20:15" },
];

const QUICK_LOCATIONS = [
  "Boisko główne",
  "Boisko boczne A",
  "Hala Sportowa",
  "Sztuczna murawa",
];

const TRAINING_TYPES = [
  { id: "Taktyczny", desc: "Gra pozycyjna, faza przejścia, stałe fragmenty" },
  { id: "Motoryczny", desc: "Moc, szybkość, wytrzymałość, obciążenie" },
  { id: "Techniczny", desc: "Czucie piłki, podania, wykończenie akcji" },
  { id: "Mecz kontrolny", desc: "Sparing wewnętrzny lub rywal zewnętrzny" },
  { id: "Regeneracyjny", desc: "Rozbieganie, rolowanie, niska intensywność" },
];

const QUICK_DURATIONS = [45, 60, 75, 90, 105, 120];

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"
];

function shiftDateByDays(dateStr: string, days: number): string {
  const base = dateStr || new Date().toISOString().split("T")[0];
  const [y, m, d] = base.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  const year = dt.getUTCFullYear();
  const month = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const day = String(dt.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.toLocaleDateString("pl-PL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "UTC",
  });
}

function calculateEndTime(startH: number, startM: number, durationMinutes: number): string {
  const total = (startH * 60 + startM + durationMinutes + 1440) % 1440;
  const endH = String(Math.floor(total / 60)).padStart(2, "0");
  const endM = String(total % 60).padStart(2, "0");
  return `${endH}:${endM}`;
}

export function TrainingBoard() {
  const [trainings, setTrainings] = useState<DbTrainingCard[]>([]);
  const [teams, setTeams] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Domyślnie "all", aby trener po wejściu od razu widział swoje jednostki
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "history">("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  // Kreator jednostki
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [teamId, setTeamId] = useState("");
  const [dateType, setDateType] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  const [timeMode, setTimeMode] = useState<"preset" | "custom">("preset");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [customHour, setCustomHour] = useState(17);
  const [customMinute, setCustomMinute] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState(75);

  const [location, setLocation] = useState(QUICK_LOCATIONS[0]);
  const [customLocation, setCustomLocation] = useState("");
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0].id);
  const [status, setStatus] = useState<"completed" | "scheduled">("completed");
  const [topic, setTopic] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [orgNote, setOrgNote] = useState("");

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  async function loadData() {
    setLoading(true);
    const res = await getCoachTrainingsAction();
    if (!res.success) {
      setError(res.error || "Nie udało się załadować jednostek.");
    } else {
      setTrainings(res.trainings);
      setTeams(res.teams);
      if (res.teams.length > 0 && !teamId) {
        setTeamId(res.teams[0].id);
      }
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
    const todayStr = new Date().toISOString().split("T")[0];
    setCustomDate(todayStr);
  }, []);

  function handleOpenWizard() {
    setStep(1);
    setDateType("today");
    setTimeMode("preset");
    setIsWizardOpen(true);
  }

  function resolveDate(): string {
    const d = new Date();
    if (dateType === "today") return d.toISOString().split("T")[0];
    if (dateType === "tomorrow") {
      d.setDate(d.getDate() + 1);
      return d.toISOString().split("T")[0];
    }
    return customDate || d.toISOString().split("T")[0];
  }

  async function handleFinishCreate() {
    if (!teamId) {
      alert("Wybierz drużynę.");
      setStep(1);
      return;
    }

    setSubmitting(true);
    const finalLocation = customLocation.trim() || location;

    const finalStart =
      timeMode === "preset"
        ? timeSlot.start
        : `${String(customHour).padStart(2, "0")}:${String(customMinute).padStart(2, "0")}`;

    const finalEnd =
      timeMode === "preset"
        ? timeSlot.end
        : calculateEndTime(customHour, customMinute, durationMinutes);

    const res = await createTrainingAction({
      teamId,
      date: resolveDate(),
      startTime: `${finalStart}:00`,
      endTime: `${finalEnd}:00`,
      location: finalLocation,
      topic: topic.trim() || undefined,
      mainGoal: mainGoal.trim() || undefined,
      trainingType,
      organizationalNote: orgNote.trim() || undefined,
      status,
    });

    if (res.success) {
      setIsWizardOpen(false);
      setTopic("");
      setMainGoal("");
      setOrgNote("");
      setCustomLocation("");
      await loadData();
    } else {
      alert(res.error || "Wystąpił błąd podczas tworzenia jednostki.");
    }
    setSubmitting(false);
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    const diffX = touchStartX.current - e.changedTouches[0].clientX;
    const diffY = touchStartY.current - e.changedTouches[0].clientY;

    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 60) {
      if (diffX > 0 && step < 3) {
        setStep((s) => (s + 1) as any);
      } else if (diffX < 0 && step > 1) {
        setStep((s) => (s - 1) as any);
      }
    }
  }

  const customDateParts = (customDate || "2026-10-29").split("-");
  const currentYear = customDateParts[0] || "2026";
  const currentMonthNum = Number(customDateParts[1] || "10");
  const currentDayNum = Number(customDateParts[2] || "29");

  const formattedStart = `${String(customHour).padStart(2, "0")}:${String(customMinute).padStart(2, "0")}`;
  const formattedEnd = calculateEndTime(customHour, customMinute, durationMinutes);

  // Bezpieczne sprawdzanie czy jednostka jest w pełni oceniona
  const isFullyEvaluated = (t: DbTrainingCard) =>
    t.status === "completed" && t.evaluatedCount >= t.totalPlayers && t.totalPlayers > 0;

  // Filtrowanie jednostek bez odrzucania treningów innego trenera ze sztabu
  const filteredTrainings = trainings.filter((t) => {
    if (selectedTeamId !== "all" && t.teamId !== selectedTeamId) {
      return false;
    }
    if (activeTab === "pending") {
      return !isFullyEvaluated(t);
    }
    if (activeTab === "history") {
      return isFullyEvaluated(t);
    }
    return true; // "all"
  });

  const pendingCount = trainings.filter((t) => !isFullyEvaluated(t)).length;
  const historyCount = trainings.filter((t) => isFullyEvaluated(t)).length;

  return (
    <div className="mx-auto max-w-2xl pb-16">
      
      {/* NAGŁÓWEK TABLICY */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">
            Panel szkoleniowy
          </p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-tight">
            Jednostki Treningowe
          </h1>
        </div>

        <Button
          type="button"
          size="lg"
          onClick={handleOpenWizard}
          className="h-12 gap-2 text-xs font-bold uppercase tracking-wider shadow-[3px_3px_0_0_var(--foreground)] active:scale-95 transition-transform shrink-0"
        >
          <Plus className="size-4" />
          Zaplanuj trening
        </Button>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground sm:text-sm">
        Po treningu przechodzisz skład nazwisko po nazwisku. Wystawione oceny tworzą historię rozwoju zawodnika.
      </p>

      {/* CZYTELNY PASEK KONTROLNY: ZAKŁADKI I FILTR DRUŻYN */}
      <div className="mt-6 space-y-3 rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
        
        {/* Rząd 1: Główne zakładki */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/80 pb-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={cn(
                "rounded-xl border-2 px-3.5 py-1.5 font-heading text-xs uppercase tracking-wide transition active:scale-95",
                activeTab === "all"
                  ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                  : "border-foreground/15 bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              Wszystkie ({trainings.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pending")}
              className={cn(
                "rounded-xl border-2 px-3.5 py-1.5 font-heading text-xs uppercase tracking-wide transition active:scale-95",
                activeTab === "pending"
                  ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                  : "border-foreground/15 bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              Do oceny ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("history")}
              className={cn(
                "rounded-xl border-2 px-3.5 py-1.5 font-heading text-xs uppercase tracking-wide transition active:scale-95",
                activeTab === "history"
                  ? "border-foreground bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                  : "border-foreground/15 bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              Historia ({historyCount})
            </button>
          </div>

          <span className="font-mono text-xs text-muted-foreground font-semibold">
            {filteredTrainings.length} z {trainings.length} jednostek
          </span>
        </div>

        {/* Rząd 2: Pigułki drużyn (tylko gdy trener ma dostęp do więcej niż 1 drużyny) */}
        {teams.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="font-mono text-[10px] font-bold uppercase text-muted-foreground mr-1 flex items-center gap-1">
              <Filter className="size-3" /> Drużyna:
            </span>
            <button
              type="button"
              onClick={() => setSelectedTeamId("all")}
              className={cn(
                "rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition active:scale-95",
                selectedTeamId === "all"
                  ? "border-foreground bg-secondary font-bold text-foreground"
                  : "border-foreground/20 bg-background text-muted-foreground hover:bg-muted"
              )}
            >
              Wszystkie
            </button>
            {teams.map((tm) => (
              <button
                key={tm.id}
                type="button"
                onClick={() => setSelectedTeamId(tm.id)}
                className={cn(
                  "rounded-lg border px-2.5 py-1 font-mono text-[11px] font-semibold transition active:scale-95",
                  selectedTeamId === tm.id
                    ? "border-foreground bg-secondary font-bold text-foreground"
                    : "border-foreground/20 bg-background text-muted-foreground hover:bg-muted"
                )}
              >
                {tm.name}
              </button>
            ))}
          </div>
        )}

      </div>

      {/* LISTA KAFELKÓW TRENINGOWYCH */}
      {loading ? (
        <p className="mt-8 text-center text-xs font-mono text-muted-foreground">Pobieranie jednostek treningowych…</p>
      ) : error ? (
        <div className="mt-6 rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-xs font-mono text-destructive">
          {error}
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="print-card mt-6 rounded-2xl border-2 border-foreground/20 p-8 text-center text-muted-foreground">
          <p className="font-heading text-xl text-foreground uppercase">Brak jednostek w wybranym widoku</p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "Wszystkie jednostki zostały ocenione i przeniesione do historii."
              : "Brak zakończonych jednostek spełniających wybrane kryteria."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filteredTrainings.map((t) => {
            const completed = isFullyEvaluated(t);
            const inProgress = t.status === "completed" && t.evaluatedCount > 0 && !completed;
            const canOpen = t.status === "completed";

            return (
              <li
                key={t.id}
                className="print-card overflow-hidden rounded-2xl border-2 border-foreground/20 bg-card shadow-sm hover:border-foreground/35 transition-all"
              >
                {/* Górny czysty pasek trawy (mow-stripes) */}
                <div className="mow-stripes flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-chalk">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold capitalize tracking-wide">
                      {formatTrainingDate(t.date)}
                    </p>
                    {t.trainingType && (
                      <span className="inline-flex items-center gap-1 rounded bg-chalk/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk">
                        <Tag className="size-3" />
                        {t.trainingType}
                      </span>
                    )}
                  </div>

                  <p className="font-mono text-xs font-bold tracking-tight">
                    {t.teamName} · {t.startTime}–{t.endTime}
                  </p>
                </div>

                {/* Środek karty */}
                <div className="p-4 sm:p-5 space-y-3">
                  
                  {/* Linia statusu obiektu oraz wyraźna plakietka autora */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        {t.place}
                      </span>
                    </div>

                    {/* Badge autorstwa */}
                    {t.isOwner ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-600/30 font-mono text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300">
                        <UserCheck className="size-3" />
                        <span>Twój trening</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 border border-stone-300 font-mono text-[10px] font-bold text-stone-700 dark:bg-stone-800 dark:border-stone-700 dark:text-stone-300">
                        <Lock className="size-3 text-stone-500" />
                        <span>Prowadzący: {t.leadCoachName}</span>
                      </span>
                    )}
                  </div>

                  {/* Temat i cele */}
                  <div>
                    <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
                      {t.topic ?? "Trening bez zadanego tematu"}
                    </h2>

                    {t.mainGoal && (
                      <p className="mt-1 flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                        <Target className="size-3.5 text-primary shrink-0" />
                        Cel: {t.mainGoal}
                      </p>
                    )}

                    {t.organizationalNote && (
                      <p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Info className="size-3 shrink-0" />
                        Notatka: {t.organizationalNote}
                      </p>
                    )}
                  </div>

                  {/* Dolny pasek: frekwencja + dedykowany przycisk */}
                  <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    
                    {/* Status ocen */}
                    <div>
                      {completed ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-4" />
                          <span>Komplet ocen ({t.evaluatedCount} / {t.totalPlayers})</span>
                        </div>
                      ) : inProgress ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="size-4" />
                          <span>W trakcie oceny ({t.evaluatedCount} / {t.totalPlayers})</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="size-4 text-muted-foreground" />
                          <span>Brak ocen (0 / {t.totalPlayers})</span>
                        </div>
                      )}
                    </div>

                    {/* Przycisk akcji */}
                    {canOpen ? (
                      <Link
                        href={`/trener/${t.id}`}
                        className={cn(
                          buttonVariants({
                            size: "default",
                            variant: !t.isOwner ? "secondary" : completed ? "outline" : "default",
                          }),
                          "h-11 px-5 text-xs font-bold uppercase tracking-wider shrink-0 shadow-[2px_2px_0_0_var(--foreground)]",
                          !t.isOwner && "border-2 border-foreground/20 hover:bg-muted"
                        )}
                      >
                        {!t.isOwner ? (
                          <span className="flex items-center gap-1.5">
                            <Lock className="size-3.5" /> Podgląd ocen
                          </span>
                        ) : completed ? (
                          "Popraw zapis"
                        ) : inProgress ? (
                          "Dokończ ocenę"
                        ) : (
                          "Oceń skład →"
                        )}
                      </Link>
                    ) : null}

                  </div>

                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* PEŁNOEKRANOWY KREATOR GESTOWY */}
      {isWizardOpen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-background/98 p-4 backdrop-blur-md sm:p-8 animate-in fade-in duration-200"
        >
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-primary">KROK {step} Z 3</span>
                  <span className="text-xs text-muted-foreground">·</span>
                  <span className="font-heading text-lg tracking-wide uppercase">
                    {step === 1 ? "Kiedy i gdzie?" : step === 2 ? "Profil i status" : "Temat i cel"}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsWizardOpen(false)}
                  className="rounded-full border-2 border-foreground/20 p-1.5 hover:bg-muted"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className={cn("h-1.5 rounded-full transition-all", step >= 1 ? "bg-primary" : "bg-muted")} />
                <div className={cn("h-1.5 rounded-full transition-all", step >= 2 ? "bg-primary" : "bg-muted")} />
                <div className={cn("h-1.5 rounded-full transition-all", step >= 3 ? "bg-primary" : "bg-muted")} />
              </div>
            </div>

            {/* KROK 1 */}
            {step === 1 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Drużyna</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {teams.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTeamId(t.id)}
                        className={cn(
                          "rounded-xl border-2 px-4 py-2.5 text-xs font-bold transition active:scale-95",
                          teamId === t.id
                            ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                            : "border-foreground/15 bg-card hover:border-foreground/40"
                        )}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <CalendarIcon className="size-3.5" /> Dzień treningu
                  </label>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDateType("today")}
                      className={cn(
                        "rounded-xl border-2 py-3 text-center text-xs font-bold transition active:scale-95",
                        dateType === "today"
                          ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                          : "border-foreground/15 bg-card"
                      )}
                    >
                      Dzisiaj
                    </button>
                    <button
                      type="button"
                      onClick={() => setDateType("tomorrow")}
                      className={cn(
                        "rounded-xl border-2 py-3 text-center text-xs font-bold transition active:scale-95",
                        dateType === "tomorrow"
                          ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                          : "border-foreground/15 bg-card"
                      )}
                    >
                      Jutro
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setDateType("custom");
                        if (!customDate) {
                          setCustomDate(shiftDateByDays(new Date().toISOString().split("T")[0], 2));
                        }
                      }}
                      className={cn(
                        "rounded-xl border-2 py-3 text-center text-xs font-bold transition active:scale-95",
                        dateType === "custom"
                          ? "border-foreground bg-primary text-primary-foreground shadow-[2px_2px_0_0_var(--foreground)]"
                          : "border-foreground/15 bg-card"
                      )}
                    >
                      Inna data
                    </button>
                  </div>

                  {dateType === "custom" && (
                    <div className="mt-2.5 rounded-xl border-2 border-foreground/20 bg-card p-3 shadow-[2px_2px_0_0_var(--foreground)] space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCustomDate((curr) => shiftDateByDays(curr, -1))}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground hover:bg-muted active:scale-95"
                        >
                          <ChevronLeft className="size-5" />
                        </button>

                        <div className="text-center px-2">
                          <span className="font-heading text-lg font-bold uppercase block">
                            {formatDayLabel(customDate)}
                          </span>
                          <span className="font-mono text-xs text-primary font-semibold">
                            {customDate}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustomDate((curr) => shiftDateByDays(curr, 1))}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground hover:bg-muted active:scale-95"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border">
                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Dzień</span>
                          <select
                            value={currentDayNum}
                            onChange={(e) => {
                              const newD = String(e.target.value).padStart(2, "0");
                              const newM = String(currentMonthNum).padStart(2, "0");
                              setCustomDate(`${currentYear}-${newM}-${newD}`);
                            }}
                            className="mt-1 h-10 w-full rounded-lg border-2 border-foreground/20 bg-background px-3 font-mono font-bold text-sm outline-none focus:border-foreground"
                          >
                            {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Miesiąc</span>
                          <select
                            value={currentMonthNum}
                            onChange={(e) => {
                              const newM = String(e.target.value).padStart(2, "0");
                              const newD = String(currentDayNum).padStart(2, "0");
                              setCustomDate(`${currentYear}-${newM}-${newD}`);
                            }}
                            className="mt-1 h-10 w-full rounded-lg border-2 border-foreground/20 bg-background px-3 font-semibold text-sm outline-none focus:border-foreground"
                          >
                            {MONTH_NAMES.map((name, idx) => (
                              <option key={idx + 1} value={idx + 1}>{name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                      <Clock className="size-3.5" /> Godzina zbiórki i zajęć
                    </label>
                    <button
                      type="button"
                      onClick={() => setTimeMode(timeMode === "preset" ? "custom" : "preset")}
                      className="text-xs font-bold text-primary underline"
                    >
                      {timeMode === "preset" ? "Własne godziny" : "Gotowe sloty"}
                    </button>
                  </div>

                  {timeMode === "preset" ? (
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot.label}
                          type="button"
                          onClick={() => setTimeSlot(slot)}
                          className={cn(
                            "rounded-xl border-2 py-2.5 text-center text-[11px] font-mono font-bold transition active:scale-95",
                            timeSlot.label === slot.label
                              ? "border-foreground bg-secondary font-black shadow-[2px_2px_0_0_var(--foreground)]"
                              : "border-foreground/15 bg-card"
                          )}
                        >
                          {slot.label}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 space-y-3 rounded-xl border-2 border-foreground/20 bg-card p-3.5 shadow-[2px_2px_0_0_var(--foreground)]">
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Godzina rozpoczęcia
                        </span>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setCustomHour((h) => (h === 0 ? 23 : h - 1))}
                              className="h-11 w-9 rounded-lg border border-foreground/20 bg-background font-bold text-base active:scale-95"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={23}
                              value={customHour}
                              onChange={(e) => {
                                const val = Math.min(23, Math.max(0, Number(e.target.value)));
                                setCustomHour(val);
                              }}
                              className="h-11 w-16 rounded-lg border-2 border-foreground/30 bg-background text-center font-heading text-2xl font-black outline-none focus:border-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomHour((h) => (h === 23 ? 0 : h + 1))}
                              className="h-11 w-9 rounded-lg border border-foreground/20 bg-background font-bold text-base active:scale-95"
                            >
                              +
                            </button>
                          </div>

                          <span className="font-heading text-3xl font-black">:</span>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setCustomMinute((m) => (m < 5 ? 55 : m - 5))}
                              className="h-11 w-9 rounded-lg border border-foreground/20 bg-background font-bold text-base active:scale-95"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min={0}
                              max={59}
                              value={String(customMinute).padStart(2, "0")}
                              onChange={(e) => {
                                const val = Math.min(59, Math.max(0, Number(e.target.value)));
                                setCustomMinute(val);
                              }}
                              className="h-11 w-16 rounded-lg border-2 border-foreground/30 bg-background text-center font-heading text-2xl font-black outline-none focus:border-foreground"
                            />
                            <button
                              type="button"
                              onClick={() => setCustomMinute((m) => (m >= 55 ? 0 : m + 5))}
                              className="h-11 w-9 rounded-lg border border-foreground/20 bg-background font-bold text-base active:scale-95"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="mt-2.5 flex justify-center gap-2">
                          {[0, 15, 30, 45].map((m) => (
                            <button
                              key={m}
                              type="button"
                              onClick={() => setCustomMinute(m)}
                              className={cn(
                                "rounded-md border px-3 py-1 font-mono text-xs font-bold transition active:scale-95",
                                customMinute === m
                                  ? "border-foreground bg-primary text-primary-foreground"
                                  : "border-foreground/15 bg-background hover:bg-muted"
                              )}
                            >
                              :{String(m).padStart(2, "0")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border">
                        <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1">
                            <Timer className="size-3.5" /> Czas trwania jednostki
                          </span>
                          <span className="font-mono text-foreground font-black">
                            {durationMinutes} min
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-6 gap-1">
                          {QUICK_DURATIONS.map((dur) => (
                            <button
                              key={dur}
                              type="button"
                              onClick={() => setDurationMinutes(dur)}
                              className={cn(
                                "rounded-lg border py-2 text-center font-mono text-xs font-bold transition active:scale-95",
                                durationMinutes === dur
                                  ? "border-foreground bg-primary text-primary-foreground shadow-sm"
                                  : "border-foreground/15 bg-background hover:bg-muted"
                              )}
                            >
                              {dur}&apos;
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium">
                        <span className="text-muted-foreground">Przedział zajęć:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formattedStart} → {formattedEnd} ({durationMinutes} min)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <MapPin className="size-3.5" /> Obiekt / Boisko
                  </label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {QUICK_LOCATIONS.map((loc) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLocation(loc);
                          setCustomLocation("");
                        }}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left text-xs font-semibold transition active:scale-95",
                          location === loc && !customLocation
                            ? "border-foreground bg-secondary font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                            : "border-foreground/15 bg-card"
                        )}
                      >
                        {loc}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Wpisz inne miejsce, jeśli brak powyżej..."
                    value={customLocation}
                    onChange={(e) => setCustomLocation(e.target.value)}
                    className="mt-2 h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-xs outline-none focus:border-foreground"
                  />
                </div>
              </div>
            )}

            {/* KROK 2 */}
            {step === 2 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Status jednostki</label>
                  <div className="mt-2 grid grid-cols-2 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setStatus("completed")}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition active:scale-95",
                        status === "completed"
                          ? "border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]"
                          : "border-foreground/15 bg-card"
                      )}
                    >
                      <span className="font-heading text-xl uppercase">Zrealizowany</span>
                      <span className="mt-1 block text-xs opacity-85">Do natychmiastowej oceny składu</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatus("scheduled")}
                      className={cn(
                        "rounded-xl border-2 p-4 text-left transition active:scale-95",
                        status === "scheduled"
                          ? "border-foreground bg-primary text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)]"
                          : "border-foreground/15 bg-card"
                      )}
                    >
                      <span className="font-heading text-xl uppercase">Zaplanowany</span>
                      <span className="mt-1 block text-xs opacity-85">Ocena odblokuje się po treningu</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                    <Tag className="size-3.5" /> Główny akcent mikrocyklu
                  </label>
                  <div className="mt-2 space-y-2">
                    {TRAINING_TYPES.map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setTrainingType(type.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl border-2 p-3 text-left transition active:scale-95",
                          trainingType === type.id
                            ? "border-foreground bg-secondary font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                            : "border-foreground/15 bg-card"
                        )}
                      >
                        <div>
                          <p className="text-xs font-bold">{type.id}</p>
                          <p className="text-[11px] text-muted-foreground font-normal">{type.desc}</p>
                        </div>
                        {trainingType === type.id && <Check className="size-4 text-primary shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* KROK 3 */}
            {step === 3 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="size-4" /> Gotowe do utworzenia
                  </p>
                  Pola poniżej są opcjonalne. Jeśli jesteś przy linii bocznej, kliknij od razu <strong>„Utwórz jednostkę”</strong>.
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Temat jednostki</label>
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="np. Gra w przewadze po odbiorze piłki"
                    className="mt-1.5 h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-xs outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Cel główny mikrocyklu</label>
                  <input
                    type="text"
                    value={mainGoal}
                    onChange={(e) => setMainGoal(e.target.value)}
                    placeholder="np. Poprawa szybkości reakcji w fazie negatywnej"
                    className="mt-1.5 h-11 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-xs outline-none focus:border-foreground"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Notatka organizacyjna dla sztabu</label>
                  <textarea
                    rows={2}
                    value={orgNote}
                    onChange={(e) => setOrgNote(e.target.value)}
                    placeholder="np. Małe bramki z magazynu; ochraniacze obowiązkowe"
                    className="mt-1.5 w-full rounded-xl border-2 border-foreground/20 bg-background p-2.5 text-xs outline-none focus:border-foreground"
                  />
                </div>
              </div>
            )}

            {/* PASEK NAWIGACJI KROKÓW */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 text-xs font-bold"
                    onClick={() => setStep((s) => (s - 1) as any)}
                  >
                    <ArrowLeft className="mr-1 size-4" /> Wstecz
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-12 px-3 text-xs text-muted-foreground"
                    onClick={() => setIsWizardOpen(false)}
                  >
                    Anuluj
                  </Button>
                )}

                {step === 1 && (
                  <Button
                    type="button"
                    className="h-12 flex-1 font-bold text-xs shadow-[2px_2px_0_0_var(--foreground)]"
                    onClick={() => setStep(2)}
                  >
                    Dalej <ArrowRight className="ml-1 size-4" />
                  </Button>
                )}

                {step === 2 && (
                  <>
                    <Button
                      type="button"
                      variant="secondary"
                      className="h-12 px-3 text-xs font-semibold"
                      onClick={handleFinishCreate}
                      disabled={submitting}
                    >
                      {submitting ? "Zapisuję..." : "Zapisz teraz"}
                    </Button>
                    <Button
                      type="button"
                      className="h-12 flex-1 font-bold text-xs shadow-[2px_2px_0_0_var(--foreground)]"
                      onClick={() => setStep(3)}
                    >
                      Dodaj temat <ArrowRight className="ml-1 size-4" />
                    </Button>
                  </>
                )}

                {step === 3 && (
                  <Button
                    type="button"
                    disabled={submitting}
                    className="h-12 flex-1 font-bold text-xs shadow-[2px_2px_0_0_var(--foreground)]"
                    onClick={handleFinishCreate}
                  >
                    {submitting ? "Zapisuję..." : "Utwórz jednostkę"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}