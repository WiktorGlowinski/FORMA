"use client";

import { useState } from "react";

export interface EmergencyPlayer {
  id: string;
  firstName: string;
  lastName: string;
  jerseyNumber?: number | null;
  parentName?: string | null;
  parentPhone?: string | null;
  phone?: string | null;
}

interface EmergencyContactModalProps {
  players: EmergencyPlayer[];
}

export function EmergencyContactModal({ players }: EmergencyContactModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredPlayers = players.filter((p) =>
    `${p.firstName} ${p.lastName} ${p.jerseyNumber ?? ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-md transition-all shrink-0"
      >
        <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
        <span>SOS • Kontakty</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-[#FAF9F5] border border-stone-200 rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            
            {/* Nagłówek modalu */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-black text-sm">
                  ☎
                </div>
                <div>
                  <h2 className="text-sm font-black text-stone-900 uppercase tracking-tight">
                    Kontakty awaryjne szatni
                  </h2>
                  <p className="text-[11px] text-stone-500 font-medium">
                    Natychmiastowe połączenie w razie urazu na boisku
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-stone-200 text-stone-600 font-bold hover:bg-stone-300 flex items-center justify-center text-sm transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Szukajka */}
            <div>
              <input
                type="text"
                placeholder="Szukaj zawodnika po nazwisku lub numerze..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-200 bg-white text-xs font-bold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
              />
            </div>

            {/* Lista zawodników z bezpośrednimi przyciskami tel */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {filteredPlayers.length === 0 ? (
                <p className="text-center text-xs text-stone-400 py-6">
                  Nie znaleziono zawodnika.
                </p>
              ) : (
                filteredPlayers.map((player) => {
                  const targetPhone = player.parentPhone || player.phone;
                  const contactLabel = player.parentPhone
                    ? `Rodzic: ${player.parentName || "Opiekun"}`
                    : "Telefon zawodnika";

                  return (
                    <div
                      key={player.id}
                      className="p-3 bg-white border border-stone-200/90 rounded-2xl flex items-center justify-between gap-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-stone-100 text-stone-700 text-xs font-black flex items-center justify-center shrink-0">
                          {player.jerseyNumber ?? "—"}
                        </span>
                        <div className="min-w-0">
                          <p className="text-xs font-black text-stone-900 truncate">
                            {player.firstName} {player.lastName}
                          </p>
                          <p className="text-[10px] text-stone-400 font-bold truncate">
                            {contactLabel}
                          </p>
                        </div>
                      </div>

                      {targetPhone ? (
                        <a
                          href={`tel:${targetPhone}`}
                          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-black transition-all shadow-sm shrink-0"
                        >
                          <span>📞 Zadzwoń</span>
                          <span className="text-[10px] opacity-80 hidden sm:inline">
                            ({targetPhone})
                          </span>
                        </a>
                      ) : (
                        <span className="text-[10px] font-bold text-stone-400 bg-stone-100 px-2.5 py-1.5 rounded-lg shrink-0">
                          Brak numeru
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}
    </>
  );
}