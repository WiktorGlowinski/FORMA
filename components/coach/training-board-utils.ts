import type { DbTrainingCard } from "@/app/actions/coach";
import type { Mark } from "@/components/coach/data";

export interface OfflineEvaluationQueueItem {
  trainingId: string;
  playerId: string;
  mark: Mark;
  note?: string;
  timestamp: number;
}

export function isOfflineEvaluationQueueItem(value: unknown): value is OfflineEvaluationQueueItem {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<OfflineEvaluationQueueItem>;
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

export function getTodayLocalDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [31, 30, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 31;
}

export function parseISODate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > getDaysInMonth(year, month)) return null;
  return { year, month, day };
}

export function isValidDateString(dateStr: string): boolean {
  return Boolean(dateStr && parseISODate(dateStr));
}

export function normalizeCustomDate(dateStr: string, fallback: string): string {
  if (!dateStr) return fallback;
  const parsed = parseISODate(dateStr);
  if (!parsed) return fallback;
  const { year, month, day } = parsed;
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function shiftDateByDays(dateStr: string, days: number): string {
  const base = parseISODate(dateStr || getTodayLocalDate());
  if (!base) return getTodayLocalDate();
  const baseDate = new Date(Date.UTC(base.year, base.month - 1, base.day));
  baseDate.setUTCDate(baseDate.getUTCDate() + days);
  return `${baseDate.getUTCFullYear()}-${String(baseDate.getUTCMonth() + 1).padStart(2, "0")}-${String(baseDate.getUTCDate()).padStart(2, "0")}`;
}

export function formatDayLabel(dateStr: string): string {
  const parsed = parseISODate(dateStr);
  if (!parsed) return "";
  const labels = ["niedziela", "poniedziałek", "wtorek", "środa", "czwartek", "piątek", "sobota"];
  const monthNames = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca", "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];
  const y = parsed.year;
  const m = parsed.month;
  const d = parsed.day;
  const adjustedYear = y - Math.floor((14 - m) / 12);
  const adjustedMonth = m + 12 * Math.floor((14 - m) / 12) - 2;
  const weekdayIndex = (d + Math.floor((31 * adjustedMonth) / 12) + adjustedYear + Math.floor(adjustedYear / 4) - Math.floor(adjustedYear / 100) + Math.floor(adjustedYear / 400)) % 7;
  return `${labels[(weekdayIndex + 6) % 7]}, ${d} ${monthNames[m - 1]}`;
}

export function calculateEndTime(startH: number, startM: number, durationMinutes: number): string {
  const total = (startH * 60 + startM + durationMinutes + 1440) % 1440;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export function canEvaluateTraining(t: DbTrainingCard, todayStr: string, now: Date): boolean {
  if (t.status === "completed") return true;
  if (t.status === "cancelled") return false;
  if (t.status === "scheduled" || t.status === "planned") {
    if (t.date < todayStr) return true;
    if (t.date === todayStr) {
      if (!t.startTime) return true;
      const [h, m] = t.startTime.split(":").map(Number);
      return now.getHours() * 60 + now.getMinutes() >= h * 60 + m;
    }
  }
  return false;
}
