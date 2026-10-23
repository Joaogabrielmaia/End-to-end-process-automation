import { describe, expect, it } from "vitest";
import { estimate } from "@/lib/estimate";

// Confere os números escritos em docs/02-definicao/07-processo-to-be.md
describe("estimativa de ganho (hipótese declarada)", () => {
  it("cenário base: 20% de revisão", () => {
    expect(estimate(0.2)).toEqual({ monthlyOrders: 1760, residualMinutesPerOrder: 0.8, hoursFreed: 211.2, value: 8025.6 });
  });
  it("cenário otimista: 10% de revisão", () => {
    const r = estimate(0.1);
    expect(r.hoursFreed).toBe(222.9);
    expect(r.value).toBe(8471.47);
  });
  it("cenário conservador: 35% de revisão", () => {
    const r = estimate(0.35);
    expect(r.hoursFreed).toBe(193.6);
    expect(r.value).toBe(7356.8);
  });
});
