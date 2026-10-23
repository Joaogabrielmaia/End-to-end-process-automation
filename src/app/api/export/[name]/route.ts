import { NextResponse } from "next/server";
import { buildCsv, EXPORTS, type ExportName } from "@/lib/export";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const clean = name.replace(/\.csv$/, "") as ExportName;
  if (!EXPORTS.includes(clean)) return NextResponse.json({ error: "Exportação desconhecida" }, { status: 404 });
  return new NextResponse(await buildCsv(clean), {
    headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="${clean}.csv"` },
  });
}
