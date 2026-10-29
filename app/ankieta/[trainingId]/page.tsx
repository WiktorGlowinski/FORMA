"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  getTrainingSurveySession,
  submitGroupSurveyResponse,
  type TrainingSurveyInfo,
} from "@/app/actions/surveys";

function SurveyContent() {
  const params = useParams();
  const trainingId = params?.trainingId as string;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<TrainingSurveyInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [birthYear, setBirthYear] = useState("");
  const [fatigue, setFatigue] = useState<number>(3);
  const [satisfaction, setSatisfaction] = useState<number>(4);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submittedName, setSubmittedName] = useState<string | null>(null);

  const loadData = async () => {
    if (!trainingId) return;
    const res = await getTrainingSurveySession(trainingId);
    if (!res.success || !res.data) {
      setErrorMsg(res.error || "Nie udało się załadować jednostki.");
    } else {
      setData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [trainingId]);

  const handleSelectPlayer = (id: string) => {
    setSelectedPlayerId(id);
    setBirthYear("");
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId || !data) return;

    setFormError(null);
    const parsedYear = parseInt(birthYear.trim(), 10);

    if (isNaN(parsedYear) || parsedYear < 1950 || parsedYear > new Date().getFullYear()) {
      setFormError("Wpisz poprawny 4-cyfrowy rok urodzenia (np. 2008).");
      return;
    }

    setSubmitting(true);
    const activePlayer = data.pendingPlayers.find((p) => p.id === selectedPlayerId);

    const res = await submitGroupSurveyResponse({
      trainingId,
      playerId: selectedPlayerId,
      birthYear: parsedYear,
      fatigue,
      satisfaction,
      feedbackNote: note,
    });

    setSubmitting(false);

    if (!res.success) {
      setFormError(res.error || "Wystąpił błąd podczas weryfikacji.");
    } else {
      setSubmittedName(`${activePlayer?.firstName} ${activePlayer?.lastName}`);
      setSelectedPlayerId(null);
      setBirthYear("");
      setNote("");
      setFormError(null);
      loadData();
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <div className="flex items-center gap-3 bg-white px-5 py-3 rounded-2xl border border-stone-200 shadow-sm">
          <div className="w-5 h-5 border-2 border-[#133E2B] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-bold text-stone-700">Wczytywanie listy szatni...</span>
        </div>
      </main>
    );
  }

  if (errorMsg || !data) {
    return (
      <main className="min-h-screen bg-[#F4F1EA] flex items-center justify-center p-4">
        <div className="bg-white border border-stone-200 rounded-3xl p-8 max-w-sm w-full text-center shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-600 flex items-center justify-center mx-auto mb-4 font-black">
            !
          </div>
          <h1 className="text-lg font-black text-stone-900 mb-2 tracking-tight">Brak dostępu</h1>
          <p className="text-xs text-stone-600 leading-relaxed">{errorMsg}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F4F1EA] text-stone-900 flex flex-col justify-between p-4 sm:p-6 font-sans antialiased">
      <div className="w-full max-w-md mx-auto my-auto space-y-4">
        
        {/* BRANDING HEADER */}
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

        {/* KARTA JEDNOSTKI */}
        <div className="bg-white border border-stone-200/90 rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Jednostka treningowa</span>
            <p className="text-sm font-black text-stone-900">{data.date}</p>
            {data.topic && <p className="text-xs text-stone-500 font-medium truncate max-w-xs">{data.topic}</p>}
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Do wypełnienia</span>
            <span className="text-xs font-black text-[#133E2B] bg-[#133E2B]/10 px-2 py-0.5 rounded-md">
              {data.pendingPlayers.length} graczy
            </span>
          </div>
        </div>

        {/* KOMUNIKAT POTWIERDZENIA */}
        {submittedName && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 animate-in fade-in">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-900">Zapisano: {submittedName}</p>
              <p className="text-[11px] text-emerald-700">Dzięki! Podaj telefon kolejnej osobie z szatni.</p>
            </div>
          </div>
        )}

        {/* GŁÓWNA KARTA */}
        <div className="bg-white border border-stone-200/90 rounded-3xl p-5 sm:p-6 shadow-sm">
          {data.pendingPlayers.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="w-14 h-14 bg-[#133E2B]/10 text-[#133E2B] rounded-2xl flex items-center justify-center mx-auto font-black text-2xl">
                ✓
              </div>
              <h2 className="text-base font-black text-stone-900 tracking-tight">Komplet odpowiedzi szatni</h2>
              <p className="text-xs text-stone-500 max-w-xs mx-auto">
                Wszyscy obecni zawodnicy przesłali swoje parametry zmęczenia. Trener posiada już pełen raport.
              </p>
            </div>
          ) : !selectedPlayerId ? (
            /* KROK 1: LISTA SZATNI */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-wider text-stone-600">
                  Wybierz swoje nazwisko:
                </h2>
                <span className="text-[11px] font-bold text-stone-400">
                  Krok 1 z 2
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto pr-1">
                {data.pendingPlayers.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => handleSelectPlayer(player.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200/90 bg-[#FAF9F5] hover:bg-stone-50 hover:border-[#133E2B] transition-all text-left group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-stone-200 text-stone-700 text-xs font-black flex items-center justify-center">
                        {player.jerseyNumber ?? "—"}
                      </span>
                      <span className="text-sm font-bold text-stone-900 group-hover:text-[#133E2B] transition-colors">
                        {player.firstName} {player.lastName}
                      </span>
                    </div>
                    <span className="text-xs text-stone-400 group-hover:text-[#133E2B] transition-colors">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* KROK 2: FORMULARZ RPE */
            <form onSubmit={handleSubmit} className="space-y-5 animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div>
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">Wypełniasz jako</span>
                  <p className="text-sm font-black text-stone-900">
                    {data.pendingPlayers.find((p) => p.id === selectedPlayerId)?.firstName}{" "}
                    {data.pendingPlayers.find((p) => p.id === selectedPlayerId)?.lastName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlayerId(null)}
                  className="text-xs font-bold text-stone-400 hover:text-stone-800 underline transition-colors"
                >
                  Zmień
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700">
                  {formError}
                </div>
              )}

              {/* ROK URODZENIA */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-700 block mb-1.5">
                  Twój rok urodzenia: <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  value={birthYear}
                  onChange={(e) => setBirthYear(e.target.value)}
                  placeholder="np. 2009"
                  required
                  className="w-full text-sm font-bold p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#133E2B] focus:ring-1 focus:ring-[#133E2B] transition-all"
                />
                <p className="text-[10px] text-stone-400 mt-1">Weryfikacja tożsamości szatniowej.</p>
              </div>

              {/* SKALA ZMĘCZENIA */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-700">
                    Poziom zmęczenia
                  </label>
                  <span className="text-xs font-black px-2 py-0.5 bg-stone-100 text-stone-800 rounded">
                    {fatigue} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setFatigue(lvl)}
                      className={`py-3.5 rounded-xl text-sm font-black transition-all ${
                        fatigue === lvl
                          ? "bg-[#133E2B] text-white shadow-md scale-[1.02]"
                          : "bg-[#FAF9F5] text-stone-700 border border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-stone-400 mt-1.5 px-0.5">
                  <span>Lekki rozruch</span>
                  <span>Maksymalny wycisk</span>
                </div>
              </div>

              {/* SKALA ZADOWOLENIA */}
              <div>
                <div className="flex justify-between items-baseline mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-stone-700">
                    Zadowolenie z treningu
                  </label>
                  <span className="text-xs font-black px-2 py-0.5 bg-stone-100 text-stone-800 rounded">
                    {satisfaction} / 5
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
                  {[1, 2, 3, 4, 5].map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      onClick={() => setSatisfaction(lvl)}
                      className={`py-3.5 rounded-xl text-sm font-black transition-all ${
                        satisfaction === lvl
                          ? "bg-[#133E2B] text-white shadow-md scale-[1.02]"
                          : "bg-[#FAF9F5] text-stone-700 border border-stone-200 hover:bg-stone-100"
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] font-bold text-stone-400 mt-1.5 px-0.5">
                  <span>Słabo</span>
                  <span>Super jednostka</span>
                </div>
              </div>

              {/* NOTATKA */}
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-stone-700 block mb-1.5">
                  Wiadomość do trenera (opcjonalnie)
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Np. lekki ból w dwugłowym, dobre gierki..."
                  rows={2}
                  className="w-full text-xs font-medium p-3.5 rounded-xl border border-stone-200 bg-[#FAF9F5] focus:bg-white focus:outline-none focus:border-[#133E2B] focus:ring-1 focus:ring-[#133E2B] transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#133E2B] text-white text-xs font-black tracking-wider uppercase rounded-2xl hover:bg-[#0E2C1E] active:scale-[0.99] transition-all disabled:opacity-50 shadow-md"
              >
                {submitting ? "Weryfikuję i zapisuję..." : "Zatwierdź ocenę jednostki"}
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