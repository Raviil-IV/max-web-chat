import { useEffect, useRef } from "react";
import { EMOJI_GROUPS } from "../lib/emojis";
import styles from "./EmojiPicker.module.css";

export function EmojiPicker({
  onPick,
  onClose,
}: {
  onPick: (emoji: string) => void;
  onClose?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose?.();
    }

    function handleMouseDown(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose?.();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [onClose]);

  return (
    <div ref={panelRef} className={styles.panel} role="dialog" aria-label="Палитра эмодзи">
      {EMOJI_GROUPS.map((group) => (
        <div key={group.name} className={styles.group}>
          <div className={styles.groupName}>{group.name}</div>
          <div className={styles.grid}>
            {group.emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={styles.emoji}
                onClick={() => onPick(emoji)}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
