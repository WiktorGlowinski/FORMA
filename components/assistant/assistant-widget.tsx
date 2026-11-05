"use client";

import { type FormEvent, useCallback, useState, useSyncExternalStore } from "react";
import {
  Bot,
  Check,
  ChevronDown,
  Download,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  confirmAssistantAction,
  downloadAssistantCsvAction,
  runAssistantAction,
  type AssistantHistoryMessage,
  type AssistantPlayerResult,
  type AssistantPendingAction,
  type AssistantReply,
  type AssistantTrainingResult,
} from "@/app/actions/assistant";
import type { CsvPlayerRecord } from "@/app/actions/admin";

interface ChatMessage extends AssistantHistoryMessage {
  id: string;
  trainings?: AssistantReply["trainings"];
  players?: AssistantReply["players"];
  csvRecords?: CsvPlayerRecord[];
  proposal?: AssistantPendingAction;
}

interface PersistedAssistantState {
  messages: ChatMessage[];
  isOpen: boolean;
  input: string;
  privacyAccepted: boolean;
}

const ASSISTANT_STORAGE_VERSION = 1;
const MAX_PERSISTED_MESSAGES = 40;
const DEFAULT_ASSISTANT_STATE: PersistedAssistantState = {
  messages: [],
  isOpen: false,
  input: "",
  privacyAccepted: false,
};
const DEFAULT_ASSISTANT_SNAPSHOT = JSON.stringify(DEFAULT_ASSISTANT_STATE);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isCsvPlayerRecord(value: unknown): value is CsvPlayerRecord {
  return isRecord(value) &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    typeof value.birthYear === "number" &&
    (value.jerseyNumber === undefined || value.jerseyNumber === null || typeof value.jerseyNumber === "number") &&
    ["phone", "email", "parentName", "parentPhone", "parentEmail"].every(
      (key) => value[key] === undefined || typeof value[key] === "string"
    );
}

function isAssistantTrainingResult(value: unknown): value is AssistantTrainingResult {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.date === "string" &&
    typeof value.startTime === "string" &&
    typeof value.endTime === "string" &&
    typeof value.teamName === "string" &&
    typeof value.status === "string" &&
    (value.topic === null || typeof value.topic === "string") &&
    (value.trainingType === null || typeof value.trainingType === "string") &&
    (value.mainGoal === null || typeof value.mainGoal === "string") &&
    (value.organizationalNote === null || typeof value.organizationalNote === "string") &&
    (value.field === null || typeof value.field === "string") &&
    (value.href === null || typeof value.href === "string");
}

function isAssistantPlayerResult(value: unknown): value is AssistantPlayerResult {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.firstName === "string" &&
    typeof value.lastName === "string" &&
    (value.birthYear === null || typeof value.birthYear === "number") &&
    (value.jerseyNumber === null || typeof value.jerseyNumber === "number") &&
    typeof value.teamName === "string" &&
    (value.href === null || typeof value.href === "string");
}

function isPendingAction(value: unknown): value is AssistantPendingAction {
  if (!isRecord(value)) return false;
  if (value.kind === "create_players") {
    return typeof value.teamId === "string" &&
      typeof value.teamName === "string" &&
      Array.isArray(value.players) &&
      value.players.every(isCsvPlayerRecord);
  }
  if (value.kind === "create_training") {
    return ["teamId", "teamName", "fieldId", "fieldName", "date", "startTime", "endTime",
      "topic", "mainGoal", "trainingType", "organizationalNote"].every(
      (key) => typeof value[key] === "string"
    );
  }
  return false;
}

function restoreAssistantMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Record<string, unknown> =>
      isRecord(item) &&
      typeof item.id === "string" &&
      (item.role === "user" || item.role === "assistant") &&
      typeof item.content === "string"
    )
    .slice(-MAX_PERSISTED_MESSAGES)
    .map((item) => {
      const message: ChatMessage = {
        id: item.id as string,
        role: item.role as AssistantHistoryMessage["role"],
        content: (item.content as string).slice(0, 5000),
      };
      if (Array.isArray(item.trainings) && item.trainings.every(isAssistantTrainingResult)) {
        message.trainings = item.trainings;
      }
      if (Array.isArray(item.players) && item.players.every(isAssistantPlayerResult)) {
        message.players = item.players;
      }
      if (Array.isArray(item.csvRecords) && item.csvRecords.every(isCsvPlayerRecord)) {
        message.csvRecords = item.csvRecords;
      }
      if (isPendingAction(item.proposal)) message.proposal = item.proposal;
      return message;
    });
}

