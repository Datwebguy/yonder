import type { Metadata } from "next";
import { WindowPage } from "@/components/WindowPage";

export const metadata: Metadata = {
  title: "Yonder window - The next window.",
  description: "Pick Up or Down on a live DreamDEX Event Contract. No fill, no seat.",
  openGraph: { title: "Yonder window - The next window.", description: "No fill, no seat.", type: "website" },
};

export default async function Page({ params }: { params: Promise<{ marketId: string }> }) {
  const { marketId } = await params;
  return <WindowPage marketId={decodeURIComponent(marketId)} />;
}
