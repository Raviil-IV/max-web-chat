# MAX Чат — рескин в стиле Telegram Desktop (тёмная тема) + эмодзи

**Цель:** привести интерфейс к виду Telegram Desktop (тёмная тема), сохранив весь функционал: создание чата по номеру, отправка сообщений, счётчик символов, выход. Добавить выбор и вставку эмодзи.

**Стек:** Vite + React + TypeScript, CSS Modules. Без новых рантайм-зависимостей.

**Вне области:** вложения (файлы/фото) — отдельная итерация. Только текстовые сообщения.

## Global Constraints

Binding requirements for every task. Reviewers copy from here verbatim.

- **Цветовые токены темы** задаются в `src/styles/globals.css` как CSS-переменные на `:root`:
  - `--bg-sidebar: #17212b`
  - `--bg-chat: #0e1621`
  - `--bubble-in: #182533`
  - `--bubble-out: #2b5278`
  - `--text: #ffffff`
  - `--text-muted: #7f91a4`
  - `--accent: #3390ec`
  - производные (имена обязательны): `--bg-hover: #202b36`, `--bg-active: #2b5278`, `--bg-header: #17212b`, `--bg-input: #242f3d`, `--divider: #101921`, `--accent-hover: #2b7fd4`, `--bubble-out-text: #ffffff`.
- **Шрифт:** `Inter, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`. Inter подключается в `index.html` через Google Fonts (`<link rel="preconnect">` + `<link rel="stylesheet">`), с системным fallback если сети нет.
- `color-scheme: dark`. `body { background: var(--bg-chat); }`.
- **Layout:** двухпанельный flex: сайдбар фиксированной ширины **400px** (фон `var(--bg-sidebar)`), область чата растягивается (фон `var(--bg-chat)`).
- **Поля ввода:** фон `var(--bg-input)`, скругление pill для поля поиска.
- **Пузыри:** входящие — слева, фон `var(--bubble-in)`; исходящие — справа, фон `var(--bubble-out)`, текст `var(--bubble-out-text)`. Время и статус — внутри пузыря снизу-справа.
- **Акцент:** активный чат / бейдж непрочитанных / кнопка отправки — `var(--accent)`.
- **Сохраняемые доступные имена и тексты (нельзя менять — на них опираются тесты):**
  - placeholder поля сообщения: содержит «сообщение» (текущий: `"Введите сообщение"`);
  - кнопка отправки: доступное имя `"Отправить"`;
  - поле нового чата: placeholder содержит «номер» (текущий: `"Введите номер телефона"`), aria-label `"Номер телефона"`;
  - кнопка создания чата: имя содержит «Создать»;
  - LoginScreen: метки `idInstance`, `apiTokenInstance`; кнопка `/Войти/i`, в процессе — `/Подключение/i`; заголовок `"MAX Чат"`; подзаголовок `"Введите данные инстанса GREEN-API"`; ошибка в роли `alert`;
  - ChatWindow (нет активного чата): текст `"Выберите чат или создайте новый"`.
- **Лимит сообщения:** 4000 символов, счётчик `{len}/4000` сохраняется (класс «over» при превышении).
- **Без новых рантайм-зависимостей** (`dependencies` в `package.json` не меняется).
- **Стиль кода:** существующий паттерн CSS Modules (`*.module.css`), функции-компоненты, комментарии по-русски где поясняют намерение.
- **Ворота качества:** `npm test` — все тесты зелёные, вывод без warning-шума; `npm run build` — проходит (`tsc -b` + `tsc --noEmit` + `vite build`). Каждый таск коммитится отдельно.

## Task 1: Фундамент темы, общие утилиты, Avatar, данные эмодзи

**Цель:** завести токены темы, шрифт, общие утилиты времени, переиспользуемый аватар и набор эмодзи — фундамент для остальных задач.

**Файлы (создать/изменить):**
- `src/styles/globals.css` — изменить
- `index.html` — изменить
- `src/lib/time.ts` — создать
- `src/lib/time.test.ts` — создать
- `src/lib/emojis.ts` — создать
- `src/components/Avatar.tsx` — создать
- `src/components/Avatar.module.css` — создать

**Требования:**
1. `src/styles/globals.css`: объявить все токены из Global Constraints на `:root`; `color-scheme: dark`; `font-family` с Inter; `body { background: var(--bg-chat); color: var(--text); }`. Сохранить `* { box-sizing: border-box; }` и `html, body, #root { height: 100%; margin: 0; }`.
2. `index.html`: добавить `<link rel="preconnect" href="https://fonts.googleapis.com">`, `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>` и `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">`. Прочие теги не трогать.
3. `src/lib/time.ts` — экспортировать (TDD, покрыть тестами):
   - `formatTime(timestamp: number): string` — локальное `HH:MM` (`ru-RU`, `hour`/`minute`, `2-digit`).
   - `isSameDay(a: number, b: number): boolean` — совпадают ли календарные даты (локально).
   - `formatDateLabel(timestamp: number, now?: number): string` — `"Сегодня"`, если тот же день, что `now` (по умолчанию `Date.now()`); `"Вчера"`, если предыдущий день; иначе — `d MMMM` (`ru-RU`, например «5 октября»), а если год отличается — `d MMMM yyyy`.
   - `formatListTime(timestamp: number, now?: number): string` — если тот же день что `now`: `formatTime`; иначе `formatDateLabel`.
