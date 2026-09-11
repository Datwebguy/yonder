import type { Metadata } from "next";
import { LandingNav } from "@/components/Nav";
import { LiveMarketStrip } from "@/components/LiveMarketStrip";

export const metadata: Metadata = {
  title: "Live windows | Yonder",
  description: "Open a live DreamDEX Event Contract window on Yonder.",
};

export default function AppPage() {
  return <div className="page-shell"><LandingNav /><main className="container app-main"><LiveMarketStrip /></main></div>;
}
