import { EXCEPTION_LABELS, type ExceptionCode } from "@/lib/types";

export function StatusBadge({ status }: { status: "REGISTERED" | "EXCEPTION" | "OPEN" | "RESOLVED" }) {
  const map = {
    REGISTERED: ["ok", "Registrado"],
    EXCEPTION: ["warn", "Em exceção"],
    OPEN: ["warn", "Aberta"],
    RESOLVED: ["ok", "Resolvida"],
  } as const;
  const [cls, label] = map[status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export function ReasonChip({ code }: { code: ExceptionCode }) {
  return <span className="badge bad">{EXCEPTION_LABELS[code]}</span>;
}

export function Kpi({ label, value, hint, id }: { label: string; value: string; hint?: string; id?: string }) {
  return (
    <div className="card kpi" data-testid={id}>
      <div className="label">{label}</div>
      <div className="value">{value}</div>
      {hint ? <div className="hint">{hint}</div> : null}
    </div>
  );
}

export function Bars({ rows, tone }: { rows: { label: string; value: number }[]; tone?: "warn" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (rows.length === 0) return <p className="muted">Sem dados ainda.</p>;
  return (
    <div>
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className={`bar ${tone ?? ""}`} aria-hidden="true">
            <span style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <strong className="num">{r.value}</strong>
        </div>
      ))}
    </div>
  );
}
