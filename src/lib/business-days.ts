/** Todas as contas de data usam UTC e datas ISO (AAAA-MM-DD) para não depender do fuso da máquina. */

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function fromISODate(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function addDays(from: Date, days: number): Date {
  const d = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

/** Soma dias úteis (segunda a sexta). Feriados não são considerados (limitação assumida em RN-08). */
export function addBusinessDays(from: Date, days: number): Date {
  const d = addDays(from, 0);
  let left = days;
  while (left > 0) {
    d.setUTCDate(d.getUTCDate() + 1);
    const wd = d.getUTCDay();
    if (wd !== 0 && wd !== 6) left--;
  }
  return d;
}

function isValidDate(y: number, m: number, d: number): boolean {
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

/**
 * Lê o prazo citado no texto. Retorna a data ISO e o trecho que originou, ou nulo.
 * Aceita: dd/mm/aaaa, dd/mm, "amanhã", "hoje", "em N dias", "N dias úteis".
 */
export function parseDeadlineText(
  text: string,
  reference: Date,
): { iso: string; text: string } | null {
  const lower = text.toLowerCase();

  const full = /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/.exec(lower);
  if (full) {
    const [, d, m, y] = full;
    if (isValidDate(+y, +m, +d)) return { iso: `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`, text: full[0] };
    return { iso: "0000-00-00", text: full[0] };
  }

  const short = /\b(?:prazo|entrega|para|at[eé]|dia)\s*:?\s*(\d{1,2})\/(\d{1,2})\b/.exec(lower);
  if (short) {
    const d = +short[1];
    const m = +short[2];
    let y = reference.getUTCFullYear();
    if (isValidDate(y, m, d)) {
      const candidate = Date.UTC(y, m - 1, d);
      // Sem ano, uma data muito atrás da referência provavelmente é do ano seguinte.
      if (candidate < reference.getTime() - 30 * 86_400_000) y += 1;
      return {
        iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        text: short[0],
      };
    }
    return { iso: "0000-00-00", text: short[0] };
  }

  const bizDays = /\b(\d{1,2})\s+dias?\s+[uú]teis\b/.exec(lower);
  if (bizDays) return { iso: toISODate(addBusinessDays(reference, +bizDays[1])), text: bizDays[0] };

  const inDays = /\bem\s+(\d{1,2})\s+dias?\b/.exec(lower);
  if (inDays) return { iso: toISODate(addDays(reference, +inDays[1])), text: inDays[0] };

  // \b do JavaScript não trata "ã" como letra; por isso o lookaround explícito.
  if (/(?<![a-zà-ú])amanh[aã](?![a-zà-ú])/.test(lower)) return { iso: toISODate(addDays(reference, 1)), text: "amanhã" };
  if (/\bhoje\b/.test(lower)) return { iso: toISODate(addDays(reference, 0)), text: "hoje" };

  return null;
}
