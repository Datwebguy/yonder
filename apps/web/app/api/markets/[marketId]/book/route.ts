import { NextResponse } from "next/server";
import { fetchBook, getMarket } from "@/lib/dreamdex";

export async function GET(request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  try {
    const { marketId } = await params;
    const market = await getMarket(marketId);
    const outcome = new URL(request.url).searchParams.get("outcome") === "NO" ? "NO" : "YES";
    return NextResponse.json(await fetchBook(market, outcome), { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Order book unavailable." }, { status: 502 });
  }
}
