import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./App";

let credentials: unknown = null;

vi.mock("../store/ChatContext", () => ({
  ChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useChat: () => ({
    state: {
      credentials,
      connection: credentials ? "online" : "idle",
      chats: [],
      messagesByChat: {},
      activeChatId: null,
      unread: {},
    },
    login: vi.fn(),
    logout: vi.fn(),
    addChat: vi.fn(),
    selectChat: vi.fn(),
    send: vi.fn(),
    retry: vi.fn(),
    receive: vi.fn().mockResolvedValue(false),
  }),
}));

describe("App", () => {
  beforeEach(() => {
    credentials = null;
  });

  it("shows the login screen when not authenticated", () => {
    render(<App />);
    expect(screen.getByText("Введите данные инстанса GREEN-API")).toBeInTheDocument();
  });

  it("shows the chat layout when authenticated", () => {
    credentials = { idInstance: "1", apiTokenInstance: "t" };
    render(<App />);
    expect(screen.getByText("Выберите чат или создайте новый")).toBeInTheDocument();
  });
});
