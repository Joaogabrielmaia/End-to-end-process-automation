import { NextResponse } from "next/server";
import { z } from "zod";
import { errorResponse } from "@/lib/http";
import { createNotifier } from "@/lib/notify";

export const dynamic = "force-dynamic";

const schema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().max(2000).default(""),
  recipient: z.string().max(80).default("#alertas-de-integracao"),
});

/** Usado pelo n8n para avisar a equipe de problemas de integração. Exige a mesma chave do /api/inbound. */
export async function POST(req: Request) {
  if (!process.env.INBOUND_API_KEY || req.headers.get("x-api-key") !== process.env.INBOUND_API_KEY) {
    return NextResponse.json({ error: "Chave de API ausente ou inválida" }, { status: 401 });
  }
  try {
    const data = schema.parse(await req.json().catch(() => null));
    await createNotifier().send({ channel: "integracao", ...data });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
