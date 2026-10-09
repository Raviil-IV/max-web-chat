# Веб-чат MAX через GREEN-API — дизайн

Дата: 2026-10-09
Статус: согласовано с заказчиком (все секции дизайна одобрены)

## 1. Обзор

Одностраничное веб-приложение (SPA) для отправки и получения **текстовых**
сообщений в мессенджере **MAX** через сервис **GREEN-API** (v3). Интерфейс
повторяет логику и внешний вид веб-версии `web.max.ru`: сайдбар со списком
чатов и область переписки.

Приложение — чистый клиент без собственного бэкенда. Все запросы уходят из
браузера напрямую в GREEN-API.

## 2. Требования (из ТЗ)

1. UI для отправки и получения сообщений в MAX.
2. Использовать GREEN-API (`https://green-api.com/max`).
3. Только текстовые сообщения.
4. За прототип интерфейса взят внешний вид `https://web.max.ru/`.
5. Максимально простой интерфейс, минимальный набор функций.
6. Отправка — метод `SendMessage`.
7. Получение — технология HTTP API (`ReceiveNotification` + `DeleteNotification`).
8. Стек — React.

**Сценарий (ожидаемый результат):** ввод учётных данных GREEN-API
(`idInstance`, `apiTokenInstance`) → ввод номера получателя и создание чата →
отправка текстового сообщения → ответ получателя в MAX → отображение ответа в чате.

## 3. Принятые решения

- **Подход:** Vite + React + TypeScript, без UI-библиотек; стили — CSS Modules.
- **Интерфейс:** сайдбар со списком чатов, несколько чатов, переключение между ними.
- **Хранение:** учётные данные, список чатов и история сообщений — в `localStorage`.
- **Настройка инстанса:** при подключении приложение автоматически вызывает
  `SetSettings` (`webhookUrl: ""`, `incomingWebhook: "yes"`, `outgoingWebhook: "yes"`),
  чтобы приём через HTTP API работал «из коробки».
- **Развёртывание:** Docker-контейнер (nginx раздаёт собранную статику).
- **Репозиторий:** GitHub `https://github.com/Raviil-IV/max-web-chat`,
  инициализация в текущей папке.

## 4. Архитектура

Слои с чёткими границами; модели данных не знают об API, API-клиент не знает
о React, компоненты не знают, откуда приходят данные.

1. **API-клиент** (`src/api/`) — чистые функции над `fetch`: `getSettings`,
   `setSettings`, `checkAccount`, `sendMessage`, `receiveNotification`,
   `deleteNotification`. Типы запросов/ответов рядом.
2. **Состояние** (`src/store/`) — `ChatProvider` на Context + `useReducer`.
   Гидрируется из `localStorage`.
3. **Хуки** (`src/hooks/`) — `usePolling` (цикл Receive→Delete→dispatch),
   `usePersistentState` (синхронизация с `localStorage`).
4. **UI** (`src/components/`) — презентационные компоненты + пара контейнеров.
5. **Стили** (`src/styles/`) — CSS Modules, тема под `web.max.ru`.

**Внешние связи:** браузер → `https://api.green-api.com` по HTTPS.
CORS поддержан (у GREEN-API есть браузерный HTML SDK). Бэкенда нет.

### Компонентное дерево

```
App
├── LoginScreen          // если нет сохранённых учётных данных
└── ChatLayout
    ├── Sidebar
    │   ├── ConnectionStatus
    │   ├── ChatList
    │   └── NewChatForm   // ввод номера → создание чата
    └── ChatWindow
        ├── ChatHeader
        ├── MessageList → MessageBubble
        └── MessageComposer
```

## 5. Компоненты и обязанности

| Компонент | Обязанность | Зависит от |
|---|---|---|
| `LoginScreen` | Форма `idInstance`/`apiTokenInstance`; проверка (`getSettings`), автонастройка (`setSettings`), сохранение учётки, показ ошибок. | store, api |
| `Sidebar` | Каркас левой панели. | — |
| `ConnectionStatus` | Индикатор поллинга (онлайн / переподключение / ошибка). | store |
| `NewChatForm` | Ввод номера → нормализация → `checkAccount` → создание чата. | store, api |
| `ChatList` | Список чатов, выбор активного, последнее сообщение, счётчик непрочитанных. | store |
| `ChatWindow` | Область переписки; заглушка, если чат не выбран. | store |
| `ChatHeader` | Имя/номер собеседника. | store |
| `MessageList` | Список сообщений, автоскролл к последнему, группировка своих/чужих. | store |
| `MessageBubble` | Текст, время, статус доставки у исходящих (`sending`/`sent`/`failed`). | props |
| `MessageComposer` | Ввод текста, Enter — отправка, Shift+Enter — перенос, лимит 4000 символов, блокировка пустого. | store, api |

Всё состояние — в `ChatProvider`; доступ через `useChat()`. Действия:
`login`, `logout`, `addChat`, `selectChat`, `sendMessage`, `retryMessage`.
Локальный `useState` — только для чисто UI-мелочей (фокус, черновик ввода).

## 6. Поток данных и поллинг

### Вход (логин)
1. `getSettings(idInstance, apiToken)` — проверка учётных данных.
2. Успех → `setSettings({ webhookUrl: "", incomingWebhook: "yes", outgoingWebhook: "yes" })`.
3. Сохранение в `localStorage` → `connection: "online"` → запуск поллинга.

### Цикл поллинга (`usePolling`)
1. Каждые ~3 с — `receiveNotification`.
2. Если вернулся `{ receiptId, body }`: обработать `body`, затем обязательно
   `deleteNotification(receiptId)`.
