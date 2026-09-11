import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: "Yonder. The next window.",
  description: "A public room for one DreamDEX Event Contract window.",
  metadataBase: new URL("https://useyonder.vercel.app"),
  openGraph: {
    title: "Yonder. The next window.",
    description: "A public room for one DreamDEX Event Contract window.",
    type: "website",
    images: ["/opengraph-image"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
