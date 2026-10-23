import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST } from "@/app/api/notify/route";
import { prisma } from "@/lib/db";

const KEY = "chave-de-teste";

const call = (body: unknown, key: string | null = KEY) =>
  POST(
    new Request("http://localhost/api/notify", {
      method: "POST",
      headers: { "content-type": "application/json", ...(key ? { "x-api-key": key } : {}) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  process.env.INBOUND_API_KEY = KEY;
  process.env.NOTIFIER = "simulated";
  await prisma.notification.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("/api/notify: alerta de falha de integração vindo do n8n", () => {
  it("grava a notificação no canal de integração com o destinatário padrão", async () => {
    const res = await call({ subject: "Fluxo indisponível", body: "e-mail <x@y.example> não entregue" });
    expect(res.status).toBe(201);
    const rows = await prisma.notification.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ channel: "integracao", recipient: "#alertas-de-integracao", subject: "Fluxo indisponível" });
  });

  it("rejeita chave ausente ou errada sem gravar nada", async () => {
    expect((await call({ subject: "x" }, null)).status).toBe(401);
    expect((await call({ subject: "x" }, "outra")).status).toBe(401);
    expect(await prisma.notification.count()).toBe(0);
  });

  it("rejeita quando a chave não está configurada no servidor", async () => {
    delete process.env.INBOUND_API_KEY;
    expect((await call({ subject: "x" }, "")).status).toBe(401);
  });

  it("valida o formato: assunto obrigatório e JSON legível", async () => {
    expect((await call({ body: "sem assunto" })).status).toBe(400);
    expect((await call("não é json")).status).toBe(400);
    expect(await prisma.notification.count()).toBe(0);
  });
});
