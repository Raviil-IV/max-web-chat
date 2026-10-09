export type MessageDirection = "in" | "out";
export type MessageStatus = "sending" | "sent" | "failed";

export interface Message {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: MessageDirection;
  status?: MessageStatus;
}

export interface Chat {
  id: string;
  name: string;
  phone: string;
  lastActivity: number;
}
