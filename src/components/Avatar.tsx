import type { CSSProperties } from "react";
import styles from "./Avatar.module.css";

export interface AvatarProps {
  name: string;
  size?: number;
  className?: string;
}

// Детерминированная палитра в духе Telegram Desktop — белый текст читается на
// любом из цветов. Индекс выбирается по хэшу имени, поэтому фон стабилен.
const AVATAR_PALETTE = [
  "#e17076",
  "#f28e6c",
  "#e6a23c",
  "#7bc862",
  "#6ec9cb",
  "#65aadd",
  "#a695e7",
  "#ee7aae",
];

function hashCode(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

export function Avatar({ name, size = 48, className }: AvatarProps) {
  // Для телефонных чатов — последние 2 цифры; для остальных — первые 2 буквы.
  const initials =
    name.replace(/\D/g, "").slice(-2) || name.slice(0, 2).toUpperCase() || "?";

  const background = AVATAR_PALETTE[hashCode(name) % AVATAR_PALETTE.length];

  const classes = className
    ? `${styles.avatar} ${className}`
    : styles.avatar;

  return (
    <span
      className={classes}
      style={
        {
          "--avatar-size": `${size}px`,
          backgroundColor: background,
        } as CSSProperties
      }
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}
