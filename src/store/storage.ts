import { initialState } from "./reducer";
import type { AppState, Message } from "./types";

const STORAGE_KEY = "max-web-chat:state";

export function saveState(state: AppState): void {
  try {
    const persisted: AppState = { ...state, connection: "idle" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* приватный режим / переполнение — игнорируем */
  }
}

function downgradeSending(
  messagesByChat: Record<string, Message[]>
): Record<string, Message[]> {
  const result: Record<string, Message[]> = {};
  for (const [chatId, messages] of Object.entries(messagesByChat)) {
    if (!Array.isArray(messages)) continue;
    result[chatId] = messages.map((message) =>
      message &&
      typeof message === "object" &&
      "status" in message &&
      message.status === "sending"
        ? { ...message, status: "failed" as const }
        : message
    );
  }
  return result;
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      return null;
    }
    const state = parsed as Partial<AppState>;
    if (
      !Array.isArray(state.chats) ||
      typeof state.messagesByChat !== "object" ||
      state.messagesByChat === null ||
      Array.isArray(state.messagesByChat) ||
      typeof state.unread !== "object" ||
      state.unread === null ||
      Array.isArray(state.unread)
    ) {
      return null;
    }
    return {
      ...initialState,
      ...state,
      messagesByChat: downgradeSending(state.messagesByChat ?? {}),
      connection: "idle",
    };
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* игнорируем */
  }
}
