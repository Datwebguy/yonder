import { NextResponse } from "next/server";
import { getMarket } from "@/lib/dreamdex";

export async function GET(_request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  try {
    const { marketId } = await params;
    return NextResponse.json(await getMarket(marketId), { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Could not load this window." }, { status: 404 });
  }
}
