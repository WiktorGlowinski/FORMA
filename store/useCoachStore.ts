import { create } from "zustand";
import type { DbTrainingCard } from "@/app/actions/coach";
import type { InjuryKind, Mark, SquadPlayer } from "@/components/coach/data";

interface CachedEvaluationData {
  training: {
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
  };
  squad: Array<SquadPlayer & {
    avatarUrl?: string | null;
    parentName?: string | null;
    parentPhone?: string | null;
    phone?: string | null;
    isGuest?: boolean;
  }>;
  initialMarks: Record<string, Mark>;
  previousInjuries?: Record<string, InjuryKind>;
}

interface CoachState {
  currentCoachId: string | null;
  trainings: DbTrainingCard[] | null;
  teams: { id: string; name: string }[] | null;
  evaluationsCache: Record<string, CachedEvaluationData>;

  setTrainingsData: (
    coachId: string | null | undefined, // <--- dopuszczamy undefined/null
    trainings: DbTrainingCard[],
    teams: { id: string; name: string }[]
  ) => void;
  cacheEvaluationData: (trainingId: string, data: CachedEvaluationData) => void;
  updateMarkInCache: (trainingId: string, playerId: string, mark: Mark) => void;
  resetCachedMarks: (trainingId: string) => void;
  updateCachedSurveyStatus: (trainingId: string, enabled: boolean) => void;
  invalidateCache: () => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  currentCoachId: null,
  trainings: null,
  teams: null,
  evaluationsCache: {},

  setTrainingsData: (coachId, trainings, teams) =>
    set({
      currentCoachId: coachId || null,
      trainings,
      teams,
    }),
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

  invalidateCache: () =>
    set({
      currentCoachId: null,
      trainings: null,
      teams: null,
      evaluationsCache: {},
    }),
}));