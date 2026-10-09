import { usePolling } from "../hooks/usePolling";
import { ChatProvider, useChat } from "../store/ChatContext";
import { ChatWindow } from "./ChatWindow";
import { LoginScreen } from "./LoginScreen";
import { Sidebar } from "./Sidebar";
import styles from "./App.module.css";

function Workspace() {
  const { state, logout } = useChat();
  usePolling();

  if (!state.credentials) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.app}>
      <Sidebar />
      <ChatWindow />
      <button className={styles.logout} type="button" onClick={logout}>
        Выйти
      </button>
    </div>
  );
}

export function App() {
  return (
    <ChatProvider>
      <Workspace />
    </ChatProvider>
  );
}
