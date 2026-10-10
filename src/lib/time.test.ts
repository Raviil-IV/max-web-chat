import { describe, expect, it, vi } from "vitest";
import {
  formatDateLabel,
  formatListTime,
  formatTime,
  isSameDay,
} from "./time";

// Время создаётся через new Date(y, m, d, ...), чтобы компоненты даты задавались
// в локальном времени машины и тесты не зависели от часового пояса.
const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m, d, h, min).getTime();

// Фиксированное «сейчас»: 10 октября 2026, 14:30 (локально).
const NOW = local(2026, 9, 10, 14, 30);

describe("formatTime", () => {
  it("форматирует локальное время как HH:MM", () => {
    expect(formatTime(local(2026, 9, 10, 14, 5))).toBe("14:05");
  });

  it("дополняет нулями однозначные час и минуты", () => {
    expect(formatTime(local(2026, 9, 10, 9, 5))).toBe("09:05");
    expect(formatTime(local(2026, 9, 10, 0, 0))).toBe("00:00");
  });
});

describe("isSameDay", () => {
  it("считает две отметки одного календарного дня одинаковыми", () => {
    expect(isSameDay(local(2026, 9, 10, 0, 0), local(2026, 9, 10, 23, 59))).toBe(
      true,
    );
  });

  it("различает соседние дни", () => {
    expect(
      isSameDay(local(2026, 9, 10, 23, 59), local(2026, 9, 11, 0, 0)),
    ).toBe(false);
  });

  it("различает границы месяца и года", () => {
    expect(
      isSameDay(local(2026, 9, 31, 23, 59), local(2026, 10, 1, 0, 0)),
    ).toBe(false);
    expect(
      isSameDay(local(2025, 11, 31, 23, 59), local(2026, 0, 1, 0, 0)),
    ).toBe(false);
  });
});

describe("formatDateLabel", () => {
  it("возвращает «Сегодня» для текущего дня", () => {
    expect(formatDateLabel(local(2026, 9, 10, 23, 59), NOW)).toBe("Сегодня");
  });

  it("возвращает «Вчера» для предыдущего дня", () => {
    expect(formatDateLabel(local(2026, 9, 9, 23, 59), NOW)).toBe("Вчера");
  });

  it("возвращает «Вчера» на границе полуночи между годами", () => {
    const midnight = local(2026, 0, 1, 0, 1);
    expect(formatDateLabel(local(2025, 11, 31, 23, 59), midnight)).toBe("Вчера");
  });

  it("возвращает d MMMM для более старой даты в том же году", () => {
    expect(formatDateLabel(local(2026, 9, 5, 12, 0), NOW)).toBe("5 октября");
  });

  it("добавляет год, если он отличается", () => {
    expect(formatDateLabel(local(2025, 11, 31, 12, 0), NOW)).toBe(
      "31 декабря 2025 г.",
    );
  });

  it("использует Date.now() по умолчанию", () => {
    const spy = vi.spyOn(Date, "now").mockReturnValue(NOW);
    try {
      expect(formatDateLabel(local(2026, 9, 10, 8, 0))).toBe("Сегодня");
    } finally {
      spy.mockRestore();
    }
  });
});

describe("formatListTime", () => {
  it("возвращает время для сегодняшнего сообщения", () => {
    expect(formatListTime(local(2026, 9, 10, 14, 5), NOW)).toBe("14:05");
  });

  it("возвращает дату для вчерашнего сообщения", () => {
    expect(formatListTime(local(2026, 9, 9, 14, 5), NOW)).toBe("Вчера");
  });

  it("возвращает дату для более старого сообщения", () => {
    expect(formatListTime(local(2026, 9, 5, 14, 5), NOW)).toBe("5 октября");
  });
});
