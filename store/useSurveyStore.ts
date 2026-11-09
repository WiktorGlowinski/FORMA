import { create } from "zustand";
import type { PublicSurveyInfo } from "@/app/actions/surveys";

interface SurveyState {
  data: PublicSurveyInfo | null;
  loading: boolean;
  error: string | null;
  isExpired: boolean;
  fatigue: number;
  satisfaction: number;
  note: string;
  submitting: boolean;
  formError: string | null;
  submitted: boolean;
  showFullSquadList: boolean;
  copiedPlayerId: string | null;
  allCopied: boolean;
  setLoading: (loading: boolean) => void;
  setSession: (data: PublicSurveyInfo | null) => void;
  setLoadError: (error: string | null, isExpired?: boolean) => void;
  setFatigue: (value: number) => void;
  setSatisfaction: (value: number) => void;
  setNote: (value: string) => void;
  setSubmitting: (submitting: boolean) => void;
  setFormError: (error: string | null) => void;
  markSubmitted: () => void;
  setShowFullSquadList: (value: boolean) => void;
  setCopiedPlayerId: (value: string | null) => void;
  setAllCopied: (value: boolean) => void;
  reset: () => void;
}

const initialState = {
  data: null,
  loading: true,
  error: null,
  isExpired: false,
  fatigue: 3,
  satisfaction: 4,
  note: "",
  submitting: false,
  formError: null,
  submitted: false,
  showFullSquadList: false,
  copiedPlayerId: null,
  allCopied: false,
} satisfies Pick<
  SurveyState,
  | "data"
  | "loading"
  | "error"
  | "isExpired"
  | "fatigue"
  | "satisfaction"
  | "note"
  | "submitting"
  | "formError"
  | "submitted"
  | "showFullSquadList"
  | "copiedPlayerId"
  | "allCopied"
>;

export const useSurveyStore = create<SurveyState>((set) => ({
  ...initialState,
  setLoading: (loading) => set({ loading }),
  setSession: (data) => set({ data, loading: false, error: null, isExpired: false }),
  setLoadError: (error, isExpired = false) => set({ error, isExpired, loading: false }),
  setFatigue: (fatigue) => set({ fatigue }),
  setSatisfaction: (satisfaction) => set({ satisfaction }),
  setNote: (note) => set({ note }),
  setSubmitting: (submitting) => set({ submitting }),
  setFormError: (formError) => set({ formError }),
  markSubmitted: () => set({ submitted: true, submitting: false }),
  setShowFullSquadList: (showFullSquadList) => set({ showFullSquadList }),
  setCopiedPlayerId: (copiedPlayerId) => set({ copiedPlayerId }),
  setAllCopied: (allCopied) => set({ allCopied }),
  reset: () => set(initialState),
}));
