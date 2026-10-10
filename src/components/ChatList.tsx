import { formatListTime } from "../lib/time";
import { useChat } from "../store/ChatContext";
import { Avatar } from "./Avatar";
import styles from "./ChatList.module.css";

const PREVIEW_MAX = 60;

function previewFor(text: string, direction: "in" | "out"): string {
  const flattened = text.replace(/\s+/g, " ").trim();
  if (!flattened) return "";
  const full = direction === "out" ? `Вы: ${flattened}` : flattened;
  return full.length > PREVIEW_MAX
    ? `${full.slice(0, PREVIEW_MAX).trimEnd()}…`
    : full;
}

export function ChatList({ query = "" }: { query?: string }) {
  const { state, selectChat } = useChat();
  const needle = query.trim().toLowerCase();

  const chats = needle
    ? state.chats.filter(
        (chat) =>
          chat.name.toLowerCase().includes(needle) ||
          chat.phone.toLowerCase().includes(needle),
      )
    : state.chats;

  return (
    <ul className={styles.list}>
      {chats.map((chat) => {
        const unread = state.unread?.[chat.id] ?? 0;
        const active = chat.id === state.activeChatId;
        const messages = state.messagesByChat?.[chat.id];
        const last = messages?.[messages.length - 1];
        const preview = last ? previewFor(last.text, last.direction) : "";

        return (
          <li key={chat.id}>
            <button
              type="button"
              className={`${styles.item} ${active ? styles.active : ""}`}
              onClick={() => selectChat(chat.id)}
            >
              <Avatar name={chat.name} size={54} />
              <span className={styles.body}>
                <span className={styles.top}>
                  <span className={styles.name}>{chat.name}</span>
                  <span className={styles.time}>
                    {formatListTime(chat.lastActivity)}
                  </span>
                </span>
                <span className={styles.bottom}>
                  {preview && <span className={styles.preview}>{preview}</span>}
                  {unread > 0 && <span className={styles.badge}>{unread}</span>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
      {chats.length === 0 && (
        <li className={styles.empty}>
          {state.chats.length === 0
            ? "Создайте первый чат, чтобы начать переписку"
            : "Ничего не найдено"}
        </li>
      )}
    </ul>
  );
}
