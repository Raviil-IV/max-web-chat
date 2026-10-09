import type { Credentials } from "../api/types";

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

export type ConnectionStatus = "idle" | "connecting" | "online" | "error";

export interface AppState {
  credentials: Credentials | null;
  connection: ConnectionStatus;
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  activeChatId: string | null;
  unread: Record<string, number>;
}
