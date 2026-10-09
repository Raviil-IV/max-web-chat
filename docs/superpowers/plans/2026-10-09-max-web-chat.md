# MAX Web Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Одностраничный React-чат для обмена текстовыми сообщениями в MAX через GREEN-API, упакованный в Docker.

**Architecture:** Чистый клиентский SPA (Vite + React + TypeScript) без бэкенда. Запросы уходят из браузера напрямую в `https://api.green-api.com`. Состояние — Context + `useReducer`, гидрируется из `localStorage`. Приём — поллинг `ReceiveNotification`/`DeleteNotification`. Сборка раздаётся nginx в Docker.

**Tech Stack:** React 18, TypeScript 5, Vite 5, CSS Modules, Vitest + React Testing Library, Docker (node:20-alpine → nginx:alpine).

## Global Constraints

- Только текстовые сообщения; медиа/служебные уведомления игнорируются.
- Бэкенда нет; единственный внешний хост — `https://api.green-api.com`.
- Метод-URL: `https://api.green-api.com/waInstance{idInstance}/{method}/{apiTokenInstance}`.
- Лимит текста сообщения — 4000 символов (UI блокирует превышение).
- `localStorage` хранит учётные данные, чаты и сообщения.
- Автонастройка инстанса при логине: `setSettings({ webhookUrl: "", incomingWebhook: "yes", outgoingWebhook: "yes" })`.
- Язык интерфейса — русский.
- Коммиты — частые, по одному на задачу, Conventional Commits.
- Node.js ≥ 20, npm ≥ 10.

---

### Task 1: Каркас проекта (Vite + React + TS + Vitest)

**Files:**
- Create: `package.json`, `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `index.html`
- Create: `src/main.tsx`, `src/vite-env.d.ts`, `src/test/setup.ts`
- Create: `src/components/App.tsx`, `src/components/App.test.tsx`

**Interfaces:**
- Consumes: —
- Produces: компонент `App` (default export) из `src/components/App.tsx`.

- [ ] **Step 1: Создать `package.json`**

```json
{
  "name": "max-web-chat",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.8",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.2",
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "jsdom": "^24.1.1",
    "typescript": "^5.5.3",
    "vite": "^5.4.0",
    "vitest": "^2.0.5"
  }
}
```

- [ ] **Step 2: Создать TypeScript-конфиги**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Создать `vite.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    css: true,
  },
});
```

- [ ] **Step 4: Создать `index.html` и точку входа**

`index.html`:

```html
<!doctype html>
<html lang="ru">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MAX Чат</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./components/App";
import "./styles/globals.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`src/styles/globals.css` (заглушка, будет дополнена в Task 11):

```css
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
```

- [ ] **Step 5: Написать падающий тест для `App`**

`src/components/App.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { App } from "./App";

describe("App", () => {
  it("renders the app title", () => {
    render(<App />);
    expect(screen.getByText("MAX Чат")).toBeInTheDocument();
  });
});
```

- [ ] **Step 6: Запустить тест — убедиться, что падает**

Run: `npm install && npx vitest run src/components/App.test.tsx`
Expected: FAIL — не удаётся импортировать `./App`.

- [ ] **Step 7: Создать минимальный `App`**

`src/components/App.tsx`:

```tsx
export function App() {
  return <div>MAX Чат</div>;
}
```

- [ ] **Step 8: Запустить тест — убедиться, что проходит**

Run: `npx vitest run src/components/App.test.tsx`
Expected: PASS.

- [ ] **Step 9: Коммит**

```bash
git add .
git commit -m "chore: scaffold Vite + React + TypeScript + Vitest"
```

---

### Task 2: API-клиент GREEN-API

**Files:**
- Create: `src/api/types.ts`, `src/api/greenApi.ts`
- Test: `src/api/greenApi.test.ts`

**Interfaces:**
- Consumes: —
- Produces:
  - `type Credentials = { idInstance: string; apiTokenInstance: string }`
  - `type NotificationBody`, `type Notification`
  - `class GreenApiError extends Error { constructor(public status: number, message: string) }`
  - `getSettings(creds: Credentials): Promise<unknown>`
  - `setSettings(creds: Credentials, settings: GreenApiSettings): Promise<{ saveSettings: boolean }>`
  - `checkAccount(creds: Credentials, phoneNumber: string): Promise<CheckAccountResponse>`
  - `sendMessage(creds: Credentials, chatId: string, message: string): Promise<SendMessageResponse>`
  - `receiveNotification(creds: Credentials): Promise<Notification | null>`
  - `deleteNotification(creds: Credentials, receiptId: number): Promise<{ result: boolean }>`
  - `resolveChatId(creds: Credentials, phoneNumber: string): Promise<string>`

- [ ] **Step 1: Создать типы**

`src/api/types.ts`:

```ts
export interface Credentials {
  idInstance: string;
  apiTokenInstance: string;
}

export interface GreenApiSettings {
  webhookUrl?: string;
  incomingWebhook?: "yes" | "no";
  outgoingWebhook?: "yes" | "no";
  stateWebhook?: "yes" | "no";
}

export interface SendMessageResponse {
  idMessage: string;
}

export interface CheckAccountResponse {
  chatId?: string;
  idChat?: string;
  exists?: boolean;
  [key: string]: unknown;
}

export interface TextMessageData {
  textMessage: string;
}

export interface MessageData {
  typeMessage: string;
  textMessageData?: TextMessageData;
}

export interface SenderData {
  chatId: string;
  chatName?: string;
  sender?: string;
  senderName?: string;
}

export interface NotificationBody {
  typeWebhook: string;
  timestamp: number;
  idMessage: string;
  senderData?: SenderData;
  messageData?: MessageData;
  instanceData?: { idInstance: number; wid: string; typeInstance: string };
}

export interface Notification {
  receiptId: number;
  body: NotificationBody;
}
```

- [ ] **Step 2: Написать падающие тесты API-клиента**

`src/api/greenApi.test.ts`:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GreenApiError,
  checkAccount,
  deleteNotification,
  getSettings,
  receiveNotification,
  resolveChatId,
  sendMessage,
  setSettings,
} from "./greenApi";
import type { Credentials } from "./types";

const creds: Credentials = { idInstance: "1101000", apiTokenInstance: "token" };

