/** Erro que a automação sabe que vale repetir (RN-12). */
export class TransientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TransientError";
  }
}

const TRANSIENT_PRISMA_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2024", "P2034"]);

export function isTransient(err: unknown): boolean {
  if (err instanceof TransientError) return true;
  const code = (err as { code?: string } | null)?.code;
  if (code && TRANSIENT_PRISMA_CODES.has(code)) return true;
  const msg = err instanceof Error ? err.message : String(err);
  // 40P01 = deadlock detectado pelo Postgres; 40001 = falha de serialização. Ambos valem uma nova tentativa.
  return /ECONNRESET|ETIMEDOUT|ECONNREFUSED|Connection terminated|deadlock detected|40P01|40001/i.test(msg);
}

export interface RetryOptions {
  attempts: number;
  baseDelayMs: number;
  sleep?: (ms: number) => Promise<void>;
  onRetry?: (attempt: number, err: unknown, delayMs: number) => void | Promise<void>;
  isTransient?: (err: unknown) => boolean;
}

const defaultSleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/** Repete `fn` apenas em falhas transitórias, com espera crescente (base, 2×base, 4×base...). */
export async function withRetry<T>(
  fn: (attempt: number) => Promise<T>,
  opts: RetryOptions,
): Promise<T> {
  const transient = opts.isTransient ?? isTransient;
  const sleep = opts.sleep ?? defaultSleep;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= opts.attempts; attempt++) {
    try {
      return await fn(attempt);
    } catch (err) {
      lastErr = err;
      if (!transient(err) || attempt === opts.attempts) throw err;
      const delay = opts.baseDelayMs * 2 ** (attempt - 1);
      await opts.onRetry?.(attempt, err, delay);
      await sleep(delay);
    }
  }
  throw lastErr;
}
