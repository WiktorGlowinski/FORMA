"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Ban,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatTrainingDate, type Mark } from "@/components/coach/data";
import {
  getCoachTrainingsAction,
  getCoachFieldsAction,
  createTrainingAction,
  cancelTrainingAction,
  getCoachAlertsAction,
  savePlayerMarkAction,
  type DbTrainingCard,
  type CoachAlertItem,
  type CoachField,
} from "@/app/actions/coach";
import { useCoachStore } from "@/store/useCoachStore";
import { cn } from "@/lib/utils";
import { VoiceTextInput } from "@/components/ui/voice-text-input";

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

const TRAINING_TYPES = [
  { id: "Taktyczny", desc: "Gra pozycyjna, faza przejścia, stałe fragmenty" },
  { id: "Motoryczny", desc: "Moc, szybkość, wytrzymałość, obciążenie" },
  { id: "Techniczny", desc: "Czucie piłki, podania, wykończenie akcji" },
  { id: "Mecz kontrolny", desc: "Sparing wewnętrzny lub rywal zewnętrzny" },
  { id: "Regeneracyjny", desc: "Rozbieganie, rolowanie, niska intensywność" },
];

const QUICK_DURATIONS = [45, 60, 75, 90, 105, 120];

const QUICK_CANCEL_REASONS = [
  "Niekorzystne warunki atmosferyczne",
  "Niedostępność boiska / hali",
  "Zdarzenie losowe / powody sztabu",
  "Przełożony mecz kontrolny",
];

function formatGuestBadge(count: number): string {
  if (count === 1) return "+1 gość";
  const lastDigit = count % 10;
  const lastTwo = count % 100;
  if (lastDigit >= 2 && lastDigit <= 4 && (lastTwo < 12 || lastTwo > 14)) {
    return `+${count} goście`;
  }
  return `+${count} gości`;
}

interface OfflineQueueItem {
  trainingId: string;
  playerId: string;
  mark: Mark;
  note?: string;
  timestamp: number;
}

function isOfflineQueueItem(value: unknown): value is OfflineQueueItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OfflineQueueItem>;
  const mark = item.mark;
  return (
    typeof item.trainingId === "string" &&
    typeof item.playerId === "string" &&
    typeof item.timestamp === "number" &&
    Number.isFinite(item.timestamp) &&
    (item.note === undefined || typeof item.note === "string") &&
    Boolean(mark) &&
    (mark?.type === "score" || mark?.type === "absence")
  );
}

function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28;
  }

  return [31, 30, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

function parseISODate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;

  const [year, month, day] = dateStr.split("-").map(Number);

  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > getDaysInMonth(year, month)) return null;

  return { year, month, day };
}

function isValidDateString(dateStr: string): boolean {
  return !!dateStr && parseISODate(dateStr) !== null;
}

