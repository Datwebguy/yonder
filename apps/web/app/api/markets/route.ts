import { NextResponse } from "next/server";
import { listLiveMarkets } from "@/lib/dreamdex";

export async function GET() {
  try {
    return NextResponse.json(await listLiveMarkets(), { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    return NextResponse.json({ error: reason instanceof Error ? reason.message : "Could not reach Shannon." }, { status: 502 });
  }
}
