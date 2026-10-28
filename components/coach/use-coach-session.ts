"use client";

import { useCallback, useEffect, useState } from "react";
import { STARTER_MARKS, type Mark } from "@/components/coach/data";

const KEY = "forma-coach-marks-v1";
const EVENT = "forma-coach-marks";

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