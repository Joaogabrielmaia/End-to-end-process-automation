import { describe, expect, it } from "vitest";
import { generateMessages, SCENARIO_WEIGHTS } from "@/lib/generator";

describe("gerador de pedidos de exemplo (RF-14)", () => {
  const now = new Date("2026-03-10T12:00:00Z");

  it("é reproduzível a partir da semente", () => {
    expect(generateMessages(50, 7, now)).toEqual(generateMessages(50, 7, now));
  });

  it("gera ids de mensagem únicos, exceto nos reenvios", () => {
    const msgs = generateMessages(300, 1, now);
    const fresh = msgs.filter((m) => m.scenario !== "resend").map((m) => m.payload.messageId);
    expect(new Set(fresh).size).toBe(fresh.length);
  });

  it("cobre os três formatos e todos os cenários em 500 mensagens", () => {
    const msgs = generateMessages(500, 42, now);
    expect(new Set(msgs.map((m) => m.scenario))).toEqual(new Set(Object.keys(SCENARIO_WEIGHTS)));
    expect(msgs.some((m) => m.payload.attachment)).toBe(true);
  });
});
