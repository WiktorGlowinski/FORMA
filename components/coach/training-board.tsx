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

// Szybkie presety godzinowe pod kciuk
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
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

// Matematyka UTC eliminująca błędy przesunięcia strefowego
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

  // Stan kreatora
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Wartości formularza
  const [teamId, setTeamId] = useState("");
  const [dateType, setDateType] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  // Czas i godziny
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

  return (
    <div className="mx-auto max-w-2xl pb-12">
      {/* NAGŁÓWEK GŁÓWNY */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold tracking-[0.16em] text-primary uppercase">Panel trenera</p>
          <h1 className="mt-1 font-heading text-4xl uppercase tracking-wide sm:text-5xl">
            Jednostki do oceny
          </h1>
        </div>
        <Button
          type="button"
          size="lg"
          onClick={handleOpenWizard}
          className="h-12 gap-2 text-sm font-bold shadow-[3px_3px_0_0_var(--foreground)] active:scale-95 transition-transform"
        >
          <Plus className="size-5" />
          Dodaj jednostkę (Szybki szkic)
        </Button>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground sm:text-sm">
        Po treningu przechodzisz skład nazwisko po nazwisku. Wystawione oceny tworzą historię rozwoju zawodnika.
      </p>

      {/* PEŁNOEKRANOWY KREATOR GESTOWY */}
      {isWizardOpen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 flex flex-col justify-between bg-background/98 p-4 backdrop-blur-md sm:p-8 animate-in fade-in duration-200"
        >
          <div className="mx-auto flex h-full w-full max-w-lg flex-col justify-between">
            {/* GÓRNY PASEK KROKÓW */}
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

            {/* KROK 1: CZAS, ZESPÓŁ I MIEJSCE */}
            {step === 1 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                {/* Wybór zespołu */}
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

                {/* Dzień treningu */}
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

                  {/* Ergonomiczny wybór daty */}
                  {dateType === "custom" && (
                    <div className="mt-2.5 rounded-xl border-2 border-foreground/20 bg-card p-3 shadow-[2px_2px_0_0_var(--foreground)] space-y-3">
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setCustomDate((curr) => shiftDateByDays(curr, -1))}
                          className="flex h-11 w-11 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground hover:bg-muted active:scale-95"
                          title="Dzień wcześniej"
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
                          title="Dzień później"
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
                              <option key={d} value={d}>
                                {d}
                              </option>
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
                              <option key={idx + 1} value={idx + 1}>
                                {name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Godziny: Gotowe sloty lub pełna regulacja */}
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
                      {/* Wybór godziny startu */}
                      <div>
                        <span className="text-[10px] font-bold text-muted-foreground uppercase block">
                          Godzina rozpoczęcia
                        </span>
                        <div className="mt-2 flex items-center justify-center gap-2">
                          {/* Godzina */}
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

                          {/* Minuta */}
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

                        {/* Szybkie pigułki minut */}
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

                      {/* Czas trwania */}
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

                        <div className="mt-2 flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setDurationMinutes((d) => Math.max(15, d - 15))}
                            className="flex-1 rounded-lg border border-foreground/20 bg-background py-1.5 text-xs font-bold hover:bg-muted active:scale-95"
                          >
                            − 15 min
                          </button>
                          <div className="flex items-center gap-1 px-2 font-mono text-xs font-bold">
                            <input
                              type="number"
                              min={15}
                              max={300}
                              step={5}
                              value={durationMinutes}
                              onChange={(e) => setDurationMinutes(Math.max(15, Number(e.target.value)))}
                              className="h-8 w-14 rounded-md border border-foreground/20 text-center font-bold outline-none"
                            />
                            <span>min</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDurationMinutes((d) => d + 15)}
                            className="flex-1 rounded-lg border border-foreground/20 bg-background py-1.5 text-xs font-bold hover:bg-muted active:scale-95"
                          >
                            + 15 min
                          </button>
                        </div>
                      </div>

                      {/* Podsumowanie godzinowe */}
                      <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium">
                        <span className="text-muted-foreground">Przedział zajęć:</span>
                        <span className="font-mono font-bold text-foreground">
                          {formattedStart} → {formattedEnd} ({durationMinutes} min)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Boisko */}
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

            {/* KROK 2: STATUS I METODYKA */}
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

            {/* KROK 3: SZCZEGÓŁY METODYCZNE (OPCJONALNE) */}
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

            {/* DOLNY PASEK NAWIGACJI KROKÓW */}
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

              <p className="mt-2 text-center font-mono text-[11px] text-muted-foreground">
                Przesuń palcem w lewo / prawo, aby zmieniać ekrany
              </p>
            </div>
          </div>
        </div>
      )}

      {/* LISTA JEDNOSTEK TRENINGOWYCH */}
      {loading ? (
        <p className="mt-8 text-sm text-muted-foreground">Pobieranie jednostek treningowych…</p>
      ) : error ? (
        <div className="mt-6 rounded-md border-2 border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : trainings.length === 0 ? (
        <div className="print-card mt-8 rounded-xl border-2 border-foreground/15 p-6 text-center text-muted-foreground">
          Brak zaplanowanych jednostek dla Twoich zespołów. Użyj przycisku u góry, aby utworzyć pierwszą.
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {trainings.map((t) => {
            const finished = t.status === "completed" && t.evaluatedCount === t.totalPlayers && t.totalPlayers > 0;
            const started = t.status === "completed" && t.evaluatedCount > 0 && !finished;
            const open = t.status === "completed";

            return (
              <li key={t.id} className="print-card overflow-hidden rounded-xl border-2 border-foreground/15 bg-card">
                {/* Górny pasek karty */}
                <div className="mow-stripes flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-chalk">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-semibold capitalize">{formatTrainingDate(t.date)}</p>
                    {t.trainingType && (
                      <span className="inline-flex items-center gap-1 rounded bg-chalk/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-chalk">
                        <Tag className="size-3" />
                        {t.trainingType}
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs font-semibold">
                    {t.teamName} · {t.startTime}–{t.endTime}
                  </p>
                </div>

                {/* Środek karty */}
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-medium text-primary">{t.place}</span>
                    </div>

                    <h2 className="font-heading text-2xl tracking-tight sm:text-3xl">
                      {t.topic ?? "Trening bez zadanego tematu"}
                    </h2>

                    {t.mainGoal && (
                      <p className="flex items-center gap-1.5 text-xs font-medium text-foreground/90">
                        <Target className="size-3.5 text-primary" />
                        Cel: {t.mainGoal}
                      </p>
                    )}

                    {t.organizationalNote && (
                      <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Info className="size-3" />
                        Notatka: {t.organizationalNote}
                      </p>
                    )}

                    {open ? (
                      <p className="pt-1 text-xs text-muted-foreground">
                        Oceniono <span className="font-mono font-bold text-foreground">{t.evaluatedCount} / {t.totalPlayers}</span>
                        {t.evaluatedCount === 0 ? " · Brak wystawionych ocen" : ""}
                      </p>
                    ) : (
                      <p className="pt-1 text-xs text-muted-foreground">
                        {t.status === "cancelled" ? "Odwołana jednostka" : "Ocena ruszy po treningu"}
                      </p>
                    )}
                  </div>

                  {open ? (
                    <Link
                      href={`/trener/${t.id}`}
                      className={cn(
                        buttonVariants({ size: "default", variant: finished ? "outline" : "default" }),
                        "h-11 px-5 text-xs font-bold uppercase tracking-wider shrink-0 shadow-[2px_2px_0_0_var(--foreground)]"
                      )}
                    >
                      {finished ? "Popraw zapis" : started ? "Dokończ ocenę" : "Oceń skład"}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}