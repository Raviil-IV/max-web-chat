import type { Chat } from "../store/types";
import { Avatar } from "./Avatar";
import styles from "./ChatHeader.module.css";

export function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <header className={styles.header}>
      <Avatar name={chat.name} size={42} />
      <div>
        <div className={styles.name}>{chat.name}</div>
        <div className={styles.subtitle}>MAX</div>
      </div>
    </header>
  );
}
