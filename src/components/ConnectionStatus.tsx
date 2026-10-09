import { useChat } from "../store/ChatContext";
import styles from "./ConnectionStatus.module.css";

const LABELS: Record<string, string> = {
  idle: "Не подключено",
  connecting: "Подключение…",
  online: "На связи",
  error: "Переподключение…",
};

export function ConnectionStatus() {
  const { state } = useChat();
  return (
    <div className={styles.status} data-status={state.connection}>
      <span className={styles.dot} />
      {LABELS[state.connection]}
    </div>
  );
}
