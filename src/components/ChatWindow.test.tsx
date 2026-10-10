import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { formatDateLabel } from "../lib/time";
import { ChatWindow } from "./ChatWindow";

const send = vi.fn();
const retry = vi.fn();

const baseMessages = [
  { id: "m1", chatId: "c1", text: "Привет", timestamp: 1, direction: "in" },
  { id: "m2", chatId: "c1", text: "Здравствуйте", timestamp: 2, direction: "out", status: "sent" },
];

const mockState: {
  activeChatId: string;
  chats: { id: string; name: string; phone: string; lastActivity: number }[];
  messagesByChat: Record<string, typeof baseMessages>;
} = {
  activeChatId: "c1",
  chats: [{ id: "c1", name: "+7 999 111-22-33", phone: "79991112233", lastActivity: 2 }],
  messagesByChat: { c1: baseMessages },
};

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    send,
    retry,
    state: mockState,
  }),
}));

describe("ChatWindow", () => {
  beforeEach(() => {
    send.mockReset().mockResolvedValue(undefined);
    retry.mockReset().mockResolvedValue(undefined);
    mockState.messagesByChat = { c1: baseMessages };
  });

  it("renders messages of the active chat", () => {
    render(<ChatWindow />);
    expect(screen.getByText("Привет")).toBeInTheDocument();
    expect(screen.getByText("Здравствуйте")).toBeInTheDocument();
  });

  it("sends on Enter and clears the input", async () => {
    render(<ChatWindow />);
    const box = screen.getByPlaceholderText(/сообщение/i);
    await userEvent.type(box, "новое{Enter}");
    expect(send).toHaveBeenCalledWith("c1", "новое");
    expect((box as HTMLTextAreaElement).value).toBe("");
  });

  it("does not send empty text", async () => {
    render(<ChatWindow />);
    await userEvent.type(screen.getByPlaceholderText(/сообщение/i), "{Enter}");
    expect(send).not.toHaveBeenCalled();
  });

  it("disables the composer while a message is sending", () => {
    mockState.messagesByChat = {
      c1: [
        ...baseMessages,
        { id: "m3", chatId: "c1", text: "В процессе", timestamp: 3, direction: "out", status: "sending" },
      ],
    };
    render(<ChatWindow />);
    expect(screen.getByRole("button", { name: "Отправить" })).toBeDisabled();
    expect(screen.getByPlaceholderText(/сообщение/i)).toBeDisabled();
  });

  it("renders a date separator before the first message and on day change", () => {
    const NOW = new Date(2026, 9, 10, 14, 30).getTime();
    const day1 = new Date(2026, 9, 8, 10, 0).getTime();
    const day2 = new Date(2026, 9, 9, 10, 0).getTime();
    const spy = vi.spyOn(Date, "now").mockReturnValue(NOW);
    try {
      mockState.messagesByChat = {
        c1: [
          { id: "m1", chatId: "c1", text: "Первый", timestamp: day1, direction: "in" },
          { id: "m2", chatId: "c1", text: "Второй", timestamp: day1 + 60_000, direction: "out", status: "sent" },
          { id: "m3", chatId: "c1", text: "Третий", timestamp: day2, direction: "in" },
        ],
      };
      render(<ChatWindow />);
      expect(screen.getByText(formatDateLabel(day1, NOW))).toBeInTheDocument();
      expect(screen.getByText(formatDateLabel(day2, NOW))).toBeInTheDocument();
    } finally {
      spy.mockRestore();
    }
  });

  it("inserts a picked emoji into the input", async () => {
    render(<ChatWindow />);
    const box = screen.getByPlaceholderText(/сообщение/i) as HTMLTextAreaElement;

    await userEvent.type(box, "привет");
    box.setSelectionRange(3, 3);

    await userEvent.click(screen.getByRole("button", { name: "Эмодзи" }));
    await userEvent.click(screen.getByRole("button", { name: "😊" }));

    expect(box.value).toBe("при😊вет");
  });
});
