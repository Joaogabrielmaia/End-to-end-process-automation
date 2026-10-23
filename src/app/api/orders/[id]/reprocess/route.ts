import { NextResponse } from "next/server";
import { errorResponse } from "@/lib/http";
import { reprocessOrder } from "@/lib/pipeline";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    return NextResponse.json(await reprocessOrder(id, body));
  } catch (err) {
    return errorResponse(err);
  }
}
