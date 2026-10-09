import { useEffect } from "react";
import type { AppState } from "../store/types";
import { saveState } from "../store/storage";

export function usePersistentState(state: AppState): void {
  useEffect(() => {
    saveState(state);
  }, [state]);
}
