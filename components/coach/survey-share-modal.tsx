"use client";

import { useState } from "react";
import type { SurveyStatusItem } from "@/app/actions/coach";

interface SurveyShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  surveys: SurveyStatusItem[];
  shareText: string;
}

export function SurveyShareModal({ isOpen, onClose, surveys, shareText }: SurveyShareModalProps) {
  const [copiedPlayerId, setCopiedPlayerId] = useState<string | null>(null);
  const [allCopied, setAllCopied] = useState(false);

  if (!isOpen) return null;

  // 1. Uniwersalne udostępnienie systemowe (Web Share API) z fallbackiem do schowka
  const handleUniversalShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Ankieta potreningowa — FORMA",
          text: shareText,
        });
        return;
      } catch (err) {
        // Użytkownik zamknął arkusz udostępniania bez wyboru – brak akcji
      }
    }

    // Fallback: kopiowanie do schowka, gdy Web Share jest niedostępne (np. desktop)
    await navigator.clipboard.writeText(shareText);
    setAllCopied(true);
    setTimeout(() => setAllCopied(false), 2500);
  };

  // 2. Kopiowanie linku konkretnego zawodnika do wiadomości prywatnej
  const handleCopySingle = async (playerId: string, url: string) => {
    await navigator.clipboard.writeText(url);
    setCopiedPlayerId(playerId);
    setTimeout(() => setCopiedPlayerId(null), 2000);
  };

  const completedCount = surveys.filter((s) => s.isCompleted).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#FAF9F5] rounded-t-3xl sm:rounded-3xl border border-stone-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Nagłówek */}
        <div className="p-5 border-b border-stone-200 bg-white flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
              Zwrot ankiet: {completedCount}/{surveys.length}
            </span>
            <h2 className="text-lg font-black text-stone-900 mt-1">Udostępnij ankiety RPE</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600 flex items-center justify-center font-bold text-sm"
          >
            ✕
          </button>
        </div>

        {/* Główny przycisk udostępniania */}
        <div className="p-5 border-b border-stone-200 bg-white space-y-2">
          <button
            onClick={handleUniversalShare}
            className="w-full py-3.5 bg-stone-900 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 active:scale-[0.99] transition-all shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {allCopied ? "Skopiowano listę do schowka!" : "Udostępnij listę (dowolna aplikacja)"}
          </button>
          <p className="text-[11px] text-center text-stone-500">
            Otwiera menu telefonu (Messenger, SMS, Discord, Schowek itp.)
          </p>
        </div>

        {/* Lista imienna per zawodnik */}
        <div className="p-5 overflow-y-auto space-y-2.5 flex-1">
          <h3 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2">
            Pojedyncze linki do wiadomości prywatnych:
          </h3>

          {surveys.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-3 bg-white rounded-xl border border-stone-200 shadow-sm text-sm"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-6 h-6 rounded-full bg-stone-100 text-stone-600 font-bold text-[11px] flex items-center justify-center shrink-0">
                  {s.jerseyNumber ?? "•"}
                </span>
                <div className="truncate">
                  <p className="font-bold text-stone-800 truncate">{s.playerName}</p>
                  <p className="text-[11px] text-stone-400">
                    {s.isCompleted ? (
                      <span className="text-emerald-700 font-semibold">
                        Wypełniono (zmęczenie: {s.fatigue}/5)
                      </span>
                    ) : (
                      "Oczekuje na odpowiedź"
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleCopySingle(s.playerId, s.surveyUrl)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  copiedPlayerId === s.playerId
                    ? "bg-emerald-800 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {copiedPlayerId === s.playerId ? "Skopiowano!" : "Kopiuj link"}
              </button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}