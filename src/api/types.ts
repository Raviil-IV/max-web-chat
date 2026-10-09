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
