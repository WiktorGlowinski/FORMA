import { create } from "zustand";
import type { DbTrainingCard } from "@/app/actions/coach";

interface CoachState {
  trainings: DbTrainingCard[] | null;
  teams: { id: string; name: string }[] | null;
  // Słownik: klucz to trainingId, wartość to pobrane dane kadry i ocen
  evaluationsCache: Record<string, any>;

  setTrainingsData: (trainings: DbTrainingCard[], teams: { id: string; name: string }[]) => void;
  cacheEvaluationData: (trainingId: string, data: any) => void;
  updateMarkInCache: (trainingId: string, playerId: string, mark: any) => void;
  resetCachedMarks: (trainingId: string) => void;
  updateCachedSurveyStatus: (trainingId: string, enabled: boolean) => void;
  invalidateCache: () => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  trainings: null,
  teams: null,
  evaluationsCache: {},

  setTrainingsData: (trainings, teams) => set({ trainings, teams }),

  cacheEvaluationData: (trainingId, data) =>
    set((state) => ({
      evaluationsCache: {
        ...state.evaluationsCache,
        [trainingId]: data,
      },
    })),

  updateMarkInCache: (trainingId, playerId, mark) =>
    set((state) => {
      const current = state.evaluationsCache[trainingId];
      const isNewEvaluation = current && !current.initialMarks?.[playerId];

      const updatedCache = current
        ? {
            ...state.evaluationsCache,
            [trainingId]: {
              ...current,
              initialMarks: {
                ...current.initialMarks,
                [playerId]: mark,
              },
            },
          }
        : state.evaluationsCache;

      const updatedTrainings = state.trainings
        ? state.trainings.map((t) => {
            if (t.id !== trainingId) return t;
            return {
              ...t,
              evaluatedCount: isNewEvaluation ? t.evaluatedCount + 1 : t.evaluatedCount,
            };
          })
        : null;

      return {
        evaluationsCache: updatedCache,
        trainings: updatedTrainings,
      };
    }),

  resetCachedMarks: (trainingId) =>
    set((state) => {
      const current = state.evaluationsCache[trainingId];
      const updatedCache = current
        ? {
            ...state.evaluationsCache,
            [trainingId]: {
              ...current,
              initialMarks: {},
            },
          }
        : state.evaluationsCache;

      const updatedTrainings = state.trainings
        ? state.trainings.map((t) =>
            t.id === trainingId ? { ...t, evaluatedCount: 0 } : t
          )
        : null;

      return {
        evaluationsCache: updatedCache,
        trainings: updatedTrainings,
      };
    }),

  updateCachedSurveyStatus: (trainingId, enabled) =>
    set((state) => {
      const current = state.evaluationsCache[trainingId];
      if (!current) return state;

      return {
        evaluationsCache: {
          ...state.evaluationsCache,
          [trainingId]: {
            ...current,
            training: {
              ...current.training,
              surveyEnabled: enabled,
            },
          },
        },
      };
    }),

  invalidateCache: () => set({ trainings: null, teams: null, evaluationsCache: {} }),
}));