function getAssistantStorageKey(userId: string) {
  return `forma-assistant:v${ASSISTANT_STORAGE_VERSION}:${userId}`;
}

function getAssistantSnapshot(userId: string) {
  try {
    return sessionStorage.getItem(getAssistantStorageKey(userId)) || DEFAULT_ASSISTANT_SNAPSHOT;
  } catch {
    return DEFAULT_ASSISTANT_SNAPSHOT;
  }
}

function parseAssistantSnapshot(snapshot: string): PersistedAssistantState {
  try {
    const value: unknown = JSON.parse(snapshot);
    if (!isRecord(value)) return DEFAULT_ASSISTANT_STATE;
    return {
      messages: restoreAssistantMessages(value.messages),
      isOpen: value.isOpen === true,
      input: typeof value.input === "string" ? value.input.slice(0, 3000) : "",
      privacyAccepted: value.privacyAccepted === true,
    };
  } catch {
    return DEFAULT_ASSISTANT_STATE;
  }
}

function usePersistentAssistantState(userId: string) {
  const subscribe = useCallback((onStoreChange: () => void) => {
    window.addEventListener("storage", onStoreChange);
    window.addEventListener("forma-assistant-state-change", onStoreChange);
    return () => {
      window.removeEventListener("storage", onStoreChange);
      window.removeEventListener("forma-assistant-state-change", onStoreChange);
    };
  }, []);
  const getSnapshot = useCallback(() => getAssistantSnapshot(userId), [userId]);
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_ASSISTANT_SNAPSHOT);

  const updateState = useCallback((
    update: (current: PersistedAssistantState) => PersistedAssistantState
  ) => {
    try {
      const current = parseAssistantSnapshot(getAssistantSnapshot(userId));
      const next = update(current);
      sessionStorage.setItem(
        getAssistantStorageKey(userId),
        JSON.stringify({
          ...next,
          messages: next.messages.slice(-MAX_PERSISTED_MESSAGES),
        })
      );
      window.dispatchEvent(new Event("forma-assistant-state-change"));
      return true;
    } catch (error: unknown) {
      console.error("Nie udało się zapisać rozmowy asystenta:", error);
      return false;
    }
  }, [userId]);

  return [parseAssistantSnapshot(snapshot), updateState] as const;
}

function formatTime(value: string) {
  return value ? value.slice(0, 5) : "";
}

