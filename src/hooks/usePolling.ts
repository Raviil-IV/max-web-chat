import { useEffect } from "react";
import { useChat } from "../store/ChatContext";

const DEFAULT_INTERVAL = 3000;
const MAX_BACKOFF = 30000;

export function usePolling(options?: { intervalMs?: number }): void {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL;
  const { state, receive } = useChat();
  const online = state.connection === "online";

  useEffect(() => {
    if (!online) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoff = intervalMs;

    const loop = async () => {
      if (stopped) return;
      try {
        const hadMore = await receive();
        backoff = intervalMs;
        // Если в очереди было уведомление — сразу продолжаем, иначе ждём интервал.
        timer = setTimeout(loop, hadMore ? 0 : intervalMs);
      } catch {
        backoff = Math.min(backoff * 2, MAX_BACKOFF);
        timer = setTimeout(loop, backoff);
      }
    };

    void loop();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [online, intervalMs, receive]);
}
