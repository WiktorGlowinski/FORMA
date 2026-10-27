'use client';

import { Suspense, useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getTrainingWithPlayers, submitTrainingEvaluations } from '@/app/actions/evaluations';
import { useEvaluationStore } from '@/store/useEvaluationStore';

const ABSENCE_OPTIONS = [
  { id: 'injury', label: 'Kontuzja' },
  { id: 'sick', label: 'Choroba' },
  { id: 'excused', label: 'Usprawiedliwiona' },
  { id: 'unexcused', label: 'Nieusprawiedliwiona' },
] as const;

function EvaluateContent() {
  const params = useParams();
  const router = useRouter();
  const trainingId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [training, setTraining] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [isPending, startTransition] = useTransition();
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);

  const { currentIndex, evaluations, setEvaluation, loadEvaluations, nextPlayer, prevPlayer, reset } = useEvaluationStore();

  useEffect(() => {
    async function loadData() {
      const res = await getTrainingWithPlayers(trainingId);
      if (res.success) {
        setTraining(res.training);
        setPlayers(res.players || []);

        // Załaduj istniejące oceny z bazy do store Zustand
        if (res.existingEvaluations && res.existingEvaluations.length > 0) {
          const initialMap: Record<string, any> = {};
          res.existingEvaluations.forEach((ev: any) => {
            initialMap[ev.player_id] = {
              playerId: ev.player_id,
              isPresent: ev.is_present,
              score: ev.score,
              absenceReason: ev.absence_reason,
              comment: ev.comment,
            };
          });
          loadEvaluations(initialMap);
        }
      } else {
        setErrorMessage(res.error || 'Błąd wczytywania danych');
      }
      setLoading(false);
    }
    loadData();
  }, [trainingId, loadEvaluations]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center text-sm font-medium text-[#2d3a30]">
        Wczytywanie składu...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center p-4">
        <div className="bg-[#ede7da] border border-[#d8d0c0] p-6 rounded-xl text-center max-w-sm">
          <p className="text-sm font-semibold text-[#8b2e2e]">{errorMessage}</p>
        </div>
      </div>
    );
  }

  if (!training || players.length === 0) {
    return (
      <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center p-4">
        <div className="bg-[#ede7da] border border-[#d8d0c0] p-6 rounded-xl text-center max-w-sm">
          <p className="text-sm text-[#505a52]">Brak zawodników przypisanych do tej jednostki.</p>
        </div>
      </div>
    );
  }

  const currentPlayer = players[currentIndex];
  const currentEval = evaluations[currentPlayer.id];
  const total = players.length;
  const evaluatedCount = Object.keys(evaluations).length;

  const handleScore = (score: '-' | '0' | '+') => {
    setEvaluation(currentPlayer.id, { isPresent: true, score, absenceReason: undefined });
    if (currentIndex < total - 1) {
      nextPlayer(total);
    }
  };

  const handleSelectAbsence = (reason: 'injury' | 'sick' | 'excused' | 'unexcused') => {
    setEvaluation(currentPlayer.id, { isPresent: false, score: undefined, absenceReason: reason });
    setShowAbsenceModal(false);
    if (currentIndex < total - 1) {
      nextPlayer(total);
    }
  };

  const handleFinish = () => {
    startTransition(async () => {
      const items = Object.values(evaluations);
      // Przekazujemy null jako coachId, żeby nie naruszać FK
      const res = await submitTrainingEvaluations(
        training.id,
        training.club_id,
        null,
        items
      );

      if (res.success) {
        alert('Oceny zostały zapisane.');
      } else {
        alert('Błąd zapisu: ' + res.error);
      }
    });
  };

  const currentAbsenceLabel = ABSENCE_OPTIONS.find((r) => r.id === currentEval?.absenceReason)?.label;

  return (
    <div className="min-h-screen bg-[#f4efe6] text-[#1c241e] font-sans flex flex-col justify-between p-4 sm:p-6">
      <div className="max-w-md w-full mx-auto">
        <div className="bg-[#1a3826] text-[#e8f0eb] rounded-t-xl px-4 py-2.5 flex justify-between items-center text-xs tracking-wide">
          <span className="font-medium truncate max-w-[200px]">
            {training.topic || 'Trening drużyny'}
          </span>
          <span className="font-semibold text-[#b8d6c2]">
            Oceniono {evaluatedCount}/{total}
          </span>
        </div>

        <div className="bg-[#faf7f0] border-x border-b border-[#ded7c8] rounded-b-xl p-6 shadow-sm">
          <div className="text-[11px] uppercase tracking-widest text-[#727d74] font-semibold mb-2">
            Zawodnik {currentIndex + 1} z {total}
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-[#1a3826] text-[#f4efe6] text-xs font-bold">
              {currentPlayer.jersey_number || '•'}
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-[#162119]">
              {currentPlayer.first_name} {currentPlayer.last_name}
            </h2>
          </div>

          <p className="text-xs text-[#677369] mt-2 leading-relaxed">
            Względem własnego poziomu, nie względem kolegów.
          </p>

          <div className="mt-4 pt-3 border-t border-[#eee7da] flex items-center justify-between text-xs">
            <span className="text-[#7c887e]">Status wpisu:</span>
            <span className="font-semibold text-[#1a3826]">
              {currentEval ? (
                currentEval.isPresent ? (
                  `Ocena: ${currentEval.score === '-' ? 'Słabiej (-)' : currentEval.score === '0' ? 'Typowo (0)' : 'Powyżej (+)'}`
                ) : (
                  `Nieobecny: ${currentAbsenceLabel}`
                )
              ) : (
                'Brak'
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2.5 mt-5">
          <button
            type="button"
            onClick={() => handleScore('-')}
            className={`py-5 rounded-lg border text-center transition active:scale-[0.98] ${
              currentEval?.isPresent && currentEval?.score === '-'
                ? 'bg-[#1a3826] border-[#1a3826] text-[#f4efe6]'
                : 'bg-[#eae3d2] border-[#d5ccba] text-[#1c241e] hover:bg-[#e2d9c6]'
            }`}
          >
            <span className="block text-2xl font-bold leading-none mb-1.5">-</span>
            <span className={`text-[11px] font-medium tracking-wide uppercase ${
              currentEval?.isPresent && currentEval?.score === '-' ? 'text-[#c8decb]' : 'text-[#5d675e]'
            }`}>
              Słabiej
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleScore('0')}
            className={`py-5 rounded-lg border text-center transition active:scale-[0.98] ${
              currentEval?.isPresent && currentEval?.score === '0'
                ? 'bg-[#1a3826] border-[#1a3826] text-[#f4efe6]'
                : 'bg-[#eae3d2] border-[#d5ccba] text-[#1c241e] hover:bg-[#e2d9c6]'
            }`}
          >
            <span className="block text-2xl font-bold leading-none mb-1.5">0</span>
            <span className={`text-[11px] font-medium tracking-wide uppercase ${
              currentEval?.isPresent && currentEval?.score === '0' ? 'text-[#c8decb]' : 'text-[#5d675e]'
            }`}>
              Typowo
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleScore('+')}
            className={`py-5 rounded-lg border text-center transition active:scale-[0.98] ${
              currentEval?.isPresent && currentEval?.score === '+'
                ? 'bg-[#1a3826] border-[#1a3826] text-[#f4efe6]'
                : 'bg-[#eae3d2] border-[#d5ccba] text-[#1c241e] hover:bg-[#e2d9c6]'
            }`}
          >
            <span className="block text-2xl font-bold leading-none mb-1.5">+</span>
            <span className={`text-[11px] font-medium tracking-wide uppercase ${
              currentEval?.isPresent && currentEval?.score === '+' ? 'text-[#c8decb]' : 'text-[#5d675e]'
            }`}>
              Powyżej
            </span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAbsenceModal(true)}
          className={`w-full mt-3 py-2.5 px-3 rounded-lg border text-xs font-medium transition text-center ${
            currentEval && !currentEval.isPresent
              ? 'bg-[#e5dcd0] border-[#9c8477] text-[#5e2b24] font-semibold'
              : 'border-[#d5ccba] bg-[#f0ebd9]/60 text-[#5f6b61] hover:bg-[#ebe4d0]'
          }`}
        >
          {currentEval && !currentEval.isPresent
            ? `Nieobecność: ${currentAbsenceLabel} (zmień)`
            : 'Oznacz nieobecność zawodnika'}
        </button>
      </div>

      <div className="max-w-md w-full mx-auto flex gap-2.5 pt-4">
        <button
          type="button"
          onClick={prevPlayer}
          disabled={currentIndex === 0}
          className="flex-1 py-3 text-xs uppercase tracking-wider font-semibold border border-[#d5ccba] bg-[#eae3d2] text-[#2c382f] rounded-lg disabled:opacity-30 disabled:pointer-events-none hover:bg-[#e2d9c6]"
        >
          Wstecz
        </button>

        {currentIndex === total - 1 ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isPending}
            className="flex-1 py-3 text-xs uppercase tracking-wider font-semibold bg-[#1a3826] text-[#f4efe6] rounded-lg shadow-sm hover:bg-[#132c1e] disabled:opacity-50"
          >
            {isPending ? 'Zapisywanie...' : 'Zapisz oceny'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => nextPlayer(total)}
            className="flex-1 py-3 text-xs uppercase tracking-wider font-semibold bg-[#2b3a2f] text-[#f4efe6] rounded-lg hover:bg-[#1f2b23]"
          >
            Dalej
          </button>
        )}
      </div>

      {showAbsenceModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-[#faf7f0] border border-[#dcd5c7] rounded-xl w-full max-w-sm p-5 space-y-3 shadow-xl">
            <div className="border-b border-[#ece5d8] pb-3">
              <h3 className="font-bold text-[#1a281e] text-base">Powód nieobecności</h3>
              <p className="text-xs text-[#6e7a70] mt-0.5">
                {currentPlayer.first_name} {currentPlayer.last_name}
              </p>
            </div>

            <div className="space-y-1.5 pt-1">
              {ABSENCE_OPTIONS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectAbsence(item.id)}
                  className="w-full py-2.5 px-3.5 text-left text-xs font-semibold uppercase tracking-wider text-[#223026] bg-[#eae3d2] border border-[#d5ccba] rounded-lg hover:bg-[#dfd7c3] active:bg-[#d6cdb7] transition flex justify-between items-center"
                >
                  <span>{item.label}</span>
                  <span className="text-[#7f8c81] text-[10px]">Wybierz</span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAbsenceModal(false)}
              className="w-full pt-2 text-center text-xs font-medium text-[#738075] hover:text-[#1c241e]"
            >
              Anuluj
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EvaluateTrainingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center text-xs font-medium text-[#2d3a30]">
          Ładowanie...
        </div>
      }
    >
      <EvaluateContent />
    </Suspense>
  );
}