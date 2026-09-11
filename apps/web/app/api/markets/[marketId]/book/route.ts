import { NextResponse } from "next/server";
import { fetchBook, getMarket } from "@/lib/dreamdex";

const MARKET_ID = /^0x[a-fA-F0-9]{64}$/;

export async function GET(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  try {
    const { marketId } = await params;
    if (!MARKET_ID.test(marketId)) return NextResponse.json({ error: "Market not found." }, { status: 404 });
    const market = await getMarket(marketId);
    const outcome = new URL(request.url).searchParams.get("outcome") === "NO" ? "NO" : "YES";
    return NextResponse.json(await fetchBook(market, outcome), { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Order book unavailable." }, { status: 502 });
  }
}
