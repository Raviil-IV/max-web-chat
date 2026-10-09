import type { NotificationBody } from "../api/types";
import type { Message } from "./types";

const TEXT_WEBHOOKS = new Set([
  "incomingMessageReceived",
  "outgoingMessageReceived",
  "outgoingAPIMessageReceived",
]);

export function notificationToMessage(body: NotificationBody): Message | null {
  if (!TEXT_WEBHOOKS.has(body.typeWebhook)) return null;
  if (body.messageData?.typeMessage !== "textMessage") return null;

  const chatId = body.senderData?.chatId;
  if (!chatId) return null;

  const direction = body.typeWebhook === "incomingMessageReceived" ? "in" : "out";

  return {
    id: body.idMessage,
    chatId,
    text: body.messageData.textMessageData?.textMessage ?? "",
    timestamp: body.timestamp,
    direction,
    status: direction === "out" ? "sent" : undefined,
  };
}
