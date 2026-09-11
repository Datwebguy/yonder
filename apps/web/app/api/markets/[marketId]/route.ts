import { NextResponse } from "next/server";
import { getMarket } from "@/lib/dreamdex";

const MARKET_ID = /^0x[a-fA-F0-9]{64}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  try {
    const { marketId } = await params;
    if (!MARKET_ID.test(marketId)) return NextResponse.json({ error: "Market not found." }, { status: 404 });
    return NextResponse.json(await getMarket(marketId), { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Could not load this window." }, { status: 404 });
  }
}
