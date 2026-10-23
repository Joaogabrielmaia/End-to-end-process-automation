import { describe, expect, it } from "vitest";
import { TransientError, withRetry } from "@/lib/retry";

const base = { attempts: 3, baseDelayMs: 100, sleep: async () => {} };

describe("withRetry (RN-12)", () => {
  it("repete falha transitória e devolve o sucesso", async () => {
    let calls = 0;
    const r = await withRetry(async () => {
      if (++calls < 3) throw new TransientError("x");
      return "ok";
    }, base);
    expect(r).toBe("ok");
    expect(calls).toBe(3);
  });

  it("não repete erro permanente", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls++;
        throw new Error("permanente");
      }, base),
    ).rejects.toThrow("permanente");
    expect(calls).toBe(1);
  });

  it("desiste após o número máximo de tentativas", async () => {
    let calls = 0;
    await expect(
      withRetry(async () => {
        calls++;
        throw new TransientError("sempre");
      }, base),
    ).rejects.toThrow("sempre");
    expect(calls).toBe(3);
  });

  it("espera de forma exponencial", async () => {
    const delays: number[] = [];
    const sleep = async (ms: number) => {
      delays.push(ms);
    };
    await expect(
      withRetry(async () => {
        throw new TransientError("x");
      }, { ...base, sleep }),
    ).rejects.toThrow();
    expect(delays).toEqual([100, 200]);
  });
});