function mockFetchOnce(json: unknown, ok = true, status = 200) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    status,
    json: async () => json,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("greenApi", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllGlobals());

  it("getSettings requests the correct URL", async () => {
    const fetchMock = mockFetchOnce({ wid: "1" });
    await getSettings(creds);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.green-api.com/waInstance1101000/getSettings/token",
      expect.objectContaining({ method: "GET" })
    );
  });

  it("setSettings posts settings body", async () => {
    const fetchMock = mockFetchOnce({ saveSettings: true });
    await setSettings(creds, { webhookUrl: "", incomingWebhook: "yes" });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.green-api.com/waInstance1101000/setSettings/token");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ webhookUrl: "", incomingWebhook: "yes" });
  });

  it("sendMessage posts chatId and message and returns idMessage", async () => {
    mockFetchOnce({ idMessage: "abc" });
    const res = await sendMessage(creds, "70000000000", "привет");
    expect(res.idMessage).toBe("abc");
  });

  it("receiveNotification returns null on empty body", async () => {
    mockFetchOnce(null);
    await expect(receiveNotification(creds)).resolves.toBeNull();
  });

  it("deleteNotification uses receiptId in the path", async () => {
    const fetchMock = mockFetchOnce({ result: true });
    await deleteNotification(creds, 42);
    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.green-api.com/waInstance1101000/deleteNotification/token/42"
    );
  });

  it("throws GreenApiError on non-ok response", async () => {
    mockFetchOnce({ message: "bad" }, false, 401);
    await expect(getSettings(creds)).rejects.toBeInstanceOf(GreenApiError);
  });

  it("resolveChatId returns chatId from checkAccount when present", async () => {
    mockFetchOnce({ chatId: "777" });
    await expect(resolveChatId(creds, "+7 (000) 000-00-00")).resolves.toBe("777");
  });

  it("resolveChatId falls back to the normalized phone number", async () => {
    mockFetchOnce({ exists: true });
    await expect(resolveChatId(creds, "+7 (999) 123-45-67")).resolves.toBe("79991234567");
  });
});
```

- [ ] **Step 3: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/api/greenApi.test.ts`
Expected: FAIL — модуль `./greenApi` не найден.

- [ ] **Step 4: Реализовать API-клиент**

`src/api/greenApi.ts`:

```ts
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
  init: RequestInit = { method: "GET" }
): Promise<T> {
  const response = await fetch(buildUrl(creds, path), {
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
  return request(creds, `deleteNotification/${receiptId}`, { method: "DELETE" });
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
```

> **Проверка на живом инстансе (checkpoint):** формат `chatId` для MAX и точное поле ответа `checkAccount` нужно подтвердить на реальном инстансе перед переходом дальше (см. §11 спецификации). Если поле отличается, поправить `resolveChatId` и тест Step 2.

- [ ] **Step 5: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/api/greenApi.test.ts`
Expected: PASS (8 тестов).

- [ ] **Step 6: Коммит**

```bash
git add src/api
git commit -m "feat(api): add GREEN-API client"
```

---

### Task 3: Нормализация входящих уведомлений

**Files:**
- Create: `src/store/types.ts` (только типы домена на этом шаге)
- Create: `src/store/normalize.ts`
- Test: `src/store/normalize.test.ts`

**Interfaces:**
- Consumes: `NotificationBody` из `src/api/types.ts`.
- Produces:
  - `type MessageDirection = "in" | "out"`
  - `type MessageStatus = "sending" | "sent" | "failed"`
  - `interface Message { id: string; chatId: string; text: string; timestamp: number; direction: MessageDirection; status?: MessageStatus }`
  - `interface Chat { id: string; name: string; phone: string; lastActivity: number }`
  - `notificationToMessage(body: NotificationBody): Message | null`

- [ ] **Step 1: Создать типы домена**

`src/store/types.ts`:

```ts
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
```

- [ ] **Step 2: Написать падающие тесты нормализации**

`src/store/normalize.test.ts`:

```ts
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
```

- [ ] **Step 3: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/store/normalize.test.ts`
Expected: FAIL — модуль `./normalize` не найден.

- [ ] **Step 4: Реализовать нормализацию**

`src/store/normalize.ts`:

```ts
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
```

- [ ] **Step 5: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/store/normalize.test.ts`
Expected: PASS (5 тестов).

- [ ] **Step 6: Коммит**

```bash
git add src/store
git commit -m "feat(store): normalize GREEN-API notifications into messages"
```

---

### Task 4: Reducer состояния

**Files:**
- Modify: `src/store/types.ts` (добавить `AppState`, `ConnectionStatus`)
- Create: `src/store/reducer.ts`
- Test: `src/store/reducer.test.ts`

**Interfaces:**
- Consumes: `Message`, `Chat` из `src/store/types.ts`.
- Produces:
  - `type ConnectionStatus = "idle" | "connecting" | "online" | "error"`
  - `interface AppState { credentials: Credentials | null; connection: ConnectionStatus; chats: Chat[]; messagesByChat: Record<string, Message[]>; activeChatId: string | null; unread: Record<string, number> }`
  - `type Action` (см. код)
  - `initialState: AppState`
  - `reducer(state: AppState, action: Action): AppState`

- [ ] **Step 1: Дополнить типы состояния**

Добавить в `src/store/types.ts`:

```ts
import type { Credentials } from "../api/types";

export type ConnectionStatus = "idle" | "connecting" | "online" | "error";

export interface AppState {
  credentials: Credentials | null;
  connection: ConnectionStatus;
  chats: Chat[];
  messagesByChat: Record<string, Message[]>;
  activeChatId: string | null;
  unread: Record<string, number>;
}
```

- [ ] **Step 2: Написать падающие тесты reducer'а**

`src/store/reducer.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./reducer";
import type { Message } from "./types";

const msg = (over: Partial<Message>): Message => ({
  id: "m1",
  chatId: "c1",
  text: "hi",
  timestamp: 1,
  direction: "in",
  ...over,
});

