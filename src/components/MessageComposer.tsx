import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { EmojiPicker } from "./EmojiPicker";
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
  const [emojiOpen, setEmojiOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const pendingCaretRef = useRef<number | null>(null);

  const trimmed = text.trim();
  const tooLong = text.length > MAX_LENGTH;

  // После вставки эмодзи возвращаем фокус в поле и каретку на место.
  useEffect(() => {
    const el = textareaRef.current;
    if (el && pendingCaretRef.current !== null) {
      el.focus();
      el.setSelectionRange(pendingCaretRef.current, pendingCaretRef.current);
      pendingCaretRef.current = null;
    }
  }, [text]);

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

  function handleEmojiPick(emoji: string) {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = text.slice(0, start) + emoji + text.slice(end);
    const caret = start + emoji.length;
    setText(next);
    pendingCaretRef.current = caret;
    setEmojiOpen(false);
  }

  const handleEmojiClose = useCallback((reason: "escape" | "outside") => {
    setEmojiOpen(false);
    if (reason === "escape") emojiButtonRef.current?.focus();
  }, []);

  return (
    <div className={styles.composer}>
      <button
        ref={emojiButtonRef}
        className={styles.emojiButton}
        type="button"
        aria-label="Эмодзи"
        aria-expanded={emojiOpen}
        disabled={disabled}
        onClick={() => setEmojiOpen((open) => !open)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        😊
      </button>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        placeholder="Введите сообщение"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
      />
      <span className={`${styles.counter} ${tooLong ? styles.over : ""}`}>
        {text.length}/{MAX_LENGTH}
      </span>
      <button
        className={styles.send}
        type="button"
        onClick={submit}
        disabled={disabled || !trimmed || tooLong}
      >
        Отправить
      </button>
      {emojiOpen && (
        <EmojiPicker onPick={handleEmojiPick} onClose={handleEmojiClose} />
      )}
    </div>
  );
}
