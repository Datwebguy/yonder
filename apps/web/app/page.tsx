import type { Metadata } from "next";
import { HomePage } from "@/components/HomePage";

export const metadata: Metadata = {
  title: "Yonder. The next window.",
  description: "A public page for a DreamDEX Event Contract window on Somnia Shannon.",
  openGraph: { title: "Yonder. The next window.", description: "No fill, no seat.", type: "website", images: ["/opengraph-image"] },
};

export default function Page() { return <HomePage />; }
