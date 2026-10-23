import { SimulatedNotifier } from "./simulated";
import { WebhookNotifier } from "./webhook";
import type { Notifier } from "./types";

export * from "./types";
export { SimulatedNotifier, WebhookNotifier };

export function createNotifier(env: NodeJS.ProcessEnv = process.env): Notifier {
  if (env.NOTIFIER === "webhook" && env.NOTIFY_WEBHOOK_URL) return new WebhookNotifier(env.NOTIFY_WEBHOOK_URL);
  return new SimulatedNotifier();
}
