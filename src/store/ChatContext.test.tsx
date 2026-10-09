import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChatProvider, useChat } from "./ChatContext";

vi.mock("../api/greenApi", () => ({
  getSettings: vi.fn().mockResolvedValue({}),
  setSettings: vi.fn().mockResolvedValue({ saveSettings: true }),
  sendMessage: vi.fn().mockResolvedValue({ idMessage: "srv-1" }),
  receiveNotification: vi.fn().mockResolvedValue(null),
  deleteNotification: vi.fn().mockResolvedValue({ result: true }),
  resolveChatId: vi.fn().mockResolvedValue("70000000000"),
}));

function Probe() {
  const { state, send } = useChat();
  return (
    <div>
      <span data-testid="conn">{state.connection}</span>
      <span data-testid="count">{state.messagesByChat["c1"]?.length ?? 0}</span>
      <button onClick={() => void send("c1", "hi")}>send</button>
    </div>
  );
}

describe("ChatContext", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.clearAllMocks());

  it("optimistically adds an outgoing message as sent", async () => {
    localStorage.setItem(
      "max-web-chat:state",
      JSON.stringify({ credentials: { idInstance: "1", apiTokenInstance: "t" } })
    );
    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>
    );
    await act(async () => {
      screen.getByText("send").click();
    });
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("logs in and sets connection to online", async () => {
    function LoginProbe() {
      const { state, login } = useChat();
      return (
        <div>
          <span data-testid="conn">{state.connection}</span>
          <button onClick={() => void login({ idInstance: "1", apiTokenInstance: "t" })}>
            login
          </button>
        </div>
      );
    }
    render(
      <ChatProvider>
        <LoginProbe />
      </ChatProvider>
    );
    await act(async () => {
      screen.getByText("login").click();
    });
    expect(screen.getByTestId("conn").textContent).toBe("online");
  });
});