describe("reducer", () => {
  it("adds a chat and selects it", () => {
    const state = reducer(initialState, {
      type: "ADD_CHAT",
      chat: { id: "c1", name: "Иван", phone: "7999", lastActivity: 1 },
    });
    expect(state.chats).toHaveLength(1);
    expect(state.activeChatId).toBe("c1");
  });

  it("adds a message", () => {
    const state = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({}) }
    );
    expect(state.messagesByChat["c1"]).toHaveLength(1);
  });

  it("deduplicates messages by id", () => {
    const withOne = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({}) }
    );
    const withTwo = reducer(withOne, { type: "ADD_MESSAGE", message: msg({}) });
    expect(withTwo.messagesByChat["c1"]).toHaveLength(1);
  });

  it("increments unread for inactive chats and marks active chat read", () => {
    const state = reducer(
      { ...initialState, activeChatId: "other" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "in" }) }
    );
    expect(state.unread["c1"]).toBe(1);
  });

  it("does not count own outgoing messages as unread", () => {
    const state = reducer(
      { ...initialState, activeChatId: "other" },
      { type: "ADD_MESSAGE", message: msg({ chatId: "c1", direction: "out" }) }
    );
    expect(state.unread["c1"]).toBeUndefined();
  });

  it("updates a message status", () => {
    const withMsg = reducer(
      { ...initialState, activeChatId: "c1" },
      { type: "ADD_MESSAGE", message: msg({ direction: "out", status: "sending" }) }
    );
    const updated = reducer(withMsg, {
      type: "UPDATE_MESSAGE_STATUS",
      chatId: "c1",
      id: "m1",
      status: "sent",
    });
    expect(updated.messagesByChat["c1"][0].status).toBe("sent");
  });

  it("marks a chat read when selected", () => {
    const withUnread = {
      ...initialState,
      unread: { c1: 3 },
      chats: [{ id: "c1", name: "x", phone: "1", lastActivity: 1 }],
    };
    const state = reducer(withUnread, { type: "SELECT_CHAT", chatId: "c1" });
    expect(state.unread["c1"]).toBe(0);
    expect(state.activeChatId).toBe("c1");
  });

  it("logs out and clears state", () => {
    const state = reducer(
      { ...initialState, credentials: { idInstance: "1", apiTokenInstance: "t" } },
      { type: "LOGOUT" }
    );
    expect(state).toEqual(initialState);
  });

  it("hydrates from persisted state", () => {
    const persisted = { ...initialState, activeChatId: "c9" };
    expect(reducer(initialState, { type: "HYDRATE", state: persisted })).toEqual(persisted);
  });
});
```

- [ ] **Step 3: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/store/reducer.test.ts`
Expected: FAIL — модуль `./reducer` не найден.

- [ ] **Step 4: Реализовать reducer**

`src/store/reducer.ts`:

```ts
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
  | { type: "UPDATE_MESSAGE_STATUS"; chatId: string; id: string; status: MessageStatus };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE":
      return action.state;

    case "LOGIN_SUCCESS":
      return { ...state, credentials: action.credentials, connection: "online" };

    case "LOGOUT":
      return initialState;

    case "SET_CONNECTION":
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

      const isUnread = message.direction === "in" && message.chatId !== state.activeChatId;
      const unread = isUnread
        ? { ...state.unread, [message.chatId]: (state.unread[message.chatId] ?? 0) + 1 }
        : state.unread;

      const chats = state.chats.map((c) =>
        c.id === message.chatId ? { ...c, lastActivity: message.timestamp } : c
      );

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

    default:
      return state;
  }
}
```

- [ ] **Step 5: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/store/reducer.test.ts`
Expected: PASS (9 тестов).

- [ ] **Step 6: Коммит**

```bash
git add src/store
git commit -m "feat(store): add chat state reducer"
```

---

### Task 5: Персистентность в localStorage

**Files:**
- Create: `src/store/storage.ts`
- Create: `src/hooks/usePersistentState.ts`
- Test: `src/store/storage.test.ts`

**Interfaces:**
- Consumes: `AppState` из `src/store/types.ts`.
- Produces:
  - `loadState(): AppState | null`
  - `saveState(state: AppState): void`
  - `clearState(): void`

- [ ] **Step 1: Написать падающие тесты хранилища**

`src/store/storage.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { initialState } from "./reducer";
import { clearState, loadState, saveState } from "./storage";