3. Сразу повторить запрос (осушение очереди); если пусто — ждать интервал.
4. Обрабатываются только текстовые уведомления из `body.typeWebhook`:
   - `incomingMessageReceived` — входящее;
   - `outgoingMessageReceived` — отправлено с телефона;
   - `outgoingAPIMessageReceived` — своё отправленное (сверка, без дублей);
   - статусы, `stateInstanceChanged` и прочее — игнорируются.
5. Из уведомления: `chatId`, `textMessageData.textMessage`, timestamp, направление
   → `ADD_MESSAGE`. Неизвестный `chatId` → чат создаётся автоматически.

### Отправка
1. `sendMessage(chatId, text)`; оптимистично добавляем сообщение `sending`.
2. Ответ `{ idMessage }` → статус `sent`, сохраняем `idMessage`.
3. Ошибка → `failed`. Дубликаты из `outgoingAPIMessageReceived` отсекаются по `idMessage`.

### Создание чата
1. Ввод номера → нормализация (только цифры) → `checkAccount(phoneNumber)` → `chatId`.
2. Чат добавляется в список и становится активным.

### Форма состояния

```ts
{
  credentials: { idInstance: string; apiTokenInstance: string } | null;
  connection: "idle" | "connecting" | "online" | "error";
  chats: { id: string; name: string; phone: string; lastActivity: number }[];
  messagesByChat: Record<string, Message[]>;
  activeChatId: string | null;
  unread: Record<string, number>;
}

type Message = {
  id: string;
  chatId: string;
  text: string;
  timestamp: number;
  direction: "in" | "out";
  status?: "sending" | "sent" | "failed";
};
```

## 7. Обработка ошибок

- **Логин:** неверные данные (401/403) → сообщение под формой, учётка не сохраняется;
  сеть недоступна → «Не удалось подключиться»; ограничения аккаунта (`suspended`) →
  текст из ответа.
- **Поллинг:** сетевые сбои → retry с экспоненциальным backoff (3с → 6с → 12с,
  максимум ~30с), индикатор меняет состояние; ошибка `deleteNotification` не критична
  (уведомление вернётся, дедуп по `idMessage`).
- **Отправка:** ошибка → статус `failed` с кнопкой «Повторить»; на время запроса
  кнопка блокируется; пустой текст и >4000 символов блокируются в композере.
- **Создание чата:** `checkAccount` не нашёл номер → сообщение в `NewChatForm`.
- **Прочее:** неизвестные/медиа-уведомления игнорируются; битый `localStorage` →
  безопасный сброс.

## 8. Тестирование

Стек: Vitest + React Testing Library (jsdom).

- **Reducer:** добавление/дедуп по `idMessage`, непрочитанные, создание чата,
  переходы `sending→sent→failed`.
- **Нормализация вебхуков:** разбор трёх типов уведомлений, игнор не-текстовых.
- **API-клиент (mock fetch):** корректные URL/тело, обработка 200 и ошибок; `null`
  от `receiveNotification`; `setSettings` с пустым `webhookUrl`.
- **Хуки:** `usePolling` на фейковых таймерах — Receive→Delete→dispatch, backoff,
  остановка при логауте.
- **Компоненты:** `LoginScreen`, `MessageComposer` (Enter/Shift+Enter/лимит/пусто),
  `MessageBubble` (статусы).
- **Smoke-тест вручную:** реальный сценарий из ТЗ на живом инстансе.

## 9. Docker и репозиторий

```
max-web-chat/
├── Dockerfile
├── .dockerignore
├── .gitignore
├── nginx.conf
├── package.json / tsconfig.json / vite.config.ts
├── index.html
├── README.md
├── docs/superpowers/specs/2026-10-09-max-web-chat-design.md
└── src/
    ├── api/        greenApi.ts, types.ts
    ├── store/      ChatContext.tsx, reducer.ts, actions.ts, types.ts
    ├── hooks/      usePolling.ts, usePersistentState.ts
    ├── components/ LoginScreen.tsx, Sidebar.tsx, ChatList.tsx, NewChatForm.tsx,
    │               ChatWindow.tsx, ChatHeader.tsx, MessageList.tsx,
    │               MessageBubble.tsx, MessageComposer.tsx, ConnectionStatus.tsx
    ├── styles/     *.module.css
    ├── App.tsx
    └── main.tsx
```

- **Docker:** multi-stage `node:20-alpine` (сборка) → `nginx:alpine` (раздача `dist`).
  `nginx.conf` с SPA-fallback (`try_files $uri /index.html`) и кэшем статики.
  Запуск: `docker build -t max-web-chat . && docker run -p 8080:80 max-web-chat`.
- **Репозиторий:** `git init` в текущей папке, remote
  `https://github.com/Raviil-IV/max-web-chat`, `.gitignore` (node_modules, dist,
  .env, IDE), README с описанием и сценарием работы.

## 10. Вне рамок (YAGNI)

- Медиа, файлы, геолокация, контакты, опросы, реакции — только текст.
- Групповые чаты, аватары, журналы, статусы.
- Собственный бэкенд и webhook-приём.
- Мультиязычность, авторизация на стороне приложения.

## 11. Открытый вопрос

- **Формат `chatId` для MAX.** В документации примеры (`79991234567@c.us`) —
  WhatsApp-стиль, при этом FAQ MAX указывает, что отправка идёт по `chatId`,
  получаемому методом `CheckAccount`. Точный формат `chatId` для MAX нужно
  подтвердить на живом инстансе в начале реализации; при необходимости добавить
  нормализацию номера перед запросом.
