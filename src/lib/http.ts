import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ConflictError, NotFoundError } from "./pipeline";

/** Converte erros conhecidos em respostas HTTP claras (mensagens em português). */
export function errorResponse(err: unknown) {
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Dados inválidos", issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })) },
      { status: 400 },
    );
  }
  if (err instanceof NotFoundError) return NextResponse.json({ error: err.message }, { status: 404 });
  if (err instanceof ConflictError) return NextResponse.json({ error: err.message }, { status: 409 });
  console.error(err);
  return NextResponse.json({ error: "Erro interno ao processar" }, { status: 500 });
}
