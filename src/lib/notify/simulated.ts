import { prisma } from "../db";
import type { Notifier, NotificationMessage } from "./types";

/** Canal simulado: grava a mensagem em tabela e a exibe na tela "Notificações". Não prova entrega real. */
export class SimulatedNotifier implements Notifier {
  readonly name = "simulated";

  async send(message: NotificationMessage): Promise<void> {
    await prisma.notification.create({
      data: {
        channel: message.channel,
        recipient: message.recipient,
        subject: message.subject,
        body: message.body,
        orderId: message.orderId,
      },
    });
  }
}
