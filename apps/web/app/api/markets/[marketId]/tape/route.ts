import { NextResponse } from "next/server";
import { getMarket, listPublicTape } from "@/lib/dreamdex";

const MARKET_ID = /^0x[a-fA-F0-9]{64}$/;

export async function GET(_request: Request, { params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  if (!MARKET_ID.test(marketId)) return NextResponse.json({ error: "Invalid market id." }, { status: 400 });

  try {
    const market = await getMarket(marketId);
    return NextResponse.json(await listPublicTape(market), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Public fill tape unavailable." }, { status: 502 });
  }
}
