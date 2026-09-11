import type { Metadata } from "next";
import { WindowPage } from "@/components/WindowPage";
import { getMarket } from "@/lib/dreamdex";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ marketId: string }> }): Promise<Metadata> {
  const { marketId } = await params;
  try {
    const market = await getMarket(decodeURIComponent(marketId));
    const title = `${market.asset} ${market.intervalLabel} · Yonder`;
    const description = `${market.asset} ${market.intervalLabel} Event Contract. Pick Up or Down. No fill, no seat.`;
    return { title, description, openGraph: { title, description, type: "website", images: [`/m/${market.marketId}/opengraph-image`] } };
  } catch {
    return { title: "Yonder window · The next window.", description: "Pick Up or Down on a live DreamDEX Event Contract." };
  }
}

export default async function Page({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  return <WindowPage marketId={decodeURIComponent(marketId)} />;
}
