import { ChatList } from "./ChatList";
import { ConnectionStatus } from "./ConnectionStatus";
import { NewChatForm } from "./NewChatForm";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <ConnectionStatus />
      <NewChatForm />
      <ChatList />
    </aside>
  );
}
