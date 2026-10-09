import { initialState } from "./reducer";
import type { AppState } from "./types";

const STORAGE_KEY = "max-web-chat:state";

export function saveState(state: AppState): void {
  try {
    const persisted: AppState = { ...state, connection: "idle" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* приватный режим / переполнение — игнорируем */
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...initialState,
      ...parsed,
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