4. `src/lib/time.test.ts` — тесты на все функции с фиксированными timestamp и явным `now` (не полагаться на «сегодня»), включая границу «вчера» и смену года.
5. `src/lib/emojis.ts` — экспортировать `EMOJI_GROUPS: { name: string; emojis: string[] }[]` — не менее 100 эмодзи, разбитых на группы (минимум: «Смайлы», «Жесты», «Праздник»/«Символы», «Животные», «Еда», «Объекты»). Только строки-эмодзи, без зависимостей.
6. `src/components/Avatar.tsx`:
   - props: `{ name: string; size?: number; className?: string }`, `size` по умолчанию `48`.
   - инициалы: `name.replace(/\D/g, "").slice(-2) || name.slice(0, 2).toUpperCase() || "?"` (телефонные чаты показывают последние 2 цифры — как сейчас; не-цифровые — первые 2 буквы).
   - детерминированный фон из палитры по хэшу строки `name`; текст белый, круг, `aria-hidden`.
7. `Avatar.module.css` — стили круга, центрирование, размер через inline-переменную `--avatar-size`.

**Тесты:** `src/lib/time.test.ts` обязателен, TDD (сначала падающий тест). Компонент `Avatar` — простой, отдельный тест не требуется (покрывается косвенно).

**Готово, когда:** `npm test` зелёный, `npm run build` проходит.

## Task 2: Сайдбар и оболочка приложения

**Цель:** привести левую панель к виду Telegram: поиск, шапка со статусом соединения и кнопкой выхода, список чатов с аватарами, превью последнего сообщения, временем и счётчиком непрочитанных.

**Зависит от:** Task 1 (`Avatar`, `time` утилиты, токены темы).

**Файлы (создать/изменить):**
- `src/components/App.tsx` — изменить
- `src/components/App.module.css` — изменить
- `src/components/Sidebar.tsx` — изменить
- `src/components/Sidebar.module.css` — изменить
- `src/components/ChatList.tsx` — изменить
- `src/components/ChatList.module.css` — изменить
- `src/components/NewChatForm.tsx` — изменить
- `src/components/NewChatForm.module.css` — изменить
- `src/components/ConnectionStatus.tsx` — изменить
- `src/components/ConnectionStatus.module.css` — изменить
- `src/components/Sidebar.test.tsx` — дополнить

**Требования:**
1. `App.tsx`/`App.module.css`: убрать плавающую кнопку «Выйти» (она переезжает в шапку сайдбара). `App` рендерит `Sidebar` + `ChatWindow` в flex-контейнере (сайдбар 400px, чат `flex:1`, фон `var(--bg-chat)`).
2. `Sidebar.tsx`: структура сверху вниз — (а) шапка: строка поиска + `ConnectionStatus` + кнопка «Выйти» (из `useChat().logout`); (б) `NewChatForm`; (в) `ChatList`. Поиск — локальный `useState`, передаётся в `ChatList` пропом `query`.
3. `ChatList.tsx`: принимает `query?: string`. Фильтрует `state.chats` по вхождению `query` (регистронезависимо) в `name` или `phone`. Для каждого чата: `Avatar` (size 54), имя, превью последнего сообщения этого чата (последний элемент `state.messagesByChat[chat.id]`, обрезать до ~60 символов, для исходящих добавлять префикс `"Вы: "`), время `formatListTime(lastActivity)`, бейдж непрочитанных (`state.unread[id] > 0`) с фоном `var(--accent)`. Активный чат — фон `var(--bg-active)`, hover — `var(--bg-hover)`. Пустой список/пустой результат поиска — текст-заглушка.
4. `NewChatForm.tsx`: сохранить логику (`addChat`, ошибка в `role="alert"`, `busy`). Плейсхолдер оставить содержащим «номер», aria-label `"Номер телефона"`, кнопка с именем «Создать». Стили — под тёмную тему.
5. `ConnectionStatus.tsx`: сохранить метки (`idle/connecting/online/error` → «Не подключено»/«Подключение…»/«На связи»/«Переподключение…») и `data-status`; перекрасить точки под тему (online — акцент/зелёный, error — красный, idle — muted).
6. `Sidebar.test.tsx`: существующие три теста должны проходить; добавить тест фильтрации — при вводе запроса в поиск показывается только совпадающий чат (проверить через поле поиска, aria-label задать, например, `"Поиск"`).

