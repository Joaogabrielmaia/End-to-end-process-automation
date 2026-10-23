import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { ingestMessage } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

/** RF-01: simula a caixa de e-mail. Exige a chave configurada em INBOUND_API_KEY (RNF-06). */
export async function POST(req: Request) {
  const expected = process.env.INBOUND_API_KEY;
  if (!expected || req.headers.get("x-api-key") !== expected) {
    return NextResponse.json({ error: "Chave de API ausente ou inválida" }, { status: 401 });
  }
  try {
    const body = await req.json().catch(() => null);
    const result = await ingestMessage(body);
    return NextResponse.json(result, { status: result.status === "duplicate" ? 200 : 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
