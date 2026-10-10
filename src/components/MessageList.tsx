import { Fragment, useEffect, useRef } from "react";
import type { Message } from "../store/types";
import { formatDateLabel, isSameDay } from "../lib/time";
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
      {messages.map((message, index) => {
        const showDate =
          index === 0 ||
          !isSameDay(message.timestamp, messages[index - 1].timestamp);
        return (
          <Fragment key={message.id}>
            {showDate && (
              <div className={styles.separator}>
                <span className={styles.pill}>{formatDateLabel(message.timestamp)}</span>
              </div>
            )}
            <MessageBubble message={message} onRetry={onRetry} />
          </Fragment>
        );
      })}
      <div ref={endRef} />
    </div>
  );
}
