import type {
  CheckAccountResponse,
  Credentials,
  GreenApiSettings,
  Notification,
  SendMessageResponse,
} from "./types";

export const API_URL = "https://api.green-api.com";

export class GreenApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "GreenApiError";
  }
}

function buildUrl(creds: Credentials, path: string): string {
  return `${API_URL}/waInstance${creds.idInstance}/${path}/${creds.apiTokenInstance}`;
}

async function request<T>(
  creds: Credentials,
  path: string,
  init: RequestInit = { method: "GET" },
  url: string = buildUrl(creds, path)
): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const body = await response.json();
      if (body && typeof body.message === "string") message = body.message;
    } catch {
      /* тело не JSON — оставляем сообщение по умолчанию */
    }
    throw new GreenApiError(response.status, message);
  }
  return (await response.json()) as T;
}

export function getSettings(creds: Credentials): Promise<unknown> {
  return request(creds, "getSettings");
}

export function setSettings(
  creds: Credentials,
  settings: GreenApiSettings
): Promise<{ saveSettings: boolean }> {
  return request(creds, "setSettings", {
    method: "POST",
    body: JSON.stringify(settings),
  });
}

export function checkAccount(
  creds: Credentials,
  phoneNumber: string
): Promise<CheckAccountResponse> {
  return request(creds, "checkAccount", {
    method: "POST",
    body: JSON.stringify({ phoneNumber }),
  });
}

export function sendMessage(
  creds: Credentials,
  chatId: string,
  message: string
): Promise<SendMessageResponse> {
  return request(creds, "sendMessage", {
    method: "POST",
    body: JSON.stringify({ chatId, message }),
  });
}

export function receiveNotification(creds: Credentials): Promise<Notification | null> {
  return request<Notification | null>(creds, "receiveNotification");
}

export function deleteNotification(
  creds: Credentials,
  receiptId: number
): Promise<{ result: boolean }> {
  // deleteNotification — единственный метод, у которого receiptId идёт после токена.
  const url = `${buildUrl(creds, "deleteNotification")}/${receiptId}`;
  return request(creds, "deleteNotification", { method: "DELETE" }, url);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export async function resolveChatId(
  creds: Credentials,
  phoneNumber: string
): Promise<string> {
  const normalized = normalizePhone(phoneNumber);
  const account = await checkAccount(creds, normalized);
  const chatId = account.chatId ?? account.idChat;
  return chatId ? String(chatId) : normalized;
}