describe("storage", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when nothing is stored", () => {
    expect(loadState()).toBeNull();
  });

  it("saves and loads state without persisting connection status", () => {
    saveState({ ...initialState, connection: "online", activeChatId: "c1" });
    const loaded = loadState();
    expect(loaded?.activeChatId).toBe("c1");
    expect(loaded?.connection).toBe("idle");
  });

  it("returns null on corrupted data", () => {
    localStorage.setItem("max-web-chat:state", "{not json");
    expect(loadState()).toBeNull();
  });

  it("clears state", () => {
    saveState(initialState);
    clearState();
    expect(loadState()).toBeNull();
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/store/storage.test.ts`
Expected: FAIL — модуль `./storage` не найден.

- [ ] **Step 3: Реализовать хранилище**

`src/store/storage.ts`:

```ts
import { initialState } from "./reducer";
import type { AppState } from "./types";

const STORAGE_KEY = "max-web-chat:state";

export function saveState(state: AppState): void {
  try {
    const persisted: AppState = { ...state, connection: "idle" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    /* приватный режим / переполнение — игнорируем */
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...initialState,
      ...parsed,
      connection: "idle",
    };
  } catch {
    return null;
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* игнорируем */
  }
}
```

- [ ] **Step 4: Создать хук `usePersistentState`**

`src/hooks/usePersistentState.ts`:

```ts
import { useEffect } from "react";
import type { AppState } from "../store/types";
import { saveState } from "../store/storage";

export function usePersistentState(state: AppState): void {
  useEffect(() => {
    saveState(state);
  }, [state]);
}
```

- [ ] **Step 5: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/store/storage.test.ts`
Expected: PASS (4 теста).

- [ ] **Step 6: Коммит**

```bash
git add src/store/storage.ts src/store/storage.test.ts src/hooks/usePersistentState.ts
git commit -m "feat(store): persist app state in localStorage"
```

---

### Task 6: Контекст и действия чата

**Files:**
- Create: `src/store/ChatContext.tsx`
- Test: `src/store/ChatContext.test.tsx`

**Interfaces:**
- Consumes: `reducer`, `initialState`, `Action`; `greenApi` функции; `storage`.
- Produces:
  - `interface ChatContextValue` с полями `state: AppState`, `login(creds): Promise<void>`, `logout(): void`, `addChat(phone: string): Promise<void>`, `selectChat(chatId: string): void`, `send(chatId: string, text: string): Promise<void>`, `retry(message: Message): Promise<void>`, `receive(): Promise<boolean>`
  - `ChatProvider` (props `{ children }`), `useChat(): ChatContextValue`

- [ ] **Step 1: Написать падающий тест провайдера**

`src/store/ChatContext.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/store/ChatContext.test.tsx`
Expected: FAIL — модуль `./ChatContext` не найден.

- [ ] **Step 3: Реализовать контекст**

`src/store/ChatContext.tsx`:

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
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
```

- [ ] **Step 4: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/store/ChatContext.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/store/ChatContext.tsx src/store/ChatContext.test.tsx
git commit -m "feat(store): add chat context with login/send/receive actions"
```

---

### Task 7: Хук поллинга

**Files:**
- Create: `src/hooks/usePolling.ts`
- Test: `src/hooks/usePolling.test.tsx`

**Interfaces:**
- Consumes: `useChat()` (поле `receive`), `state.connection`.
- Produces: `usePolling(options?: { intervalMs?: number }): void`

- [ ] **Step 1: Написать падающий тест поллинга**

`src/hooks/usePolling.test.tsx`:

```tsx
import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePolling } from "./usePolling";

const receive = vi.fn();
let connection: string = "online";

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    state: { connection },
    receive,
  }),
}));

function Harness() {
  usePolling({ intervalMs: 1000 });
  return null;
}

describe("usePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    connection = "online";
    receive.mockReset();
    receive.mockResolvedValue(false);
  });
  afterEach(() => vi.useRealTimers());

  it("calls receive repeatedly while online", async () => {
    render(<Harness />);
    await vi.advanceTimersByTimeAsync(0);
    expect(receive).toHaveBeenCalled();
    const calls = receive.mock.calls.length;
    await vi.advanceTimersByTimeAsync(1000);
    expect(receive.mock.calls.length).toBeGreaterThan(calls);
  });

  it("does not poll while offline", async () => {
    connection = "idle";
    render(<Harness />);
    await vi.advanceTimersByTimeAsync(5000);
    expect(receive).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Запустить тесты — убедиться, что падают**

Run: `npx vitest run src/hooks/usePolling.test.tsx`
Expected: FAIL — модуль `./usePolling` не найден.

- [ ] **Step 3: Реализовать хук**

`src/hooks/usePolling.ts`:

```ts
import { useEffect } from "react";
import { useChat } from "../store/ChatContext";

const DEFAULT_INTERVAL = 3000;
const MAX_BACKOFF = 30000;

export function usePolling(options?: { intervalMs?: number }): void {
  const intervalMs = options?.intervalMs ?? DEFAULT_INTERVAL;
  const { state, receive } = useChat();
  const online = state.connection === "online";

  useEffect(() => {
    if (!online) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let backoff = intervalMs;

    const loop = async () => {
      if (stopped) return;
      try {
        const hadMore = await receive();
        backoff = intervalMs;
        // Если в очереди было уведомление — сразу продолжаем, иначе ждём интервал.
        timer = setTimeout(loop, hadMore ? 0 : intervalMs);
      } catch {
        backoff = Math.min(backoff * 2, MAX_BACKOFF);
        timer = setTimeout(loop, backoff);
      }
    };

    void loop();

    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [online, intervalMs, receive]);
}
```

- [ ] **Step 4: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/hooks/usePolling.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/hooks/usePolling.ts src/hooks/usePolling.test.tsx
git commit -m "feat(hooks): add notification polling hook"
```

---

### Task 8: Экран входа

**Files:**
- Create: `src/components/LoginScreen.tsx`, `src/components/LoginScreen.module.css`
- Test: `src/components/LoginScreen.test.tsx`

**Interfaces:**
- Consumes: `useChat().login`.
- Produces: компонент `LoginScreen` (props `{ onSuccess?: () => void }`).

- [ ] **Step 1: Написать падающий тест**

`src/components/LoginScreen.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LoginScreen } from "./LoginScreen";

const login = vi.fn();

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({ login }),
}));

describe("LoginScreen", () => {
  it("does not submit when fields are empty", async () => {
    render(<LoginScreen />);
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    expect(login).not.toHaveBeenCalled();
  });

  it("calls login with entered credentials", async () => {
    login.mockResolvedValueOnce(undefined);
    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1101000");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "token");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    await waitFor(() =>
      expect(login).toHaveBeenCalledWith({ idInstance: "1101000", apiTokenInstance: "token" })
    );
  });

  it("shows an error when login fails", async () => {
    login.mockRejectedValueOnce(new Error("Неверные данные"));
    render(<LoginScreen />);
    await userEvent.type(screen.getByLabelText(/idInstance/i), "1");
    await userEvent.type(screen.getByLabelText(/apiTokenInstance/i), "t");
    await userEvent.click(screen.getByRole("button", { name: /Войти/i }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Неверные данные");
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/components/LoginScreen.test.tsx`
Expected: FAIL — компонент не найден.

- [ ] **Step 3: Реализовать компонент**

`src/components/LoginScreen.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useChat } from "../store/ChatContext";
import styles from "./LoginScreen.module.css";

export function LoginScreen({ onSuccess }: { onSuccess?: () => void }) {
  const { login } = useChat();
  const [idInstance, setIdInstance] = useState("");
  const [apiTokenInstance, setApiTokenInstance] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!idInstance.trim() || !apiTokenInstance.trim()) return;
    setBusy(true);
    setError("");
    try {
      await login({ idInstance: idInstance.trim(), apiTokenInstance: apiTokenInstance.trim() });
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось подключиться");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.wrapper}>
      <form className={styles.card} onSubmit={handleSubmit}>
        <h1 className={styles.title}>MAX Чат</h1>
        <p className={styles.subtitle}>Введите данные инстанса GREEN-API</p>
        <label className={styles.label} htmlFor="idInstance">
          idInstance
        </label>
        <input
          id="idInstance"
          className={styles.input}
          value={idInstance}
          onChange={(e) => setIdInstance(e.target.value)}
          autoComplete="off"
        />
        <label className={styles.label} htmlFor="apiTokenInstance">
          apiTokenInstance
        </label>
        <input
          id="apiTokenInstance"
          className={styles.input}
          type="password"
          value={apiTokenInstance}
          onChange={(e) => setApiTokenInstance(e.target.value)}
          autoComplete="off"
        />
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
        <button className={styles.button} type="submit" disabled={busy}>
          {busy ? "Подключение…" : "Войти"}
        </button>
      </form>
    </div>
  );
}
```

`src/components/LoginScreen.module.css`:

```css
.wrapper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}
.card {
  width: 360px;
  padding: 32px 28px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}
.title {
  margin: 0 0 4px;
  font-size: 22px;
  color: #1c1e21;
}
.subtitle {
  margin: 0 0 20px;
  color: #707579;
  font-size: 14px;
}
.label {
  font-size: 13px;
  color: #707579;
  margin-bottom: 6px;
}
.input {
  height: 40px;
  padding: 0 12px;
  margin-bottom: 16px;
  border: 1px solid #e4e6eb;
  border-radius: 10px;
  font-size: 15px;
  outline: none;
}
.input:focus {
  border-color: #3390ec;
}
.error {
  margin: 0 0 12px;
  color: #d93838;
  font-size: 13px;
}
.button {
  height: 44px;
  border: none;
  border-radius: 10px;
  background: #3390ec;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
.button:disabled {
  opacity: 0.6;
  cursor: default;
}
```

- [ ] **Step 4: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/components/LoginScreen.test.tsx`
Expected: PASS (3 теста).

- [ ] **Step 5: Коммит**

```bash
git add src/components/LoginScreen.tsx src/components/LoginScreen.module.css src/components/LoginScreen.test.tsx
git commit -m "feat(ui): add login screen"
```

---

### Task 9: Сайдбар (список чатов, новый чат, статус соединения)

**Files:**
- Create: `src/components/ConnectionStatus.tsx`, `src/components/ConnectionStatus.module.css`
- Create: `src/components/NewChatForm.tsx`, `src/components/NewChatForm.module.css`
- Create: `src/components/ChatList.tsx`, `src/components/ChatList.module.css`
- Create: `src/components/Sidebar.tsx`, `src/components/Sidebar.module.css`
- Test: `src/components/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `useChat()` (`state`, `addChat`, `selectChat`).
- Produces: компонент `Sidebar`.

- [ ] **Step 1: Написать падающий тест**

`src/components/Sidebar.test.tsx`:

```tsx
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Sidebar } from "./Sidebar";

const addChat = vi.fn();
const selectChat = vi.fn();

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    addChat,
    selectChat,
    state: {
      connection: "online",
      activeChatId: "c1",
      unread: { c1: 0 },
      chats: [
        { id: "c1", name: "+7 999 111-22-33", phone: "79991112233", lastActivity: 2 },
        { id: "c2", name: "+7 900 000-00-00", phone: "79000000000", lastActivity: 1 },
      ],
    },
  }),
}));

describe("Sidebar", () => {
  it("renders chats and highlights the active one", () => {
    render(<Sidebar />);
    expect(screen.getByText("+7 999 111-22-33")).toBeInTheDocument();
    expect(screen.getByText("+7 900 000-00-00")).toBeInTheDocument();
  });

  it("creates a chat from a phone number", async () => {
    addChat.mockResolvedValueOnce(undefined);
    render(<Sidebar />);
    await userEvent.type(screen.getByPlaceholderText(/номер/i), "79991112233");
    await userEvent.click(screen.getByRole("button", { name: /Создать/i }));
    await waitFor(() => expect(addChat).toHaveBeenCalledWith("79991112233"));
  });

  it("selects a chat on click", async () => {
    render(<Sidebar />);
    await userEvent.click(screen.getByText("+7 900 000-00-00"));
    expect(selectChat).toHaveBeenCalledWith("c2");
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: FAIL — компонент не найден.

- [ ] **Step 3: Реализовать `ConnectionStatus`**

`src/components/ConnectionStatus.tsx`:

```tsx
import { useChat } from "../store/ChatContext";
import styles from "./ConnectionStatus.module.css";

const LABELS: Record<string, string> = {
  idle: "Не подключено",
  connecting: "Подключение…",
  online: "На связи",
  error: "Переподключение…",
};

export function ConnectionStatus() {
  const { state } = useChat();
  return (
    <div className={styles.status} data-status={state.connection}>
      <span className={styles.dot} />
      {LABELS[state.connection]}
    </div>
  );
}
```

`src/components/ConnectionStatus.module.css`:

```css
.status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  color: #707579;
  border-bottom: 1px solid #e4e6eb;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #b0b3b8;
}
.status[data-status="online"] .dot { background: #31b545; }
.status[data-status="connecting"] .dot { background: #e8a300; }
.status[data-status="error"] .dot { background: #d93838; }
```

- [ ] **Step 4: Реализовать `NewChatForm`**

`src/components/NewChatForm.tsx`:

```tsx
import { useState, type FormEvent } from "react";
import { useChat } from "../store/ChatContext";
import styles from "./NewChatForm.module.css";

export function NewChatForm() {
  const { addChat } = useChat();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = phone.trim();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      await addChat(value);
      setPhone("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось создать чат");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <input
        className={styles.input}
        placeholder="Введите номер телефона"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        inputMode="tel"
      />
      <button className={styles.button} type="submit" disabled={busy}>
        Создать
      </button>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
```

`src/components/NewChatForm.module.css`:

```css
.form {
  display: flex;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid #e4e6eb;
  flex-wrap: wrap;
}
.input {
  flex: 1;
  min-width: 0;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #e4e6eb;
  border-radius: 10px;
  outline: none;
  font-size: 14px;
}
.input:focus { border-color: #3390ec; }
.button {
  height: 36px;
  padding: 0 14px;
  border: none;
  border-radius: 10px;
  background: #3390ec;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.button:disabled { opacity: 0.6; cursor: default; }
.error {
  width: 100%;
  margin: 4px 0 0;
  color: #d93838;
  font-size: 12px;
}
```

- [ ] **Step 5: Реализовать `ChatList`**

`src/components/ChatList.tsx`:

```tsx
import { useChat } from "../store/ChatContext";
import styles from "./ChatList.module.css";

export function ChatList() {
  const { state, selectChat } = useChat();
  return (
    <ul className={styles.list}>
      {state.chats.map((chat) => {
        const unread = state.unread[chat.id] ?? 0;
        const active = chat.id === state.activeChatId;
        return (
          <li key={chat.id}>
            <button
              type="button"
              className={`${styles.item} ${active ? styles.active : ""}`}
              onClick={() => selectChat(chat.id)}
            >
              <span className={styles.avatar}>{chat.name.replace(/\D/g, "").slice(-2) || "?"}</span>
              <span className={styles.name}>{chat.name}</span>
              {unread > 0 && <span className={styles.badge}>{unread}</span>}
            </button>
          </li>
        );
      })}
      {state.chats.length === 0 && (
        <li className={styles.empty}>Создайте первый чат, чтобы начать переписку</li>
      )}
    </ul>
  );
}
```

`src/components/ChatList.module.css`:

```css
.list { list-style: none; margin: 0; padding: 4px; overflow-y: auto; flex: 1; }
.item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  cursor: pointer;
  text-align: left;
  font-size: 15px;
  color: #1c1e21;
}
.item:hover { background: #f0f2f5; }
.active { background: #3390ec; color: #fff; }
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dfe6ec;
  color: #3390ec;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}
.active .avatar { background: rgba(255,255,255,0.25); color: #fff; }
.name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.badge {
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #3390ec;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.active .badge { background: #fff; color: #3390ec; }
.empty { padding: 16px; color: #707579; font-size: 14px; text-align: center; }
```

- [ ] **Step 6: Реализовать `Sidebar`**

`src/components/Sidebar.tsx`:

```tsx
import { ChatList } from "./ChatList";
import { ConnectionStatus } from "./ConnectionStatus";
import { NewChatForm } from "./NewChatForm";
import styles from "./Sidebar.module.css";

export function Sidebar() {
  return (
    <aside className={styles.sidebar}>
      <ConnectionStatus />
      <NewChatForm />
      <ChatList />
    </aside>
  );
}
```

`src/components/Sidebar.module.css`:

```css
.sidebar {
  width: 320px;
  flex-shrink: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #fff;
  border-right: 1px solid #e4e6eb;
}
```

- [ ] **Step 7: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/components/Sidebar.test.tsx`
Expected: PASS (3 теста).

- [ ] **Step 8: Коммит**

```bash
git add src/components
git commit -m "feat(ui): add sidebar with chat list, new-chat form and connection status"
```

---

### Task 10: Окно чата (сообщения и композер)

**Files:**
- Create: `src/components/ChatHeader.tsx`, `src/components/ChatHeader.module.css`
- Create: `src/components/MessageBubble.tsx`, `src/components/MessageBubble.module.css`
- Create: `src/components/MessageList.tsx`, `src/components/MessageList.module.css`
- Create: `src/components/MessageComposer.tsx`, `src/components/MessageComposer.module.css`
- Create: `src/components/ChatWindow.tsx`, `src/components/ChatWindow.module.css`
- Test: `src/components/ChatWindow.test.tsx`

**Interfaces:**
- Consumes: `useChat()` (`state`, `send`, `retry`).
- Produces: компонент `ChatWindow`.

- [ ] **Step 1: Написать падающий тест**

`src/components/ChatWindow.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChatWindow } from "./ChatWindow";

const send = vi.fn();
const retry = vi.fn();

vi.mock("../store/ChatContext", () => ({
  useChat: () => ({
    send,
    retry,
    state: {
      activeChatId: "c1",
      chats: [{ id: "c1", name: "+7 999 111-22-33", phone: "79991112233", lastActivity: 2 }],
      messagesByChat: {
        c1: [
          { id: "m1", chatId: "c1", text: "Привет", timestamp: 1, direction: "in" },
          { id: "m2", chatId: "c1", text: "Здравствуйте", timestamp: 2, direction: "out", status: "sent" },
        ],
      },
    },
  }),
}));

describe("ChatWindow", () => {
  beforeEach(() => {
    send.mockReset();
    retry.mockReset();
  });

  it("renders messages of the active chat", () => {
    render(<ChatWindow />);
    expect(screen.getByText("Привет")).toBeInTheDocument();
    expect(screen.getByText("Здравствуйте")).toBeInTheDocument();
  });

  it("sends on Enter and clears the input", async () => {
    render(<ChatWindow />);
    const box = screen.getByPlaceholderText(/сообщение/i);
    await userEvent.type(box, "новое{Enter}");
    expect(send).toHaveBeenCalledWith("c1", "новое");
    expect((box as HTMLTextAreaElement).value).toBe("");
  });

  it("does not send empty text", async () => {
    render(<ChatWindow />);
    await userEvent.type(screen.getByPlaceholderText(/сообщение/i), "{Enter}");
    expect(send).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/components/ChatWindow.test.tsx`
Expected: FAIL — компонент не найден.

- [ ] **Step 3: Реализовать `ChatHeader`**

`src/components/ChatHeader.tsx`:

```tsx
import type { Chat } from "../store/types";
import styles from "./ChatHeader.module.css";

export function ChatHeader({ chat }: { chat: Chat }) {
  return (
    <header className={styles.header}>
      <span className={styles.avatar}>{chat.name.replace(/\D/g, "").slice(-2) || "?"}</span>
      <div>
        <div className={styles.name}>{chat.name}</div>
        <div className={styles.subtitle}>MAX</div>
      </div>
    </header>
  );
}
```

`src/components/ChatHeader.module.css`:

```css
.header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #fff;
  border-bottom: 1px solid #e4e6eb;
}
.avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #dfe6ec;
  color: #3390ec;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}
.name { font-size: 15px; font-weight: 600; color: #1c1e21; }
.subtitle { font-size: 12px; color: #707579; }
```

- [ ] **Step 4: Реализовать `MessageBubble`**

`src/components/MessageBubble.tsx`:

```tsx
import type { Message } from "../store/types";
import styles from "./MessageBubble.module.css";

const STATUS_LABEL: Record<string, string> = {
  sending: "⏳",
  sent: "✓",
  failed: "⚠",
};

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function MessageBubble({
  message,
  onRetry,
}: {
  message: Message;
  onRetry?: (message: Message) => void;
}) {
  const out = message.direction === "out";
  return (
    <div className={`${styles.row} ${out ? styles.out : styles.in}`}>
      <div className={styles.bubble}>
        <span className={styles.text}>{message.text}</span>
        <span className={styles.meta}>
          {formatTime(message.timestamp)}
          {out && message.status && <span className={styles.status}>{STATUS_LABEL[message.status]}</span>}
        </span>
        {out && message.status === "failed" && onRetry && (
          <button className={styles.retry} type="button" onClick={() => onRetry(message)}>
            Повторить
          </button>
        )}
      </div>
    </div>
  );
}
```

`src/components/MessageBubble.module.css`:

```css
.row { display: flex; margin: 2px 0; }
.in { justify-content: flex-start; }
.out { justify-content: flex-end; }
.bubble {
  max-width: 70%;
  padding: 8px 12px;
  border-radius: 12px;
  font-size: 15px;
  line-height: 1.35;
  color: #1c1e21;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0,0,0,0.08);
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.out .bubble { background: #eeffde; }
.text { white-space: pre-wrap; word-break: break-word; }
.meta {
  align-self: flex-end;
  font-size: 11px;
  color: #8a8d91;
  display: flex;
  gap: 4px;
  align-items: center;
}
.retry {
  align-self: flex-end;
  margin-top: 4px;
  border: none;
  background: transparent;
  color: #d93838;
  font-size: 12px;
  cursor: pointer;
  padding: 0;
}
```

- [ ] **Step 5: Реализовать `MessageList`**

`src/components/MessageList.tsx`:

```tsx
import { useEffect, useRef } from "react";
import type { Message } from "../store/types";
import { MessageBubble } from "./MessageBubble";
import styles from "./MessageList.module.css";

export function MessageList({
  messages,
  onRetry,
}: {
  messages: Message[];
  onRetry?: (message: Message) => void;
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  return (
    <div className={styles.list}>
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onRetry={onRetry} />
      ))}
      <div ref={endRef} />
    </div>
  );
}
```

`src/components/MessageList.module.css`:

```css
.list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  background: #d9e2e8;
}
```

- [ ] **Step 6: Реализовать `MessageComposer`**

`src/components/MessageComposer.tsx`:

```tsx
import { useState, type KeyboardEvent } from "react";
import styles from "./MessageComposer.module.css";

const MAX_LENGTH = 4000;

export function MessageComposer({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const trimmed = text.trim();
  const tooLong = text.length > MAX_LENGTH;

  function submit() {
    if (!trimmed || tooLong) return;
    onSend(trimmed);
    setText("");
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className={styles.composer}>
      <textarea
        className={styles.textarea}
        placeholder="Введите сообщение"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={1}
        disabled={disabled}
      />
      <button
        className={styles.send}
        type="button"
        onClick={submit}
        disabled={disabled || !trimmed || tooLong}
      >
        Отправить
      </button>
      <span className={`${styles.counter} ${tooLong ? styles.over : ""}`}>
        {text.length}/{MAX_LENGTH}
      </span>
    </div>
  );
}
```

`src/components/MessageComposer.module.css`:

```css
.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  padding: 10px 16px;
  background: #fff;
  border-top: 1px solid #e4e6eb;
  position: relative;
}
.textarea {
  flex: 1;
  resize: none;
  max-height: 120px;
  padding: 10px 12px;
  border: 1px solid #e4e6eb;
  border-radius: 10px;
  font-size: 15px;
  font-family: inherit;
  outline: none;
}
.textarea:focus { border-color: #3390ec; }
.send {
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: #3390ec;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}
.send:disabled { opacity: 0.5; cursor: default; }
.counter {
  position: absolute;
  right: 96px;
  bottom: 4px;
  font-size: 11px;
  color: #8a8d91;
}
.over { color: #d93838; }
```

- [ ] **Step 7: Реализовать `ChatWindow`**

`src/components/ChatWindow.tsx`:

```tsx
import { useChat } from "../store/ChatContext";
import { ChatHeader } from "./ChatHeader";
import { MessageComposer } from "./MessageComposer";
import { MessageList } from "./MessageList";
import styles from "./ChatWindow.module.css";

export function ChatWindow() {
  const { state, send, retry } = useChat();
  const chat = state.chats.find((c) => c.id === state.activeChatId);

  if (!chat) {
    return <div className={styles.placeholder}>Выберите чат или создайте новый</div>;
  }

  const messages = state.messagesByChat[chat.id] ?? [];

  return (
    <section className={styles.window}>
      <ChatHeader chat={chat} />
      <MessageList messages={messages} onRetry={(m) => void retry(m)} />
      <MessageComposer onSend={(text) => void send(chat.id, text)} />
    </section>
  );
}
```

`src/components/ChatWindow.module.css`:

```css
.window {
  flex: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #707579;
  background: #d9e2e8;
}
```

- [ ] **Step 8: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/components/ChatWindow.test.tsx`
Expected: PASS (3 теста).

- [ ] **Step 9: Коммит**

```bash
git add src/components
git commit -m "feat(ui): add chat window with messages and composer"
```

---

### Task 11: Сборка приложения и экран логина

**Files:**
- Modify: `src/components/App.tsx`
- Modify: `src/components/App.test.tsx`
- Create: `src/styles/globals.css` (дополнить)
- Test: `src/components/App.test.tsx`

**Interfaces:**
- Consumes: `ChatProvider`, `useChat`, `LoginScreen`, `Sidebar`, `ChatWindow`, `usePolling`.
- Produces: `App` — точка входа, показывающая логин или чат.

- [ ] **Step 1: Переписать тест `App`**

`src/components/App.test.tsx`:

```tsx
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
```

- [ ] **Step 2: Запустить тест — убедиться, что падает**

Run: `npx vitest run src/components/App.test.tsx`
Expected: FAIL — `App` всё ещё рендерит «MAX Чат».

- [ ] **Step 3: Переписать `App`**

`src/components/App.tsx`:

```tsx
import { usePolling } from "../hooks/usePolling";
import { ChatProvider, useChat } from "../store/ChatContext";
import { ChatWindow } from "./ChatWindow";
import { LoginScreen } from "./LoginScreen";
import { Sidebar } from "./Sidebar";
import styles from "./App.module.css";

function Workspace() {
  const { state, logout } = useChat();
  usePolling();

  if (!state.credentials) {
    return <LoginScreen />;
  }

  return (
    <div className={styles.app}>
      <Sidebar />
      <ChatWindow />
      <button className={styles.logout} type="button" onClick={logout}>
        Выйти
      </button>
    </div>
  );
}

export function App() {
  return (
    <ChatProvider>
      <Workspace />
    </ChatProvider>
  );
}
```

> В тесте Step 1 `LoginScreen` берётся настоящий, но он вызывает `useChat()` из мока — поэтому форма рендерится. `usePolling` тоже берёт `useChat` из мока.

- [ ] **Step 4: Создать `App.module.css`**

`src/components/App.module.css`:

```css
.app {
  display: flex;
  height: 100%;
  position: relative;
}
.logout {
  position: absolute;
  top: 12px;
  right: 16px;
  z-index: 5;
  border: 1px solid #e4e6eb;
  background: #fff;
  color: #707579;
  border-radius: 8px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.logout:hover { color: #d93838; border-color: #d93838; }
```

- [ ] **Step 5: Дополнить глобальные стили**

`src/styles/globals.css`:

```css
:root {
  color-scheme: light;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
}
* { box-sizing: border-box; }
html, body, #root { height: 100%; margin: 0; }
body { background: #d9e2e8; }
```

- [ ] **Step 6: Запустить тесты — убедиться, что проходят**

Run: `npx vitest run src/components/App.test.tsx`
Expected: PASS (2 теста).

- [ ] **Step 7: Прогнать весь набор тестов**

Run: `npm test`
Expected: PASS — все тесты зелёные.

- [ ] **Step 8: Проверить сборку**

Run: `npm run build`
Expected: сборка без ошибок TypeScript, артефакты в `dist/`.

- [ ] **Step 9: Коммит**

```bash
git add src
git commit -m "feat: wire app shell with login gate and chat layout"
```

---

### Task 12: Docker и документация

**Files:**
- Create: `Dockerfile`, `nginx.conf`, `.dockerignore`, `docker-compose.yml`, `README.md`

**Interfaces:**
- Consumes: результат `npm run build` (`dist/`).
- Produces: Docker-образ `max-web-chat`, раздающий SPA через nginx на порту 80.

- [ ] **Step 1: Создать `nginx.conf`**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:js|css|woff2?|png|jpg|jpeg|svg|ico)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}
```

- [ ] **Step 2: Создать `Dockerfile`**

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

- [ ] **Step 3: Создать `.dockerignore`**

```
node_modules
dist
.git
.gitignore
*.md
docs
.vscode
.idea
```

- [ ] **Step 4: Создать `docker-compose.yml`**

```yaml
services:
  max-web-chat:
    build: .
    image: max-web-chat
    ports:
      - "8080:80"
    restart: unless-stopped
```

- [ ] **Step 5: Создать `README.md`**

````markdown
# MAX Web Chat

Веб-чат для обмена текстовыми сообщениями в мессенджере MAX через GREEN-API.

## Возможности

- Ввод учётных данных GREEN-API (`idInstance`, `apiTokenInstance`).
- Создание чатов по номеру телефона и переключение между ними.
- Отправка и получение текстовых сообщений (polling ReceiveNotification/DeleteNotification).
- История чатов сохраняется в `localStorage` браузера.

## Разработка

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # тесты
npm run build    # production-сборка в dist/
```

## Запуск в Docker

```sh
docker build -t max-web-chat .
docker run --rm -p 8080:80 max-web-chat
# открыть http://localhost:8080
```

Или через Compose:

```sh
docker compose up --build
```

## Как пользоваться

1. Возьмите `idInstance` и `apiTokenInstance` в личном кабинете GREEN-API.
2. Введите их на экране входа — приложение проверит доступ и настроит инстанс для приёма.
3. Введите номер получателя и создайте чат.
4. Отправьте сообщение и дождитесь ответа — он появится в чате.

## Ограничения

- Поддерживаются только текстовые сообщения (до 4000 символов).
- Учётные данные хранятся в `localStorage` браузера.
````

- [ ] **Step 6: Собрать образ и проверить запуск**

Run: `docker build -t max-web-chat . && docker run -d --rm -p 8080:80 --name max-web-chat-test max-web-chat`
Expected: образ собирается; контейнер стартует.

- [ ] **Step 7: Проверить, что nginx отдаёт приложение**

Run: `curl -s http://localhost:8080 | grep -i "<div id=\"root\""`
Expected: строка с `<div id="root">`.

Затем остановить контейнер:

Run: `docker stop max-web-chat-test`

- [ ] **Step 8: Коммит**

```bash
git add Dockerfile nginx.conf .dockerignore docker-compose.yml README.md
git commit -m "chore: add Docker packaging and README"
```

- [ ] **Step 9: Push**

```bash
git push origin main
```

---

## Self-Review

**Spec coverage:**
- §4 Архитектура → Task 1 (каркас), Task 6 (context).
- §5 Компоненты → Task 8 (LoginScreen), Task 9 (Sidebar/ChatList/NewChatForm/ConnectionStatus), Task 10 (ChatWindow/ChatHeader/MessageList/MessageBubble/MessageComposer), Task 11 (App).
- §6 Поток данных и поллинг → Task 2 (API), Task 3 (нормализация), Task 4 (reducer), Task 6 (действия), Task 7 (поллинг).
- §7 Обработка ошибок → Task 2 (GreenApiError), Task 5 (битый localStorage), Task 6 (статусы sending/failed), Task 7 (backoff), Task 8/9/10 (сообщения об ошибках, лимит 4000, блокировка пустого).
- §8 Тестирование → тесты в каждой задаче; ручной smoke-тест описан в README.
- §9 Docker и репозиторий → Task 12.
- §11 Открытый вопрос `chatId` → checkpoint в Task 2.

**Placeholder scan:** плейсхолдеров/TODO нет; каждый шаг содержит код или точную команду.

**Type consistency:** `Message`, `Chat`, `AppState`, `ConnectionStatus`, `ChatContextValue`, `notificationToMessage`, `resolveChatId` определены в задачах 2–6 и используются без переименований в задачах 7–11. `MessageStatus` = `"sending" | "sent" | "failed"` согласован между Task 3, 4, 6, 10.
