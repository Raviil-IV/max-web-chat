import type { Credentials } from "../api/types";
import type { AppState, Chat, ConnectionStatus, Message, MessageStatus } from "./types";

export const initialState: AppState = {
  credentials: null,
  connection: "idle",
  chats: [],
  messagesByChat: {},
  activeChatId: null,
  unread: {},
};

export type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "LOGIN_SUCCESS"; credentials: Credentials }
  | { type: "LOGOUT" }
  | { type: "SET_CONNECTION"; status: ConnectionStatus }
  | { type: "ADD_CHAT"; chat: Chat }
  | { type: "SELECT_CHAT"; chatId: string }
  | { type: "ADD_MESSAGE"; message: Message }
  | { type: "UPDATE_MESSAGE_STATUS"; chatId: string; id: string; status: MessageStatus }
  | { type: "REPLACE_MESSAGE_ID"; chatId: string; tempId: string; serverId: string };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "LOGIN_SUCCESS":
      return { ...state, credentials: action.credentials, connection: "online" };

    case "LOGOUT":
      return initialState;

    case "SET_CONNECTION":
      if (state.connection === action.status) return state;
      return { ...state, connection: action.status };

    case "ADD_CHAT": {
      if (state.chats.some((c) => c.id === action.chat.id)) {
        return { ...state, activeChatId: action.chat.id };
      }
      return {
        ...state,
        chats: [action.chat, ...state.chats],
        activeChatId: action.chat.id,
      };
    }

    case "SELECT_CHAT":
      return {
        ...state,
        activeChatId: action.chatId,
        unread: { ...state.unread, [action.chatId]: 0 },
      };

    case "ADD_MESSAGE": {
      const { message } = action;
      const existing = state.messagesByChat[message.chatId] ?? [];
      const alreadyThere = existing.some((m) => m.id === message.id);
      const messages = alreadyThere
        ? existing.map((m) => (m.id === message.id ? message : m))
        : [...existing, message];

      const isUnread =
        !alreadyThere && message.direction === "in" && message.chatId !== state.activeChatId;
      const unread = isUnread
        ? { ...state.unread, [message.chatId]: (state.unread[message.chatId] ?? 0) + 1 }
        : state.unread;

      let chats = state.chats.map((c) =>
        c.id === message.chatId ? { ...c, lastActivity: message.timestamp } : c
      );

      if (
        message.direction === "in" &&
        !chats.some((c) => c.id === message.chatId)
      ) {
        chats = [
          {
            id: message.chatId,
            name: message.chatId,
            phone: message.chatId,
            lastActivity: message.timestamp,
          },
          ...chats,
        ];
      }

      return {
        ...state,
        messagesByChat: { ...state.messagesByChat, [message.chatId]: messages },
        unread,
        chats,
      };
    }

    case "UPDATE_MESSAGE_STATUS": {
      const existing = state.messagesByChat[action.chatId] ?? [];
      return {
        ...state,
        messagesByChat: {
          ...state.messagesByChat,
          [action.chatId]: existing.map((m) =>
            m.id === action.id ? { ...m, status: action.status } : m
          ),
        },
      };
    }

    case "REPLACE_MESSAGE_ID": {
      const list = state.messagesByChat[action.chatId] ?? [];
      const hasServer = list.some((m) => m.id === action.serverId);
      const messages = hasServer
        ? list.filter((m) => m.id !== action.tempId)
        : list.map((m) =>
            m.id === action.tempId
              ? { ...m, id: action.serverId, status: "sent" as const }
              : m
          );
      return {
        ...state,
        messagesByChat: { ...state.messagesByChat, [action.chatId]: messages },
      };
    }

    default:
      return state;
  }
}
