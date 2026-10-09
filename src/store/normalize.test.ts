import { describe, expect, it } from "vitest";
import type { NotificationBody } from "../api/types";
import { notificationToMessage } from "./normalize";

function body(overrides: Partial<NotificationBody>): NotificationBody {
  return {
    typeWebhook: "incomingMessageReceived",
    timestamp: 1000,
    idMessage: "m1",
    senderData: { chatId: "70000000000" },
    messageData: { typeMessage: "textMessage", textMessageData: { textMessage: "hi" } },
    ...overrides,
  };
}

describe("notificationToMessage", () => {
  it("maps an incoming text message", () => {
    const msg = notificationToMessage(body({}));
    expect(msg).toMatchObject({
      id: "m1",
      chatId: "70000000000",
      text: "hi",
      timestamp: 1000,
      direction: "in",
    });
  });

  it("maps an outgoing message sent from the phone as in the out direction", () => {
    const msg = notificationToMessage(body({ typeWebhook: "outgoingMessageReceived" }));
    expect(msg?.direction).toBe("out");
    expect(msg?.status).toBe("sent");
  });

  it("ignores non-text messages", () => {
    const msg = notificationToMessage(
      body({ messageData: { typeMessage: "imageMessage" } })
    );
    expect(msg).toBeNull();
  });

  it("ignores non-message webhooks", () => {
    expect(notificationToMessage(body({ typeWebhook: "stateInstanceChanged" }))).toBeNull();
  });

  it("ignores messages without chatId", () => {
    expect(notificationToMessage(body({ senderData: undefined }))).toBeNull();
  });
});
