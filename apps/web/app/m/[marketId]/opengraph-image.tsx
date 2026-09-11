import { ImageResponse } from "next/og";
import { getMarket } from "@/lib/dreamdex";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  let asset = "Event Contract";
  let interval = "live window";
  try {
    const market = await getMarket(decodeURIComponent(marketId));
    asset = market.asset;
    interval = market.intervalLabel;
  } catch {
    // Keep the share image useful even while the indexer is catching up.
  }
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b57d0", color: "white", fontFamily: "Arial" }}>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>Yonder</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", fontSize: 26, opacity: 0.78 }}>THE NEXT WINDOW</div>
        <div style={{ display: "flex", fontSize: 94, fontWeight: 800, letterSpacing: -6 }}>{asset} · {interval}</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.84 }}>Pick Up or Down. Max loss is your stake.</div>
      </div>
      <div style={{ display: "flex", fontSize: 22, opacity: 0.78 }}>No fill, no seat.</div>
    </div>,
    { ...size },
  );
}
