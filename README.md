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
