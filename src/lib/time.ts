// Утилиты форматирования времени и дат в локальном времени, в стиле мессенджера.

const timeFormatter = new Intl.DateTimeFormat("ru-RU", {
  hour: "2-digit",
  minute: "2-digit",
});

const dateFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

const dateYearFormatter = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Локальное время в формате HH:MM. */
export function formatTime(timestamp: number): string {
  return timeFormatter.format(new Date(timestamp));
}

/** Совпадают ли календарные даты (локально). */
export function isSameDay(a: number, b: number): boolean {
  const left = new Date(a);
  const right = new Date(b);
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

/**
 * Подпись даты: «Сегодня», «Вчера», либо d MMMM (с годом, если он отличается).
 * `now` по умолчанию — текущее время; в тестах передаётся явно.
 */
export function formatDateLabel(timestamp: number, now: number = Date.now()): string {
  if (isSameDay(timestamp, now)) {
    return "Сегодня";
  }

  const date = new Date(timestamp);
  const nowDate = new Date(now);
  const yesterday = new Date(
    nowDate.getFullYear(),
    nowDate.getMonth(),
    nowDate.getDate() - 1,
  );

  if (isSameDay(timestamp, yesterday.getTime())) {
    return "Вчера";
  }

  if (date.getFullYear() === nowDate.getFullYear()) {
    return dateFormatter.format(date);
  }

  // Intl ru-RU добавляет суффикс « г.» к полной дате; бриф требует d MMMM yyyy.
  return dateYearFormatter.format(date).replace(/\s*г\.?$/, "");
}

/** Время для списка чатов: HH:MM сегодня, иначе подпись даты. */
export function formatListTime(timestamp: number, now: number = Date.now()): string {
  return isSameDay(timestamp, now)
    ? formatTime(timestamp)
    : formatDateLabel(timestamp, now);
}
