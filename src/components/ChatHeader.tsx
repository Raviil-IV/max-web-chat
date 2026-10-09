import type { Chat } from "../store/types";
import styles from "./ChatHeader.module.css";

export function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <header className={styles.header}>
      <span className={styles.avatar}>{chat.name.replace(/\D/g, "").slice(-2) || "?"}</span>
      <div>
        <div className={styles.name}>{chat.name}</div>
        <div className={styles.subtitle}>MAX</div>
      </div>
    </header>
  );
}
