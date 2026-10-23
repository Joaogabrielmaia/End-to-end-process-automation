import { SimulatedNotifier } from "./simulated";
import type { Notifier, NotificationMessage } from "./types";

/** Envia POST JSON para uma URL configurada e também guarda no histórico local. */
export class WebhookNotifier implements Notifier {
  readonly name = "webhook";
  private readonly history = new SimulatedNotifier();

  constructor(
    private readonly url: string,
    private readonly fetchImpl: typeof fetch = fetch,
  ) {}

  async send(message: NotificationMessage): Promise<void> {
    await this.history.send(message);
    const res = await this.fetchImpl(this.url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text: `${message.subject}\n${message.body}`, ...message }),
    });
    if (!res.ok) throw new Error(`Webhook respondeu ${res.status}`);
  }
}
