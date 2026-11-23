"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { CsvPlayerRecord } from "@/app/actions/admin";
import type {
  AssistantHistoryMessage,
  AssistantPendingAction,
  AssistantPlayerResult,
  AssistantReply,
  AssistantTeamResult,
  AssistantTrainingResult,
} from "@/app/actions/assistant";

export interface ChatMessage extends AssistantHistoryMessage {
  id: string;
  trainings?: AssistantReply["trainings"];
  players?: AssistantReply["players"];
  teams?: AssistantTeamResult[];
  csvRecords?: CsvPlayerRecord[];
  proposal?: AssistantPendingAction;
}

export interface PersistedAssistantState {
  messages: ChatMessage[];
  isOpen: boolean;
  input: string;
  privacyAccepted: boolean;
}

const ASSISTANT_STORAGE_VERSION = 1;
const MAX_PERSISTED_MESSAGES = 40;

export const DEFAULT_ASSISTANT_STATE: PersistedAssistantState = {
  messages: [],
  isOpen: false,
  input: "",
  privacyAccepted: false,
};

export const DEFAULT_ASSISTANT_SNAPSHOT = JSON.stringify(DEFAULT_ASSISTANT_STATE);

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

function isAssistantTeamResult(value: unknown): value is AssistantTeamResult {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    (value.ageGroup === null || typeof value.ageGroup === "string") &&
    typeof value.playerCount === "number" &&
    Array.isArray(value.players) &&
    value.players.every(isAssistantPlayerResult) &&
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
      if (Array.isArray(item.trainings) && item.trainings.every(isAssistantTrainingResult)) message.trainings = item.trainings;
      if (Array.isArray(item.players) && item.players.every(isAssistantPlayerResult)) message.players = item.players;
      if (Array.isArray(item.teams) && item.teams.every(isAssistantTeamResult)) message.teams = item.teams;
      if (Array.isArray(item.csvRecords) && item.csvRecords.every(isCsvPlayerRecord)) message.csvRecords = item.csvRecords;
      if (isPendingAction(item.proposal)) message.proposal = item.proposal;
      return message;
    });
}

function getAssistantStorageKey(userId: string) {
  return `forma-assistant:v${ASSISTANT_STORAGE_VERSION}:${userId}`;
}

export function getAssistantSnapshot(userId: string) {
  try {
    return sessionStorage.getItem(getAssistantStorageKey(userId)) || DEFAULT_ASSISTANT_SNAPSHOT;
  } catch {
    return DEFAULT_ASSISTANT_SNAPSHOT;
  }
}

export function parseAssistantSnapshot(snapshot: string): PersistedAssistantState {
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

export function usePersistentAssistantState(userId: string) {
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
        JSON.stringify({ ...next, messages: next.messages.slice(-MAX_PERSISTED_MESSAGES) })
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
