import type { Message } from "../store/types";
import { formatTime } from "../lib/time";
import styles from "./MessageBubble.module.css";

const STATUS_LABEL: Record<string, string> = {
  sending: "⏳",
  sent: "✓",
  failed: "⚠",
};

export function MessageBubble({
  message,
  onRetry,
}: {
  message: Message;
  onRetry?: (message: Message) => void;
}) {
  const out = message.direction === "out";
  return (
    <div className={`${styles.row} ${out ? styles.out : styles.in}`}>
      <div className={styles.bubble}>
        <span className={styles.text}>{message.text}</span>
        <span className={styles.meta}>
          {formatTime(message.timestamp)}
          {out && message.status && <span className={styles.status}>{STATUS_LABEL[message.status]}</span>}
        </span>
        {out && message.status === "failed" && onRetry && (
          <button className={styles.retry} type="button" onClick={() => onRetry(message)}>
            Повторить
          </button>
        )}
      </div>
    </div>
  );
}
