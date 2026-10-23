export const brl = (n: number | string | { toString(): string }) =>
  Number(n.toString()).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dateTime = (d: Date) =>
  d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "medium", timeZone: "America/Sao_Paulo" });

export const dateOnly = (d: Date) => d.toLocaleDateString("pt-BR", { timeZone: "UTC" });

/** 1500 -> "1,5 s"; 90000 -> "1 min 30 s"; 4 h -> "4 h" */
export function duration(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1).replace(".", ",")} s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ${Math.round(s % 60)} s`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h} h ${m % 60} min`;
  return `${Math.floor(h / 24)} d ${h % 24} h`;
}