function ProposalPreview({
  proposal,
  isConfirming,
  onConfirm,
  onCancel,
}: {
  proposal: AssistantPendingAction;
  isConfirming: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3 text-xs">
      {proposal.kind === "create_players" ? (
        <>
          <p className="font-bold">
            {proposal.players.length} zawodników · drużyna {proposal.teamName}
          </p>
          <div className="mt-2 max-h-36 overflow-auto">
            <table className="w-full text-left">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-1 pr-2">Zawodnik</th>
                  <th className="py-1 pr-2">Rocznik</th>
                  <th className="py-1">Kontakt</th>
                </tr>
              </thead>
              <tbody>
                {proposal.players.map((player, index) => (
                  <tr key={`${player.firstName}-${player.lastName}-${index}`} className="border-t border-border/70">
                    <td className="py-1 pr-2">{player.firstName} {player.lastName}</td>
                    <td className="py-1 pr-2">{player.birthYear}</td>
                    <td className="py-1">
                      {player.parentPhone || player.phone || "brak"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <p className="font-bold">Nowy trening · {proposal.teamName}</p>
          <p className="mt-1 text-muted-foreground">
            {proposal.date}, {proposal.startTime}–{proposal.endTime} · {proposal.fieldName}
          </p>
          {proposal.topic && <p className="mt-1">{proposal.topic}</p>}
          {proposal.mainGoal && <p className="mt-1 text-muted-foreground">Cel: {proposal.mainGoal}</p>}
        </>
      )}
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={isConfirming}
          className="inline-flex items-center gap-1.5 rounded-lg border border-foreground bg-primary px-3 py-2 font-bold text-primary-foreground disabled:opacity-60"
        >
          {isConfirming ? <LoaderCircle className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          Potwierdź i zapisz
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={isConfirming}
          className="rounded-lg border border-border px-3 py-2 font-semibold hover:bg-muted disabled:opacity-60"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}

export function AssistantWidget({ userId }: { userId: string }) {
  const [assistantState, updateAssistantState] = usePersistentAssistantState(userId);
  const { isOpen, input, messages, privacyAccepted } = assistantState;
  const [isSending, setIsSending] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const message = input.trim();
    if (!message || isSending || !privacyAccepted) return;

    const history = messages.map(({ role, content }) => ({ role, content }));
    setErrorMessage(null);
    setIsSending(true);
    const savedUserMessage = updateAssistantState((current) => ({
      ...current,
      input: "",
      messages: [...current.messages, {
        id: crypto.randomUUID(),
        role: "user",
        content: message,
      }],
    }));
    if (!savedUserMessage) {
      setErrorMessage("Nie udało się zapisać rozmowy w tej karcie przeglądarki.");
      setIsSending(false);
      return;
    }

    try {
      const result = await runAssistantAction(message, history);
      if (!result.success || !result.data) {
        setErrorMessage(result.error || "Nie udało się wykonać polecenia.");
        return;
      }
      const data = result.data;
      const savedAssistantMessage = updateAssistantState((current) => ({
        ...current,
        messages: [...current.messages, {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          trainings: data.trainings,
          players: data.players,
          csvRecords: data.csvRecords,
          proposal: data.proposal,
        }],
      }));
      if (!savedAssistantMessage) {
        setErrorMessage("Odpowiedź powstała, ale nie udało się zachować jej w tej karcie.");
      }
    } catch {
      setErrorMessage("Nie udało się połączyć z asystentem. Spróbuj ponownie.");
    } finally {
      setIsSending(false);
    }
  }

  async function handleDownload(messageId: string, records: CsvPlayerRecord[]) {
    setIsDownloading(messageId);
    setErrorMessage(null);
    try {
      const result = await downloadAssistantCsvAction(records);
      if (!result.success || !result.csv) {
        setErrorMessage(result.error || "Nie udało się przygotować CSV.");
        return;
      }
      const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `forma_zawodnicy_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch {
      setErrorMessage("Nie udało się przygotować pliku CSV. Spróbuj ponownie.");
    } finally {
      setIsDownloading(null);
    }
  }

  async function handleConfirm(message: ChatMessage) {
    if (!message.proposal || isConfirming) return;
    setIsConfirming(message.id);
    setErrorMessage(null);
    try {
      const result = await confirmAssistantAction(message.proposal);
      const savedResult = updateAssistantState((current) => ({
        ...current,
        messages: current.messages.map((item) =>
        item.id === message.id
          ? {
              ...item,
              content: `${item.content}\n\n${result.message}`,
              proposal: undefined,
            }
          : item
        ),
      }));
      if (!savedResult) {
        setErrorMessage("Operacja została obsłużona, ale nie udało się zachować jej wyniku w rozmowie.");
      }
      if (!result.success) setErrorMessage(result.message);
    } catch {
      setErrorMessage("Nie udało się zapisać danych. Sprawdź połączenie i spróbuj ponownie.");
    } finally {
      setIsConfirming(null);
    }
  }

  function handleCancel(messageId: string) {
    const saved = updateAssistantState((current) => ({
      ...current,
      messages: current.messages.map((message) =>
        message.id === messageId
          ? { ...message, content: `${message.content}\n\nOperacja została anulowana.`, proposal: undefined }
          : message
      ),
    }));
    if (!saved) setErrorMessage("Nie udało się zachować anulowania w rozmowie.");
  }

  return (
    <>
      {isOpen && (
        <section
          aria-label="Asystent AI"
          className="fixed inset-x-3 bottom-20 z-[60] flex h-[min(680px,calc(100dvh-7rem))] flex-col overflow-hidden rounded-2xl border-2 border-foreground bg-background shadow-[5px_5px_0_0_var(--foreground)] sm:inset-x-auto sm:right-6 sm:w-[min(440px,calc(100vw-3rem))]"
        >
          <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-primary/10 p-2 text-primary"><Bot className="size-5" /></span>
              <div>
                <h2 className="font-heading text-lg uppercase">Asystent FORMA</h2>
                <p className="text-[11px] text-muted-foreground">Szukaj treningów i konkretnych zawodników</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!updateAssistantState((current) => ({ ...current, isOpen: false }))) {
                  setErrorMessage("Nie udało się zachować stanu asystenta.");
                }
              }}
              aria-label="Zamknij asystenta"
              className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronDown className="size-5" />
            </button>
          </header>

          <div className="border-b border-border bg-muted/30 px-4 py-2 text-[11px] leading-relaxed text-muted-foreground">
            Polecenia i historia rozmowy trafiają do Google Gemini. W bezpłatnym planie treści mogą być używane do ulepszania usług. Zapis danych wymaga potwierdzenia.
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="rounded-xl border border-dashed border-border p-4 text-sm">
                <p className="mb-2 flex items-center gap-2 font-bold"><Sparkles className="size-4 text-primary" />Przykładowe polecenia</p>
                <ul className="space-y-1.5 text-muted-foreground">
                  <li>„Co było na treningu regeneracyjnym z 1 listopada?”</li>
                  <li>„Pokaż treningi na boisku głównym 1 listopada”</li>
                  <li>„Pokaż zawodnika Jan Kowalski”</li>
                  <li>„Przygotuj CSV dla zawodników: …”</li>
                  <li>„Dodaj do U15 zawodników: …” lub „Zaplanuj trening U15 …”</li>
                </ul>
              </div>
            )}

            {messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-[94%] rounded-xl px-3 py-2 text-sm ${
                  message.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "mr-auto border border-border bg-card"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>

                {message.trainings && message.trainings.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.trainings.map((training) => (
                      <div key={training.id} className="rounded-lg border border-border bg-background p-2 text-foreground">
                        <p className="font-bold">{training.date} · {formatTime(training.startTime)}–{formatTime(training.endTime)}</p>
                        <p>{training.teamName}{training.field ? ` · ${training.field}` : ""}</p>
                        {training.topic && <p className="text-muted-foreground">{training.topic}</p>}
                        {training.trainingType && (
                          <p className="mt-1 text-muted-foreground">Rodzaj: {training.trainingType}</p>
                        )}
                        {training.mainGoal && (
                          <p className="mt-1">Cel: {training.mainGoal}</p>
                        )}
                        {training.organizationalNote && (
                          <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                            Notatka: {training.organizationalNote}
                          </p>
                        )}
                        {training.href && (
                          <a href={training.href} className="mt-1 inline-block font-semibold text-primary underline">
                            Otwórz trening
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {message.players && message.players.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.players.map((player) => (
                      <div key={player.id} className="rounded-lg border border-border bg-background p-2 text-foreground">
                        <p className="font-bold">
                          {player.firstName} {player.lastName}
                          {player.jerseyNumber != null ? ` · #${player.jerseyNumber}` : ""}
                        </p>
                        <p className="text-muted-foreground">
                          {player.teamName}{player.birthYear ? ` · rocznik ${player.birthYear}` : ""}
                        </p>
                        <a href={player.href || "#"} className="mt-1 inline-block font-semibold text-primary underline">
                          Otwórz kartę zawodnika
                        </a>
                      </div>
                    ))}
                  </div>
                )}

                {message.csvRecords && (
                  <div className="mt-3 rounded-lg border border-border bg-background p-2 text-foreground">
                    <p className="font-bold">Podgląd: {message.csvRecords.length} wierszy CSV</p>
                    <div className="mt-2 max-h-28 overflow-auto text-xs">
                      {message.csvRecords.map((player, index) => (
                        <p key={`${player.firstName}-${player.lastName}-${index}`} className="border-t border-border py-1">
                          {player.firstName} {player.lastName} · {player.birthYear}
                        </p>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleDownload(message.id, message.csvRecords || [])}
                      disabled={isDownloading === message.id}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-foreground bg-primary px-3 py-2 text-xs font-bold text-primary-foreground disabled:opacity-60"
                    >
                      {isDownloading === message.id
                        ? <LoaderCircle className="size-3.5 animate-spin" />
                        : <Download className="size-3.5" />}
                      Pobierz CSV
                    </button>
                  </div>
                )}

                {message.proposal && (
                  <ProposalPreview
                    proposal={message.proposal}
                    isConfirming={isConfirming === message.id}
                    onConfirm={() => void handleConfirm(message)}
                    onCancel={() => handleCancel(message.id)}
                  />
                )}
              </article>
            ))}

            {isSending && (
              <div className="mr-auto flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm text-muted-foreground">
                <LoaderCircle className="size-4 animate-spin" /> Analizuję polecenie…
              </div>
            )}
          </div>

          {errorMessage && (
            <p role="alert" className="border-t border-destructive/20 bg-destructive/5 px-4 py-2 text-xs text-destructive">
              {errorMessage}
            </p>
          )}

          <div className="border-t border-border bg-card px-3 pt-3">
            <label className="flex cursor-pointer items-start gap-2 text-[11px] leading-relaxed text-muted-foreground">
              <input
                type="checkbox"
                checked={privacyAccepted}
                onChange={(event) => {
                  if (!updateAssistantState((current) => ({
                    ...current,
                    privacyAccepted: event.target.checked,
                  }))) {
                    setErrorMessage("Nie udało się zapisać ustawienia zgody.");
                  }
                }}
                className="mt-0.5 accent-primary"
              />
              <span>
                Potwierdzam, że mogę przekazać treść rozmowy Google Gemini, w tym ewentualne dane zawodników i opiekunów. Nie wysyłam haseł ani informacji, których klub nie może udostępnić dostawcy.
              </span>
            </label>
          </div>
          <form onSubmit={handleSubmit} className="flex items-end gap-2 bg-card p-3 pt-2">
            <label className="sr-only" htmlFor="forma-assistant-prompt">Polecenie dla asystenta</label>
            <textarea
              id="forma-assistant-prompt"
              value={input}
              onChange={(event) => {
                if (!updateAssistantState((current) => ({
                  ...current,
                  input: event.target.value,
                }))) {
                  setErrorMessage("Nie udało się zachować wpisywanego polecenia.");
                }
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
              maxLength={3000}
              rows={2}
              placeholder="Napisz, czego potrzebujesz…"
              className="max-h-28 min-h-11 flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
            <button
              type="submit"
              aria-label="Wyślij polecenie"
              disabled={!input.trim() || isSending || !privacyAccepted}
              className="grid size-11 shrink-0 place-items-center rounded-xl border border-foreground bg-primary text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSending ? <LoaderCircle className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => {
          if (!updateAssistantState((current) => ({ ...current, isOpen: !current.isOpen }))) {
            setErrorMessage("Nie udało się zachować stanu asystenta.");
          }
        }}
        aria-label={isOpen ? "Zamknij asystenta AI" : "Otwórz asystenta AI"}
        className="fixed bottom-4 right-4 z-[60] inline-flex items-center gap-2 rounded-full border-2 border-foreground bg-primary px-4 py-3 font-bold text-primary-foreground shadow-[3px_3px_0_0_var(--foreground)] transition hover:-translate-y-0.5 sm:bottom-6 sm:right-6"
      >
        {isOpen ? <X className="size-5" /> : <MessageCircle className="size-5" />}
        <span className="text-sm">Asystent AI</span>
      </button>
    </>
  );
}
