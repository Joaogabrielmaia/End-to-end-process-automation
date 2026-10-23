import { describe, expect, it } from "vitest";
import { addBusinessDays, parseDeadlineText, toISODate } from "@/lib/business-days";

const tue = new Date("2026-03-10T12:00:00Z");
const fri = new Date("2026-03-13T12:00:00Z");

describe("dias úteis (RN-08)", () => {
  it("terça + 2 dias úteis = quinta", () => expect(toISODate(addBusinessDays(tue, 2))).toBe("2026-03-12"));
  it("sexta + 2 dias úteis = terça (pula o fim de semana)", () => expect(toISODate(addBusinessDays(fri, 2))).toBe("2026-03-17"));
  it("0 dias úteis mantém a data", () => expect(toISODate(addBusinessDays(tue, 0))).toBe("2026-03-10"));
});

describe("parseDeadlineText", () => {
  it("dd/mm/aaaa", () => expect(parseDeadlineText("Entrega 20/03/2026", tue)?.iso).toBe("2026-03-20"));
  it("data inexistente vira sentinela inválida", () => expect(parseDeadlineText("prazo 31/02/2026", tue)?.iso).toBe("0000-00-00"));
  it("dd/mm sem ano usa o ano de referência", () => expect(parseDeadlineText("prazo: 25/03", tue)?.iso).toBe("2026-03-25"));
  it("dd/mm muito no passado vira o ano seguinte", () => expect(parseDeadlineText("prazo: 05/01", tue)?.iso).toBe("2027-01-05"));
  it("amanhã", () => expect(parseDeadlineText("preciso amanhã", tue)?.iso).toBe("2026-03-11"));
  it("em N dias", () => expect(parseDeadlineText("entrega em 3 dias", tue)?.iso).toBe("2026-03-13"));
  it("N dias úteis", () => expect(parseDeadlineText("em 3 dias úteis", fri)?.iso).toBe("2026-03-18"));
  it("sem prazo retorna nulo", () => expect(parseDeadlineText("sem nada", tue)).toBeNull());
});
