export interface NotificationMessage {
  channel: string;
  recipient: string;
  subject: string;
  body: string;
  orderId?: string;
}

/** Canal de notificação trocável (ADR-007). */
export interface Notifier {
  readonly name: string;
  send(message: NotificationMessage): Promise<void>;
}
