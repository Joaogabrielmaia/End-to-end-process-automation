import { NextResponse } from "next/server";
import { z } from "zod";
import { generateMessages } from "@/lib/generator";
import { errorResponse } from "@/lib/http";
import { ingestMessage } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

const schema = z.object({ count: z.number().int().min(1).max(500), seed: z.number().int().optional() });

/** RF-14: gera pedidos de exemplo e os envia pelo mesmo pipeline do endpoint de entrada. */
export async function POST(req: Request) {
  try {
    const { count, seed } = schema.parse(await req.json());
    const messages = generateMessages(count, seed ?? Date.now() % 100000);
    const tally: Record<string, number> = {};
    let matches = 0;
    for (const m of messages) {
      const r = await ingestMessage(m.payload);
      const actual = r.status === "registered" ? "REGISTERED" : r.status === "duplicate" ? "DUPLICATE" : (r.reasons?.[0] ?? "ERROR");
      tally[actual] = (tally[actual] ?? 0) + 1;
      if (actual === m.expected) matches++;
    }
    return NextResponse.json({ sent: messages.length, outcomes: tally, matchedExpectation: matches });
  } catch (err) {
    return errorResponse(err);
  }
}
