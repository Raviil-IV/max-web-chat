import { useState, type KeyboardEvent } from "react";
import styles from "./MessageComposer.module.css";

const MAX_LENGTH = 4000;

export function MessageComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const tooLong = text.length > MAX_LENGTH;

  function submit() {
    if (!trimmed || tooLong) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        className={styles.textarea}
        placeholder="Введите сообщение"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
      />
      <button
        className={styles.send}
        type="button"
        onClick={submit}
        disabled={disabled || !trimmed || tooLong}
      >
        Отправить
      </button>
      <span className={`${styles.counter} ${tooLong ? styles.over : ""}`}>
        {text.length}/{MAX_LENGTH}
      </span>
    </div>
  );
}
