import { useChat } from "../store/ChatContext";
import styles from "./ChatList.module.css";

export function ChatList() {
  const { state, selectChat } = useChat();
  return (
    <ul className={styles.list}>
      {state.chats.map((chat) => {
        const unread = state.unread[chat.id] ?? 0;
        const active = chat.id === state.activeChatId;
        return (
          <li key={chat.id}>
            <button
              type="button"
              className={`${styles.item} ${active ? styles.active : ""}`}
              onClick={() => selectChat(chat.id)}
            >
              <span className={styles.avatar}>{chat.name.replace(/\D/g, "").slice(-2) || "?"}</span>
              <span className={styles.name}>{chat.name}</span>
              {unread > 0 && <span className={styles.badge}>{unread}</span>}
            </button>
          </li>
        );
      })}
      {state.chats.length === 0 && (
        <li className={styles.empty}>Создайте первый чат, чтобы начать переписку</li>
      )}
    </ul>
  );
}
