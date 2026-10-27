import { create } from 'zustand';
import { EvaluationItem } from '@/app/actions/evaluations';

interface EvaluationState {
  currentIndex: number;
  evaluations: Record<string, EvaluationItem>;
  setEvaluation: (playerId: string, evalData: Partial<EvaluationItem>) => void;
  loadEvaluations: (items: Record<string, EvaluationItem>) => void;
  nextPlayer: (total: number) => void;
  prevPlayer: () => void;
  reset: () => void;
}

export const useEvaluationStore = create<EvaluationState>((set) => ({
  currentIndex: 0,
  evaluations: {},

  loadEvaluations: (items) => set({ evaluations: items }),

  setEvaluation: (playerId, evalData) =>
    set((state) => {
      const prev = state.evaluations[playerId];
      const updated: EvaluationItem = {
        playerId,
        isPresent: evalData.isPresent ?? prev?.isPresent ?? true,
        score: evalData.score !== undefined ? evalData.score : prev?.score,
        absenceReason: evalData.absenceReason !== undefined ? evalData.absenceReason : prev?.absenceReason,
        comment: evalData.comment !== undefined ? evalData.comment : prev?.comment,
      };

      return {
        evaluations: {
          ...state.evaluations,
          [playerId]: updated,
        },
      };
    }),

  nextPlayer: (total) =>
    set((state) => ({
      currentIndex: Math.min(state.currentIndex + 1, total - 1),
    })),

  prevPlayer: () =>
    set((state) => ({
      currentIndex: Math.max(state.currentIndex - 1, 0),
    })),

  reset: () => set({ currentIndex: 0, evaluations: {} }),
}));