function normalizeCustomDate(dateStr: string, fallback: string): string {
  if (!dateStr) return fallback;

  const parsed = parseISODate(dateStr);
  if (!parsed) return fallback;

  const { year, month, day } = parsed;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function shiftDateByDays(dateStr: string, days: number): string {
  const base = parseISODate(dateStr || getTodayLocalDate());
  if (!base) return getTodayLocalDate();

  const baseDate = new Date(Date.UTC(base.year, base.month - 1, base.day));
  baseDate.setUTCDate(baseDate.getUTCDate() + days);

  const year = baseDate.getUTCFullYear();
  const month = String(baseDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(baseDate.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDayLabel(dateStr: string): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return "";

  const labels = [
    "niedziela",
    "poniedziałek",
    "wtorek",
    "środa",
    "czwartek",
    "piątek",
    "sobota",
  ];
  const monthNames = [
    "stycznia",
    "lutego",
    "marca",
    "kwietnia",
    "maja",
    "czerwca",
    "lipca",
    "sierpnia",
    "września",
    "października",
    "listopada",
    "grudnia",
  ];

  const y = parsed.year;
  const m = parsed.month;
  const d = parsed.day;
  const adjustedYear = y - Math.floor((14 - m) / 12);
  const adjustedMonth = m + 12 * Math.floor((14 - m) / 12) - 2;
  const weekdayIndex =
    (d + Math.floor((31 * adjustedMonth) / 12) + adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400)) % 7;

  return `${labels[(weekdayIndex + 6) % 7]}, ${d} ${monthNames[m - 1]}`;
}

function calculateEndTime(startH: number, startM: number, durationMinutes: number): string {
  const total = (startH * 60 + startM + durationMinutes + 1440) % 1440;
  const endH = String(Math.floor(total / 60)).padStart(2, "0");
  const endM = String(total % 60).padStart(2, "0");
  return `${endH}:${endM}`;
}

function canEvaluateTraining(t: DbTrainingCard, todayStr: string, now: Date): boolean {
  if (t.status === "completed") return true;
  if (t.status === "cancelled") return false;

  if (t.status === "scheduled" || t.status === "planned") {
    if (t.date < todayStr) return true;

    if (t.date === todayStr) {
      if (!t.startTime) return true;
      const [h, m] = t.startTime.split(":").map(Number);
      const trainingMinutes = h * 60 + m;
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      return currentMinutes >= trainingMinutes;
    }
  }

  return false;
}

export function TrainingBoard() {
  const {
    currentCoachId,
    trainings: cachedTrainings,
    teams: cachedTeams,
    setTrainingsData,
    invalidateCache,
  } = useCoachStore();

  const trainings = cachedTrainings || [];
  const teams = cachedTeams || [];

  const [alerts, setAlerts] = useState<CoachAlertItem[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);

  const [loading, setLoading] = useState(!cachedTrainings);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<CoachField[]>([]);
  const [pendingEvaluationIds, setPendingEvaluationIds] = useState<Record<string, string[]>>({});

  const [activeTab, setActiveTab] = useState<"all" | "pending" | "history">("all");
  const [selectedTeamId, setSelectedTeamId] = useState<string>("all");

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [teamId, setTeamId] = useState("");
  const [todayDate, setTodayDate] = useState("");
  const [nowValue, setNowValue] = useState<Date | null>(null);
  const [dateType, setDateType] = useState<"today" | "tomorrow" | "custom">("today");
  const [customDate, setCustomDate] = useState("");

  const [timeMode, setTimeMode] = useState<"preset" | "custom">("preset");
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[1]);
  const [customHour, setCustomHour] = useState(17);
  const [customMinute, setCustomMinute] = useState(30);
  const [durationMinutes, setDurationMinutes] = useState(75);

  const [fieldId, setFieldId] = useState("");
  const [trainingType, setTrainingType] = useState(TRAINING_TYPES[0].id);
  const [plannedRpe, setPlannedRpe] = useState(3);
  const [topic, setTopic] = useState("");
  const [mainGoal, setMainGoal] = useState("");
  const [orgNote, setOrgNote] = useState("");

  const [cancellingTraining, setCancellingTraining] = useState<DbTrainingCard | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancellingSubmitting, setIsCancellingSubmitting] = useState(false);

  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const currentCoachIdRef = useRef(currentCoachId);
  const teamIdRef = useRef(teamId);
  const fieldIdRef = useRef(fieldId);

  useEffect(() => {
    currentCoachIdRef.current = currentCoachId;
    teamIdRef.current = teamId;
    fieldIdRef.current = fieldId;
  }, [currentCoachId, teamId, fieldId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const initialToday = getTodayLocalDate();
      setTodayDate(initialToday);
      setNowValue(new Date());
      setCustomDate(initialToday);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const loadData = useCallback(async (force = false) => {
    if (force) {
      setLoading(true);
      setAlertsLoading(true);
    }

    const [resTrainings, resAlerts, resFields] = await Promise.all([
      getCoachTrainingsAction(),
      getCoachAlertsAction(),
      getCoachFieldsAction(),
    ]);

    setError(null);
    if (!resTrainings.success) {
      setError(resTrainings.error || "Nie udało się załadować jednostek.");
    } else {
      if (currentCoachIdRef.current && currentCoachIdRef.current !== resTrainings.currentCoachId) {
        invalidateCache();
      }

      setTrainingsData(resTrainings.currentCoachId, resTrainings.trainings, resTrainings.teams);
      if (resTrainings.teams.length > 0 && !teamIdRef.current) {
        setTeamId(resTrainings.teams[0].id);
      }
    }

    if (!resFields.success) {
      setError(resFields.error || "Nie udało się załadować listy boisk.");
    } else {
      setFields(resFields.fields);
      if (!resFields.fields.some((field) => field.id === fieldIdRef.current)) {
        setFieldId(resFields.fields[0]?.id || "");
      }
    }

    if (resAlerts.success) {
      setAlerts(resAlerts.alerts || []);
    }
    setAlertsLoading(false);
    setLoading(false);
  }, [
    invalidateCache,
    setTrainingsData,
  ]);

  useEffect(() => {
    void Promise.resolve().then(() => loadData());
  }, [loadData]);

  useEffect(() => {
    function loadPendingEvaluationIds() {
      const pendingIds: Record<string, Set<string>> = {};
      for (let index = 0; index < localStorage.length; index += 1) {
        const key = localStorage.key(index);
        if (!key?.startsWith("forma_eval_queue_")) continue;

        try {
          const queue = JSON.parse(localStorage.getItem(key) || "[]");
          if (!Array.isArray(queue)) continue;
          for (const item of queue) {
            if (typeof item?.trainingId !== "string" || typeof item?.playerId !== "string") continue;
            if (!pendingIds[item.trainingId]) pendingIds[item.trainingId] = new Set();
            pendingIds[item.trainingId].add(item.playerId);
          }
        } catch (queueError) {
          console.error("Nie udało się odczytać lokalnej kolejki ocen:", queueError);
        }
      }

      setPendingEvaluationIds(
        Object.fromEntries(
          Object.entries(pendingIds).map(([id, playerIds]) => [id, Array.from(playerIds)])
        )
      );
    }

    let syncInProgress = false;

    async function syncPendingEvaluations() {
      if (!navigator.onLine || syncInProgress) return;
      syncInProgress = true;
      let hasSyncedEvaluations = false;
      try {
        const queueKeys = Array.from({ length: localStorage.length }, (_, index) =>
          localStorage.key(index)
        ).filter((key): key is string => Boolean(key?.startsWith("forma_eval_queue_")));

        for (const key of queueKeys) {
          const rawQueue = localStorage.getItem(key);
          if (!rawQueue) continue;

          let queue: OfflineQueueItem[];
          try {
            const parsed: unknown = JSON.parse(rawQueue);
            if (!Array.isArray(parsed) || !parsed.every(isOfflineQueueItem)) {
              console.error(`Nieprawidłowa kolejka ocen: ${key}`);
              continue;
            }
            queue = parsed;
          } catch (queueError) {
            console.error(`Nie udało się odczytać kolejki ocen: ${key}`, queueError);
            continue;
          }

          const attemptedTimestamps = new Set(queue.map((item) => item.timestamp));
          const failedTimestamps = new Set<number>();
          for (const item of queue) {
            try {
              const result = await savePlayerMarkAction(
                item.trainingId,
                item.playerId,
                item.mark,
                item.note || ""
              );
              if (!result.success) {
                failedTimestamps.add(item.timestamp);
                console.error("Automatyczny zapis oceny nie powiódł się:", result.error);
                continue;
              }
              hasSyncedEvaluations = true;
            } catch (saveError) {
              failedTimestamps.add(item.timestamp);
              console.error("Automatyczny zapis oceny nie powiódł się:", saveError);
            }
          }

          const latestRawQueue = localStorage.getItem(key);
          const parsedLatest: unknown = latestRawQueue ? JSON.parse(latestRawQueue) : [];
          if (!Array.isArray(parsedLatest) || !parsedLatest.every(isOfflineQueueItem)) {
            console.error(`Nieprawidłowa kolejka ocen po synchronizacji: ${key}`);
            continue;
          }
          const latestQueue: OfflineQueueItem[] = parsedLatest;
          const remaining = latestQueue.filter(
            (item) =>
              !attemptedTimestamps.has(item.timestamp) || failedTimestamps.has(item.timestamp)
          );
          if (remaining.length > 0) {
            localStorage.setItem(key, JSON.stringify(remaining));
          } else {
            localStorage.removeItem(key);
          }
        }
        if (hasSyncedEvaluations) {
          const result = await getCoachTrainingsAction();
          if (result.success) {
            setTrainingsData(result.currentCoachId, result.trainings, result.teams);
          } else {
            console.error("Nie udało się odświeżyć ocen po synchronizacji:", result.error);
          }
        }
      } catch (syncError) {
        console.error("Nie udało się zsynchronizować lokalnych ocen:", syncError);
      } finally {
        syncInProgress = false;
        loadPendingEvaluationIds();
      }
    }

    function handleQueueUpdate() {
      loadPendingEvaluationIds();
      void syncPendingEvaluations();
    }
    function handleVisible() {
      if (document.visibilityState === "visible") void syncPendingEvaluations();
    }

    loadPendingEvaluationIds();
    void syncPendingEvaluations();
    window.addEventListener("forma-evaluation-queue-updated", handleQueueUpdate);
    window.addEventListener("focus", loadPendingEvaluationIds);
    window.addEventListener("online", handleQueueUpdate);
    document.addEventListener("visibilitychange", handleVisible);
    const retryTimer = window.setInterval(() => void syncPendingEvaluations(), 15000);
    return () => {
      window.removeEventListener("forma-evaluation-queue-updated", handleQueueUpdate);
      window.removeEventListener("focus", loadPendingEvaluationIds);
      window.removeEventListener("online", handleQueueUpdate);
      document.removeEventListener("visibilitychange", handleVisible);
      window.clearInterval(retryTimer);
    };
  }, [setTrainingsData]);

  useEffect(() => {
    const originalBodyOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;

    if (isWizardOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    }

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [isWizardOpen]);

  function handleOpenWizard() {
    if (fields.length === 0) {
      alert("Brak dostępnych boisk. Poproś administratora o dodanie boiska.");
      return;
    }
    setStep(1);
    setDateType("today");
    setTimeMode("preset");
    setIsWizardOpen(true);
  }

  function resolveDate(): string {
    const d = new Date();
    if (dateType === "today") return getTodayLocalDate();
    if (dateType === "tomorrow") {
      d.setDate(d.getDate() + 1);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    }

    const fallbackDate = todayDate || getTodayLocalDate();
    const nextCustomDate = normalizeCustomDate(customDate || fallbackDate, fallbackDate);
    return isValidDateString(nextCustomDate) ? nextCustomDate : fallbackDate;
  }

  async function handleFinishCreate() {
    if (!teamId) {
      alert("Wybierz drużynę.");
      setStep(1);
      return;
    }

    const finalDate = resolveDate();
    if (!isValidDateString(finalDate)) {
      alert("Wybrana data treningu jest nieprawidłowa.");
      return;
    }

    if (!fields.some((field) => field.id === fieldId)) {
      alert("Wybierz boisko z listy.");
      return;
    }

    setSubmitting(true);
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
      fieldId,
      topic: topic.trim() || undefined,
      mainGoal: mainGoal.trim() || undefined,
      trainingType,
      plannedRpe,
      organizationalNote: orgNote.trim() || undefined,
    });

    if (res.success) {
      setIsWizardOpen(false);
      setTopic("");
      setMainGoal("");
      setOrgNote("");
      setPlannedRpe(3);
      await loadData(true);
    } else {
      alert(res.error || "Wystąpił błąd podczas tworzenia jednostki.");
    }
    setSubmitting(false);
  }

  async function handleConfirmCancel() {
    if (!cancellingTraining) return;

    setIsCancellingSubmitting(true);
    const res = await cancelTrainingAction(cancellingTraining.id, cancelReason);

    if (res.success) {
      setCancellingTraining(null);
      setCancelReason("");
      await loadData(true);
    } else {
      alert(res.error || "Nie udało się odwołać jednostki.");
    }
    setIsCancellingSubmitting(false);
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
        setStep((s) => (s === 1 ? 2 : 3));
      } else if (diffX < 0 && step > 1) {
        setStep((s) => (s === 3 ? 2 : 1));
      }
    }
  }

  const initialFallbackDate = todayDate || "2025-01-01";
  const safeCustomDate = normalizeCustomDate(customDate || initialFallbackDate, initialFallbackDate);

  const formattedStart = `${String(customHour).padStart(2, "0")}:${String(customMinute).padStart(2, "0")}`;
  const formattedEnd = calculateEndTime(customHour, customMinute, durationMinutes);

  const getEvaluatedCount = (t: DbTrainingCard) =>
    Math.min(Math.max(
      new Set([
        ...(t.evaluatedPlayerIds || []),
        ...(pendingEvaluationIds[t.id] || []),
      ]).size,
      t.evaluatedCount
    ), t.totalPlayers);

  const isFullyEvaluated = (t: DbTrainingCard) =>
    getEvaluatedCount(t) >= t.totalPlayers && t.totalPlayers > 0;

  const isCancelled = (t: DbTrainingCard) => t.status === "cancelled";

  const filteredTrainings = trainings.filter((t) => {
    if (selectedTeamId !== "all" && t.teamId !== selectedTeamId) {
      return false;
    }
    if (activeTab === "pending") {
      return !isCancelled(t) && !isFullyEvaluated(t);
    }
    if (activeTab === "history") {
      return isFullyEvaluated(t) || isCancelled(t);
    }
    return true;
  });

  const pendingCount = trainings.filter((t) => !isCancelled(t) && !isFullyEvaluated(t)).length;
  const historyCount = trainings.filter((t) => isFullyEvaluated(t) || isCancelled(t)).length;

  return (
    <div className="mx-auto max-w-2xl pb-16">
      <header className="sticky top-16 z-30 -mx-2 mb-4 border-b-2 border-foreground/10 bg-background/90 px-2 pb-3 pt-2 backdrop-blur-sm sm:-mx-0 sm:px-0">
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
      </header>

      {/* SEKCJA: WYMAGAJĄ UWAGI */}
      <div className="mt-6 rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-border/80 pb-2.5">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 text-amber-600" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider">
              Wymagają uwagi (Sygnały do rozmowy)
            </span>
            {alerts.length > 0 && (
              <span className="rounded-full bg-destructive/15 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
                {alerts.length}
              </span>
            )}
          </div>
          <Link
            href="/trener/zawodnicy"
            className="text-[11px] font-bold text-primary hover:underline"
          >
            Pełna kadra zespołu →
          </Link>
        </div>

        <div className="mt-3">
          {alertsLoading ? (
            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
              <div className="size-3 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span>Weryfikacja wskaźników obciążenia i formy...</span>
            </div>
          ) : alerts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {alerts.map((alert) => (
                <Link
                  key={`${alert.playerId}-${alert.type}`}
                  href={`/trener/zawodnicy/${alert.playerId}`}
                  className={cn(
                    "group flex items-center gap-2.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-95",
                    alert.severity === "danger"
                      ? "border-rose-500/30 bg-rose-500/10 hover:border-rose-500/60"
                      : "border-amber-500/30 bg-amber-500/10 hover:border-amber-500/60"
                  )}
                >
                  <span
                    className={cn(
                      "font-bold",
                      alert.severity === "danger"
                        ? "text-rose-950 dark:text-rose-200"
                        : "text-amber-950 dark:text-amber-200"
                    )}
                  >
                    {alert.jerseyNumber ? `#${alert.jerseyNumber} ` : ""}
                    {alert.playerName}
                  </span>

                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 font-mono text-[10px] font-bold",
                      alert.severity === "danger"
                        ? "bg-rose-200/80 text-rose-900 dark:bg-rose-900/80 dark:text-rose-100"
                        : "bg-amber-200/80 text-amber-900 dark:bg-amber-900/80 dark:text-amber-100"
                    )}
                  >
                    {alert.badgeText}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
              <CheckCircle2 className="size-4 text-emerald-600" />
              <span>Wszystkie wskaźniki zespołu w normie. Brak sygnałów do pilnej interwencji.</span>
            </div>
          )}
        </div>
      </div>

      {/* PASEK ZAKŁADEK I FILTRÓW */}
      <div className="mt-6 space-y-3 rounded-2xl border-2 border-foreground/20 bg-card p-4 shadow-sm">
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

      {/* LISTA TRENINGÓW */}
      {loading ? (
        <div className="mt-6 space-y-4 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="overflow-hidden rounded-2xl border-2 border-foreground/10 bg-card p-5 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <div className="h-4 w-32 bg-muted rounded" />
                <div className="h-4 w-24 bg-muted rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-6 w-3/4 bg-muted rounded" />
                <div className="h-4 w-1/2 bg-muted/60 rounded" />
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border/60">
                <div className="h-4 w-28 bg-muted rounded" />
                <div className="h-10 w-28 bg-muted rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="mt-6 rounded-xl border-2 border-destructive bg-destructive/10 p-4 text-xs font-mono text-destructive">
          {error}
        </div>
      ) : filteredTrainings.length === 0 ? (
        <div className="print-card mt-6 rounded-2xl border-2 border-foreground/20 p-8 text-center text-muted-foreground">
          <p className="font-heading text-xl text-foreground uppercase">Brak jednostek w wybranym widoku</p>
          <p className="text-xs mt-1 max-w-sm mx-auto">
            {activeTab === "pending"
              ? "Wszystkie jednostki zostały ocenione lub odwołane."
              : "Brak minionych jednostek spełniających wybrane kryteria."}
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-4">
          {filteredTrainings.map((t) => {
            const cancelled = isCancelled(t);
            const canOpen = todayDate && nowValue ? canEvaluateTraining(t, todayDate, nowValue) : false;
            const evaluatedCount = getEvaluatedCount(t);
            const completed = isFullyEvaluated(t);
            const inProgress = canOpen && evaluatedCount > 0 && !completed;

            return (
              <li
                key={t.id}
                className={cn(
                  "print-card overflow-hidden rounded-2xl border-2 bg-card shadow-sm transition-all",
                  cancelled
                    ? "border-foreground/10 opacity-70"
                    : "border-foreground/20 hover:border-foreground/35"
                )}
              >
                <div
                  className={cn(
                    "flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 text-chalk",
                    cancelled ? "bg-stone-700/80" : "mow-stripes"
                  )}
                >
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

                <div className="p-4 sm:p-5 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/70 pb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider font-mono",
                          cancelled
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-foreground"
                        )}
                      >
                        {STATUS_LABEL[t.status]}
                      </span>
                      <span className="text-xs text-muted-foreground">·</span>
                      <span className="text-xs font-semibold text-primary flex items-center gap-1">
                        <MapPin className="size-3.5 shrink-0" />
                        {t.place}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
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

                      {!cancelled && t.status !== "completed" && t.isOwner && (
                        <button
                          type="button"
                          onClick={() => {
                            setCancellingTraining(t);
                            setCancelReason("");
                          }}
                          className="inline-flex items-center gap-1 rounded-lg border border-destructive/30 px-2 py-1 font-mono text-[10px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
                        >
                          <Ban className="size-3" />
                          <span>Odwołaj</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h2
                      className={cn(
                        "font-heading text-2xl tracking-tight sm:text-3xl",
                        cancelled && "line-through text-muted-foreground"
                      )}
                    >
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

                  <div className="pt-2 border-t border-border/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      {cancelled ? (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Ban className="size-4 text-destructive" />
                          <span>Jednostka odwołana — zwolniona z obowiązku oceny</span>
                        </div>
                      ) : completed ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="size-4 shrink-0" />
                          <span>Komplet ocen ({evaluatedCount} / {t.totalPlayers})</span>
                          {t.guestCount > 0 && (
                            <span className="rounded-md border border-amber-600/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {formatGuestBadge(t.guestCount)}
                            </span>
                          )}
                        </div>
                      ) : inProgress ? (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>W trakcie oceny ({evaluatedCount} / {t.totalPlayers})</span>
                          {t.guestCount > 0 && (
                            <span className="rounded-md border border-amber-600/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {formatGuestBadge(t.guestCount)}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <Clock className="size-4 text-muted-foreground shrink-0" />
                          <span>Brak ocen (0 / {t.totalPlayers})</span>
                          {t.guestCount > 0 && (
                            <span className="rounded-md border border-amber-600/30 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold text-amber-800 dark:text-amber-300">
                              {formatGuestBadge(t.guestCount)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {!cancelled && (
                      canOpen ? (
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
                      ) : (
                        <span className="inline-flex h-11 items-center gap-1.5 rounded-xl border border-foreground/15 bg-muted/40 px-3.5 font-mono text-[11px] font-semibold text-muted-foreground">
                          <Clock className="size-3.5 text-muted-foreground" />
                          <span>Oczekuje na termin</span>
                        </span>
                      )
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* MODAL ODWOŁANIA */}
      {cancellingTraining && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl border-2 border-foreground/30 bg-card p-6 shadow-[4px_4px_0_0_var(--foreground)] space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2 text-destructive">
                <Ban className="size-5" />
                <h3 className="font-heading text-lg uppercase tracking-tight">
                  Odwołaj trening
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCancellingTraining(null)}
                className="rounded-lg border border-border p-1 hover:bg-muted"
              >
                <X className="size-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              Czy na pewno chcesz odwołać trening rocznika{" "}
              <strong className="text-foreground">{cancellingTraining.teamName}</strong> zaplanowany na{" "}
              <strong className="text-foreground">{formatTrainingDate(cancellingTraining.date)}</strong>?
              Jednostka zostanie zwolniona z obowiązku wystawiania ocen.
            </p>

            <div>
              <label className="text-[11px] font-bold text-muted-foreground uppercase block mb-1.5">
                Wybierz lub wpisz powód odwołania:
              </label>
              <div className="grid grid-cols-1 gap-1.5 mb-2">
                {QUICK_CANCEL_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setCancelReason(reason)}
                    className={cn(
                      "rounded-lg border px-2.5 py-1.5 text-left text-xs transition active:scale-98",
                      cancelReason === reason
                        ? "border-foreground bg-primary text-primary-foreground font-semibold"
                        : "border-border bg-background hover:bg-muted text-muted-foreground"
                    )}
                  >
                    {reason}
                  </button>
                ))}
              </div>

              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Inny powód..."
                className="h-10 w-full rounded-xl border-2 border-foreground/20 bg-background px-3 text-xs outline-none focus:border-foreground"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
              <Button
                type="button"
                variant="outline"
                className="h-10 text-xs font-bold"
                onClick={() => setCancellingTraining(null)}
                disabled={isCancellingSubmitting}
              >
                Wróć
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="h-10 text-xs font-bold uppercase tracking-wider shadow-[2px_2px_0_0_var(--foreground)]"
                onClick={handleConfirmCancel}
                disabled={isCancellingSubmitting}
              >
                {isCancellingSubmitting ? "Odwoływanie..." : "Potwierdź odwołanie"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* KREATOR WIZARD */}
      {isWizardOpen && (
        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className="fixed inset-0 z-50 overflow-hidden bg-background/98 p-4 backdrop-blur-md sm:p-8 animate-in fade-in duration-200 overscroll-contain"
        >
          <div className="mx-auto flex h-full max-h-screen w-full max-w-lg flex-col justify-between overflow-hidden rounded-2xl border border-foreground/10 bg-background shadow-[0_20px_60px_rgba(0,0,0,0.2)]">
            <div className="sticky top-0 z-20 border-b bg-background/95 px-4 pb-3 pt-4 backdrop-blur-sm">
              <div className="flex items-center justify-between">
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

            <div className="flex-1 overflow-y-auto px-4 py-4">
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
                          setCustomDate(shiftDateByDays(getTodayLocalDate(), 2));
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
                      <div className="flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomDate((curr) => shiftDateByDays(curr, -1))}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground hover:bg-muted active:scale-95"
                        >
                          <ChevronLeft className="size-5" />
                        </button>

                        <div className="min-w-0 flex-1 text-center px-2">
                          <span className="block font-heading text-base font-bold uppercase leading-tight">
                            {formatDayLabel(safeCustomDate)}
                          </span>
                          <span className="mt-1 block font-mono text-[11px] text-primary font-semibold">
                            {safeCustomDate}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setCustomDate((curr) => shiftDateByDays(curr, 1))}
                          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-foreground/20 bg-background text-foreground hover:bg-muted active:scale-95"
                        >
                          <ChevronRight className="size-5" />
                        </button>
                      </div>

                      <div className="border-t border-border pt-2">
                        <input
                          type="date"
                          value={safeCustomDate}
                          onChange={(e) => setCustomDate(e.target.value || getTodayLocalDate())}
                          className="h-11 w-full rounded-lg border-2 border-foreground/20 bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                        />
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
                    {fields.map((field) => (
                      <button
                        key={field.id}
                        type="button"
                        onClick={() => setFieldId(field.id)}
                        aria-pressed={fieldId === field.id}
                        className={cn(
                          "rounded-xl border-2 p-3 text-left text-xs font-semibold transition active:scale-95",
                          fieldId === field.id
                            ? "border-foreground bg-secondary font-bold shadow-[2px_2px_0_0_var(--foreground)]"
                            : "border-foreground/15 bg-card"
                        )}
                      >
                        {field.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                <div className="rounded-xl border-2 border-foreground/15 bg-card p-4">
                  <p className="text-xs font-bold uppercase text-muted-foreground">Status jednostki</p>
                  <p className="mt-1 font-heading text-xl uppercase">Zaplanowany</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Trening zostanie oznaczony jako zrealizowany dopiero po pełnej ocenie składu.
                  </p>
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

            {step === 3 && (
              <div className="my-auto space-y-4 animate-in fade-in slide-in-from-right-4 duration-150">
                <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-3.5 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5 font-bold text-primary">
                    <Sparkles className="size-4" /> Gotowe do utworzenia
                  </p>
                  Pola poniżej są opcjonalne. Jeśli jesteś przy linii bocznej, kliknij od razu <strong>„Utwórz jednostkę”</strong>.
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Planowane RPE (1–5)</label>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={plannedRpe}
                    onChange={(event) => setPlannedRpe(Number(event.target.value))}
                    className="mt-2 w-full accent-primary"
                  />
                  <p className="text-center font-heading text-2xl">{plannedRpe}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Temat jednostki</label>
                  <VoiceTextInput
                    value={topic}
                    onChange={setTopic}
                    placeholder="np. Gra w przewadze po odbiorze piłki"
                    ariaLabel="Temat jednostki"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Cel główny mikrocyklu</label>
                  <VoiceTextInput
                    value={mainGoal}
                    onChange={setMainGoal}
                    placeholder="np. Poprawa szybkości reakcji w fazie negatywnej"
                    ariaLabel="Cel główny mikrocyklu"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-muted-foreground uppercase">Notatka organizacyjna dla sztabu</label>
                  <VoiceTextInput
                    multiline
                    rows={2}
                    value={orgNote}
                    onChange={setOrgNote}
                    placeholder="np. Małe bramki z magazynu; ochraniacze obowiązkowe"
                    ariaLabel="Notatka organizacyjna dla sztabu"
                    className="mt-1.5"
                  />
                </div>
              </div>
            )}
            </div>

            <div className="border-t bg-background px-4 pb-4 pt-3">
              <div className="flex items-center gap-2">
                {step > 1 ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 px-4 text-xs font-bold"
                    onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
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