**Тесты:** обновить/дополнить `Sidebar.test.tsx`. `npm test` и `npm run build` зелёные.

## Task 3: Область переписки и эмодзи-пикер

**Цель:** привести окно чата к виду Telegram: шапка с аватаром, лента с датами-разделителями, пузыри с заданными цветами, поле ввода с эмодзи-пикером.

**Зависит от:** Task 1 (`Avatar`, `time`, `EMOJI_GROUPS`, токены).

**Файлы (создать/изменить):**
- `src/components/ChatHeader.tsx` — изменить
- `src/components/ChatHeader.module.css` — изменить
- `src/components/ChatWindow.tsx` — изменить
- `src/components/ChatWindow.module.css` — изменить
- `src/components/MessageList.tsx` — изменить
- `src/components/MessageList.module.css` — изменить
- `src/components/MessageBubble.tsx` — изменить
- `src/components/MessageBubble.module.css` — изменить
- `src/components/MessageComposer.tsx` — изменить
- `src/components/MessageComposer.module.css` — изменить
- `src/components/EmojiPicker.tsx` — создать
- `src/components/EmojiPicker.module.css` — создать
- `src/components/ChatWindow.test.tsx` — дополнить
- `src/components/MessageComposer.test.tsx` — создать (эмодзи)

**Требования:**
1. `ChatHeader.tsx`: `Avatar` (size 42) + имя + подпись `"MAX"`; фон `var(--bg-header)`, нижняя граница `var(--divider)`.
2. `ChatWindow.tsx`: сохранить заглушку `"Выберите чат или создайте новый"`; логику `send`/`retry` и `disabled={sending}` не менять.
3. `MessageList.tsx`: перед первым сообщением и при смене календарного дня вставлять дату-разделитель (`formatDateLabel(message.timestamp)`). Разделитель — пилюля по центру, текст `var(--text-muted)`, фон полупрозрачный. Автоскролл к концу сохранить.
4. `MessageBubble.tsx`: цвета пузырей по Global Constraints; время `formatTime` и статус (⏳/✓/⚠) внутри пузыря снизу-справа; кнопка «Повторить» для `failed` сохраняется. Разные минимальные радиусы для «хвостика» не обязательны.
5. `MessageComposer.tsx`: строка: кнопка эмодзи (😊, `aria-label="Эмодзи"`, `aria-expanded`), `textarea` (placeholder содержит «сообщение», сохранён), кнопка отправки (доступное имя `"Отправить"`), счётчик `{len}/4000`. Логика: `Enter` отправляет, `Shift+Enter` — новая строка; пустое/превышение не отправляются.
6. `EmojiPicker.tsx`: props `{ onPick: (emoji: string) => void; onClose?: () => void }`. Рендерит `EMOJI_GROUPS` с подписями групп; клик по эмодзи вызывает `onPick(emoji)`. Панель поверх контента (absolute над полем ввода). Закрытие: `Esc` и клик вне панели.
7. Вставка эмодзи в composer — **в позицию курсора**: через `ref` на `textarea` взять `selectionStart/selectionEnd`, вставить символ, вернуть каретку после вставки, вернуть фокус в поле. После выбора панель закрывается.
8. `ChatWindow.test.tsx`: сохранить существующие 4 теста; добавить: сообщения с разными днями рендерят дату-разделитель; клик по эмодзи вставляет символ в поле ввода.
9. `MessageComposer.test.tsx`: тест вставки эмодзи в середину текста (курсор в позицию → клик по эмодзи → текст с эмодзи в нужном месте) и что `onSend` вызывается с текстом, содержащим эмодзи.

**Тесты:** TDD для эмодзи-вставки и дат-разделителей. `npm test` и `npm run build` зелёные.

## Task 4: Экран входа

**Цель:** перекрасить `LoginScreen` под тёмную тему, не меняя логику и доступные имена.

**Зависит от:** Task 1 (токены).

**Файлы (создать/изменить):**
- `src/components/LoginScreen.tsx` — изменить (в основном классы/разметка, логика без изменений)
- `src/components/LoginScreen.module.css` — изменить

**Требования:**
1. Логику (`login`, `busy`, ошибка, `onSuccess`) не менять.
2. Сохранить: заголовок `"MAX Чат"`, подзаголовок `"Введите данные инстанса GREEN-API"`, метки `idInstance`/`apiTokenInstance`, кнопку `/Войти/i` → `/Подключение/i` в процессе, ошибку в `role="alert"`.
3. Карточка по центру, фон `var(--bg-chat)`, карточка `var(--bg-sidebar)`, поля `var(--bg-input)`, кнопка `var(--accent)`. Шрифт Inter.

**Тесты:** `LoginScreen.test.tsx` должен проходить без изменений (если меняются селекторы — только в сторону сохранения текущих). `npm test` и `npm run build` зелёные.
