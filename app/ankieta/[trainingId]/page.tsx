"use client";

import { Suspense, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getPublicSurveySession,
  submitPublicSurveyResponse,
} from "@/app/actions/surveys";
import { useSurveyStore } from "@/store/useSurveyStore";

function SurveyContent() {
  const params = useParams();
  const token = params?.trainingId as string;
  const {
    data,
    loading,
    error: errorMsg,
    isExpired,
    fatigue,
    satisfaction,
    note,
    submitting,
    formError,
    submitted,
    setSession,
    setLoadError,
    setFatigue,
    setSatisfaction,
    setNote,
    setSubmitting,
    setFormError,
    markSubmitted,
    reset,
  } = useSurveyStore();

  useEffect(() => {
    reset();
    let active = true;
    async function loadSurvey() {
      const result = await getPublicSurveySession(token);
      if (!active) return;
      if (!result.success) {
        setLoadError(result.error || "Nie udało się załadować ankiety.", Boolean(result.isExpired));
      } else {
        setSession(result.data || null);
      }
    }

    if (token) void loadSurvey();
    return () => {
      active = false;
    };
  }, [reset, setLoadError, setSession, token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!data || !token) return;

    setSubmitting(true);
    setFormError(null);
    const result = await submitPublicSurveyResponse({
      token,
      fatigue,
      satisfaction,
      feedbackNote: note,
    });
    if (!result.success) {
      setSubmitting(false);
      setFormError(result.error || "Nie udało się zapisać odpowiedzi.");
      return;
    }
    markSubmitted();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm">
          <div className="w-5 h-5 border-2 border-[#133E2B] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-stone-700">Ładowanie ankiety...</span>
        </div>
      </main>
    );
  }

  if (isExpired || errorMsg || !data) {
    return (
      <main className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4 font-sans antialiased">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto font-black text-xl border border-amber-200">
            {isExpired ? "⏳" : "!"}
          </div>
          <h1 className="text-lg font-black text-stone-900 tracking-tight">
            {isExpired ? "Ankieta wygasła" : "Brak dostępu"}
          </h1>
          <p className="text-xs text-stone-600 leading-relaxed">
            {errorMsg || "Ten link do ankiety jest nieprawidłowy."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-stone-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-md mx-auto my-auto space-y-4">
        <header className="flex items-center justify-between pb-2 border-b border-stone-300/60">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border-2 border-[#133E2B] rounded-sm relative flex items-center justify-center bg-white/40">
              <div className="w-full h-[1.5px] bg-[#133E2B]" />
              <div className="w-2.5 h-2.5 rounded-full border-[1.5px] border-[#133E2B] absolute" />
            </div>
            <span className="text-lg font-black tracking-wider text-[#133E2B]">FORMA</span>
          </div>
          <span className="text-[10px] font-black tracking-widest uppercase bg-[#133E2B]/10 text-[#133E2B] px-2.5 py-1 rounded-md">
            RAPORT RPE
          </span>
        </header>

        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-sm">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
            Jednostka treningowa
          </span>
          <p className="text-sm font-black text-stone-900">{data.trainingDate}</p>
          {data.trainingTopic && (
            <p className="text-xs text-stone-500 font-medium truncate">{data.trainingTopic}</p>
          )}
        </div>

        <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
          {submitted ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto font-black text-2xl">
                ✓
              </div>
              <h2 className="text-base font-black text-stone-900 tracking-tight">Dziękujemy za odpowiedź</h2>
              <p className="text-xs text-stone-500">
                Ankieta zawodnika {data.playerName} została bezpiecznie zapisana.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="pb-3 border-b border-stone-100">
                <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                  Wypełniasz ankietę jako
                </span>
                <p className="text-sm font-black text-stone-900">{data.playerName}</p>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                  {formError}
                </div>
              )}

              <SurveyScale
                label="Poziom zmęczenia"
                value={fatigue}
                lowLabel="Lekki rozruch"
                highLabel="Maksymalny wycisk"
                onChange={setFatigue}
              />
              <SurveyScale
                label="Zadowolenie z treningu"
                value={satisfaction}
                lowLabel="Słabo"
                highLabel="Super jednostka"
                onChange={setSatisfaction}
              />

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-700 block mb-1.5">
                  Wiadomość do trenera (opcjonalnie)
                </label>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Np. lekki ból w dwugłowym, dobre tempo..."
                  rows={3}
                  maxLength={1000}
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#133E2B] focus:ring-1 focus:ring-[#133E2B] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#133E2B] text-white text-xs font-black tracking-wider uppercase rounded-2xl hover:bg-[#0E2C1E] active:scale-[0.99] transition-all disabled:opacity-50 shadow-md"
              >
                {submitting ? "Zapisuję..." : "Zatwierdź odpowiedź"}
              </button>
            </form>
          )}
        </div>

        <footer className="text-center text-[10px] font-bold text-stone-400 uppercase tracking-widest pt-2">
          FORMA • SYSTEM ZARZĄDZANIA AKADEMIĄ
        </footer>
      </div>
    </main>
  );
}

function SurveyScale({
  label,
  value,
  lowLabel,
  highLabel,
  onChange,
}: {
  label: string;
  value: number;
  lowLabel: string;
  highLabel: string;
  onChange: (value: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <label className="text-xs font-black uppercase tracking-wider text-stone-700">{label}</label>
        <span className="text-xs font-black px-2 py-0.5 bg-stone-100 text-stone-800 rounded">
          {value} / 5
        </span>
      </div>
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5].map((level) => (
          <button
            type="button"
            key={level}
            onClick={() => onChange(level)}
            aria-pressed={value === level}
            className={`py-3.5 rounded-xl text-sm font-black transition-all ${
              value === level
                ? "bg-[#133E2B] text-white shadow-md scale-[1.02]"
                : "bg-[#FAF9F5] text-stone-700 border border-stone-200 hover:bg-stone-100"
            }`}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-bold text-stone-400 mt-1.5 px-0.5">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export default function GroupSurveyPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
          <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm">
            <div className="w-5 h-5 border-2 border-[#133E2B] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-stone-700">Ładowanie ankiety...</span>
          </div>
        </main>
      }
    >
      <SurveyContent />
    </Suspense>
  );
}
