import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import * as api from "../api/greenApi";
import type { Credentials } from "../api/types";
import { usePersistentState } from "../hooks/usePersistentState";
import { notificationToMessage } from "./normalize";
import { initialState, reducer } from "./reducer";
import { clearState, loadState } from "./storage";
import type { AppState, Message } from "./types";

export interface ChatContextValue {
  state: AppState;
  login(creds: Credentials): Promise<void>;
  logout(): void;
  addChat(phone: string): Promise<void>;
  selectChat(chatId: string): void;
  send(chatId: string, text: string): Promise<void>;
  retry(message: Message): Promise<void>;
  receive(): Promise<boolean>;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function init(): AppState {
  return loadState() ?? initialState;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, init);
  const credsRef = useRef<Credentials | null>(state.credentials);
  credsRef.current = state.credentials;

  usePersistentState(state);

  const creds = useCallback((): Credentials => {
    const c = credsRef.current;
    if (!c) throw new Error("Не авторизовано");
    return c;
  }, []);

  const login = useCallback(async (next: Credentials) => {
    credsRef.current = next;
    dispatch({ type: "SET_CONNECTION", status: "connecting" });
    await api.getSettings(next);
    await api.setSettings(next, {
      webhookUrl: "",
      incomingWebhook: "yes",
      outgoingWebhook: "yes",
    });
    dispatch({ type: "LOGIN_SUCCESS", credentials: next });
  }, []);

  const logout = useCallback(() => {
    credsRef.current = null;
    clearState();
    dispatch({ type: "LOGOUT" });
  }, []);

  const addChat = useCallback(async (phone: string) => {
    const chatId = await api.resolveChatId(creds(), phone);
    dispatch({
      type: "ADD_CHAT",
      chat: { id: chatId, name: phone, phone, lastActivity: Date.now() },
    });
  }, [creds]);

  const selectChat = useCallback((chatId: string) => {
    dispatch({ type: "SELECT_CHAT", chatId });
  }, []);

  const deliver = useCallback(
    async (chatId: string, text: string, tempId: string) => {
      dispatch({
        type: "ADD_MESSAGE",
        message: { id: tempId, chatId, text, timestamp: Date.now(), direction: "out", status: "sending" },
      });
      try {
        const res = await api.sendMessage(creds(), chatId, text);
        dispatch({ type: "UPDATE_MESSAGE_STATUS", chatId, id: tempId, status: "sent" });
        return res.idMessage;
      } catch (e) {
        dispatch({ type: "UPDATE_MESSAGE_STATUS", chatId, id: tempId, status: "failed" });
        throw e;
      }
    },
    [creds]
  );

  const send = useCallback(
    async (chatId: string, text: string) => {
      const tempId = `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      await deliver(chatId, text, tempId);
    },
    [deliver]
  );

  const retry = useCallback(
    async (message: Message) => {
      dispatch({
        type: "UPDATE_MESSAGE_STATUS",
        chatId: message.chatId,
        id: message.id,
        status: "sending",
      });
      try {
        await api.sendMessage(creds(), message.chatId, message.text);
        dispatch({
          type: "UPDATE_MESSAGE_STATUS",
          chatId: message.chatId,
          id: message.id,
          status: "sent",
        });
      } catch (e) {
        dispatch({
          type: "UPDATE_MESSAGE_STATUS",
          chatId: message.chatId,
          id: message.id,
          status: "failed",
        });
        throw e;
      }
    },
    [creds]
  );

  const receive = useCallback(async (): Promise<boolean> => {
    const notification = await api.receiveNotification(creds());
    if (!notification) return false;
    const message = notificationToMessage(notification.body);
    if (message) {
      dispatch({ type: "ADD_MESSAGE", message });
    }
    await api.deleteNotification(creds(), notification.receiptId);
    return true;
  }, [creds]);

  const value = useMemo<ChatContextValue>(
    () => ({ state, login, logout, addChat, selectChat, send, retry, receive }),
    [state, login, logout, addChat, selectChat, send, retry, receive]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}

export { ChatContext };
