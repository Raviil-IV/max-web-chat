import { useEffect, useRef } from "react";
import type { Message } from "../store/types";
import { MessageBubble } from "./MessageBubble";
import styles from "./MessageList.module.css";

export function MessageList({
  messages,
  onRetry,
}: {
  messages: Message[];
  onRetry?: (message: Message) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className={styles.list}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onRetry={onRetry} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
