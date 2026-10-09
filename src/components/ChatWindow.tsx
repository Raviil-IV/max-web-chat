import { useChat } from "../store/ChatContext";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

export function ChatWindow() {
  const { state, send, retry } = useChat();
  const chat = state.chats.find((c) => c.id === state.activeChatId);

  if (!chat) {
    return <div className={styles.placeholder}>Выберите чат или создайте новый</div>;
  }

  const messages = state.messagesByChat[chat.id] ?? [];

  return (
    <section className={styles.window}>
      <ChatHeader chat={chat} />
      <MessageList messages={messages} onRetry={(m) => void retry(m)} />
      <MessageComposer onSend={(text) => void send(chat.id, text)} />
    </section>
  );
}
