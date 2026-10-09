import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as api from "../api/greenApi";
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

const CREDS = { idInstance: "1", apiTokenInstance: "t" };
const persistedWithCreds = {
  credentials: CREDS,
  connection: "idle",
  chats: [],
  messagesByChat: {},
  activeChatId: null,
  unread: {},
};

describe("ChatContext", () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.clearAllMocks());

  it("optimistically adds an outgoing message as sent", async () => {
    localStorage.setItem("max-web-chat:state", JSON.stringify(persistedWithCreds));
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

  it("reconnects to online when credentials are persisted", async () => {
    localStorage.setItem("max-web-chat:state", JSON.stringify(persistedWithCreds));
    render(
      <ChatProvider>
        <Probe />
      </ChatProvider>
    );
    await act(async () => {});
    expect(screen.getByTestId("conn").textContent).toBe("online");
    expect(api.getSettings).toHaveBeenCalledWith(CREDS);
    expect(api.setSettings).toHaveBeenCalledWith(CREDS, {
      webhookUrl: "",
      incomingWebhook: "yes",
      outgoingWebhook: "yes",
    });
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

  it("receive processes a notification and deletes it", async () => {
    localStorage.setItem("max-web-chat:state", JSON.stringify(persistedWithCreds));
    vi.mocked(api.receiveNotification).mockResolvedValueOnce({
      receiptId: 123,
      body: {
        typeWebhook: "incomingMessageReceived",
        timestamp: 1000,
        idMessage: "m1",
        senderData: { chatId: "c1" },
        messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } },
      },
    });
    function ReceiveProbe() {
      const { state, receive } = useChat();
      return (
        <div>
          <span data-testid="conn">{state.connection}</span>
          <span data-testid="msg">{state.messagesByChat["c1"]?.length ?? 0}</span>
          <button onClick={() => void receive()}>receive</button>
        </div>
      );
    }
    render(
      <ChatProvider>
        <ReceiveProbe />
      </ChatProvider>
    );
    await act(async () => {
      screen.getByText("receive").click();
    });
    expect(screen.getByTestId("msg").textContent).toBe("1");
    expect(api.deleteNotification).toHaveBeenCalledWith(expect.anything(), 123);
    expect(screen.getByTestId("conn").textContent).toBe("online");
  });

  it("receive sets connection to error on failure", async () => {
    localStorage.setItem("max-web-chat:state", JSON.stringify(persistedWithCreds));
    vi.mocked(api.receiveNotification).mockRejectedValueOnce(new Error("network"));
    function ReceiveProbe() {
      const { state, receive } = useChat();
      return (
        <div>
          <span data-testid="conn">{state.connection}</span>
          <button
            onClick={() => {
              receive().catch(() => {});
            }}
          >
            receive
          </button>
        </div>
      );
    }
    render(
      <ChatProvider>
        <ReceiveProbe />
      </ChatProvider>
    );
    await act(async () => {});
    await act(async () => {
      screen.getByText("receive").click();
    });
    expect(screen.getByTestId("conn").textContent).toBe("error");
  });

  it("failed login sets connection to idle and keeps no credentials", async () => {
    vi.mocked(api.getSettings).mockRejectedValueOnce(new Error("bad creds"));
    function LoginProbe() {
      const { state, login } = useChat();
      return (
        <div>
          <span data-testid="conn">{state.connection}</span>
          <span data-testid="creds">{state.credentials ? "yes" : "no"}</span>
          <button
            onClick={() => {
              login({ idInstance: "1", apiTokenInstance: "t" }).catch(() => {});
            }}
          >
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
    expect(screen.getByTestId("conn").textContent).toBe("idle");
    expect(screen.getByTestId("creds").textContent).toBe("no");
  });
});
