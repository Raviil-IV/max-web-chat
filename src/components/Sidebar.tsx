import { useState } from "react";
import { useChat } from "../store/ChatContext";
import { ChatList } from "./ChatList";
import { ConnectionStatus } from "./ConnectionStatus";
import { NewChatForm } from "./NewChatForm";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  const { logout } = useChat();
  const [query, setQuery] = useState("");

  return (
    <aside className={styles.sidebar}>
      <header className={styles.header}>
        <input
          className={styles.search}
          type="search"
          aria-label="Поиск"
          placeholder="Поиск"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className={styles.meta}>
          <ConnectionStatus />
          <button type="button" className={styles.logout} onClick={() => logout?.()}>
            Выйти
          </button>
        </div>
      </header>
      <NewChatForm />
      <ChatList query={query} />
    </aside>
  );
}
