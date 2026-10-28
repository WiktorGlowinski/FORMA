"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  STARTER_MARKS,
  TRAININGS,
  U14_SQUAD,
  type Mark,
  type SquadPlayer,
  type TrainingSession,
  type TrainingStatus,
} from "@/components/coach/data";

const KEY = "forma-coach-marks-v1";
const EVENT = "forma-coach-marks";
const ROSTER_KEY = "forma-coach-roster-v1";
const ROSTER_EVENT = "forma-coach-roster";
const TRAININGS_KEY = "forma-coach-trainings-v1";
const TRAININGS_EVENT = "forma-coach-trainings";

type AllMarks = Record<string, Record<string, Mark>>;

function read(): AllMarks {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw === null) {
      window.localStorage.setItem(KEY, JSON.stringify(STARTER_MARKS));
      return STARTER_MARKS;
    }
    const parsed = JSON.parse(raw) as AllMarks;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(next: AllMarks) {
  window.localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVENT));
}

function isAddedPlayer(value: unknown): value is SquadPlayer {
  if (!value || typeof value !== "object") return false;
  const player = value as SquadPlayer;
  return (
    typeof player.id === "string" &&
    player.id.startsWith("extra-") &&
    typeof player.firstName === "string" &&
    typeof player.lastName === "string" &&
    typeof player.jerseyNumber === "number" &&
    typeof player.role === "string"
  );
}

function readRoster(): SquadPlayer[] {
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter(isAddedPlayer) : [];
  } catch {
    return [];
  }
}

function writeRoster(next: SquadPlayer[]) {
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(ROSTER_EVENT));
}

function isStatus(value: unknown): value is TrainingStatus {
  return value === "scheduled" || value === "completed" || value === "cancelled";
}

function isStoredTraining(value: unknown): value is TrainingSession {
  if (!value || typeof value !== "object") return false;
  const training = value as TrainingSession;
  return (
    typeof training.id === "string" &&
    training.source === "added" &&
    typeof training.date === "string" &&
    typeof training.startTime === "string" &&
    typeof training.endTime === "string" &&
    typeof training.place === "string" &&
    isStatus(training.status)
  );
}

function readTrainings(): TrainingSession[] {
  try {
    const raw = window.localStorage.getItem(TRAININGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredTraining).map((training) => ({
      ...training,
      teamName: "U14",
      source: "added" as const,
      players: U14_SQUAD,
      topic: training.topic?.trim() || undefined,
    }));
  } catch {
    return [];
  }
}

function writeTrainings(next: TrainingSession[]) {
  window.localStorage.setItem(TRAININGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(TRAININGS_EVENT));
}

export function useAllMarks() {
  const [all, setAll] = useState<AllMarks>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => setAll(read());
    sync();
    setReady(true);
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return { all, ready };
}

export function useTrainingMarks(trainingId: string) {
  const { all, ready } = useAllMarks();
  const marks = all[trainingId] ?? {};

  const setMark = useCallback(
    (playerId: string, mark: Mark) => {
      const current = read();
      write({
        ...current,
        [trainingId]: { ...current[trainingId], [playerId]: mark },
      });
    },
    [trainingId],
  );

  const clearTraining = useCallback(() => {
    const current = read();
    write({ ...current, [trainingId]: {} });
  }, [trainingId]);

  return { marks, ready, setMark, clearTraining };
}

export function useSquad() {
  const [extras, setExtras] = useState<SquadPlayer[]>([]);
  const [ready, setReady] = useState(false);
  const players = useMemo(() => [...U14_SQUAD, ...extras], [extras]);

  useEffect(() => {
    const sync = () => setExtras(readRoster());
    sync();
    setReady(true);
    window.addEventListener(ROSTER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ROSTER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addPlayer = useCallback((input: Omit<SquadPlayer, "id">) => {
    const player: SquadPlayer = { ...input, id: `extra-${input.jerseyNumber}-${Date.now()}` };
    writeRoster([...readRoster(), player]);
  }, []);

  const removePlayer = useCallback((id: string) => {
    if (!id.startsWith("extra-")) return;
    writeRoster(readRoster().filter((player) => player.id !== id));
    const current = read();
    const next: AllMarks = {};
    for (const [trainingId, byPlayer] of Object.entries(current)) {
      const copy = { ...byPlayer };
      delete copy[id];
      next[trainingId] = copy;
    }
    write(next);
  }, []);

  return { players, extras, ready, addPlayer, removePlayer };
}

export function useTrainings() {
  const [added, setAdded] = useState<TrainingSession[]>([]);
  const [ready, setReady] = useState(false);
  const trainings = useMemo(() => {
    return [...added, ...TRAININGS].sort((a, b) =>
      `${b.date}T${b.startTime}`.localeCompare(`${a.date}T${a.startTime}`),
    );
  }, [added]);

  useEffect(() => {
    const sync = () => setAdded(readTrainings());
    sync();
    setReady(true);
    window.addEventListener(TRAININGS_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(TRAININGS_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const addTraining = useCallback(
    (input: {
      date: string;
      startTime: string;
      endTime: string;
      place: string;
      topic: string;
      status: TrainingStatus;
    }) => {
      const existing = new Set([...TRAININGS.map((training) => training.id), ...readTrainings().map((training) => training.id)]);
      let id = `u14-${input.date}-${input.startTime.replace(":", "")}`;
      if (existing.has(id)) id = `${id}-${Date.now().toString(36)}`;
      const topic = input.topic.trim();
      const session: TrainingSession = {
        id,
        teamName: "U14",
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
        place: input.place.trim(),
        topic: topic || undefined,
        status: input.status,
        source: "added",
        players: U14_SQUAD,
      };
      writeTrainings([session, ...readTrainings()]);
    },
    [],
  );

  const removeTraining = useCallback((id: string) => {
    const current = readTrainings();
    if (!current.some((training) => training.id === id)) return;
    writeTrainings(current.filter((training) => training.id !== id));
    const marks = read();
    if (marks[id]) {
      const next = { ...marks };
      delete next[id];
      write(next);
    }
  }, []);

  return { trainings, ready, addTraining, removeTraining };
}