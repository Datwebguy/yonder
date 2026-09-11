"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { WalletButton } from "./WalletButton";

export function LandingNav() {
  return <nav className="nav nav-landing"><Link className="wordmark" href="/">Yonder</Link><div className="nav-actions"><Link className="nav-anchor" href="/app">Windows</Link><Link className="nav-anchor" href="/#how-it-works">How it works</Link><Link className="nav-anchor" href="/#faq">FAQ</Link><Link className="nav-anchor" href="/locker">Locker</Link><ThemeToggle /><WalletButton /></div></nav>;
}

export function WindowNav({ title }: { title: string }) {
  const router = useRouter();
  const goBack = () => {
    const referrer = typeof document !== "undefined" ? document.referrer : "";
    try {
      const previous = new URL(referrer);
      if (previous.origin === window.location.origin && (previous.pathname === "/app" || previous.pathname.startsWith("/m/"))) {
        router.back();
        return;
      }
    } catch {
      // Direct links have no safe history target.
    }
    router.push("/app");
  };
  return <nav className="nav nav-window"><button className="back-link back-button" onClick={goBack} aria-label="Back to live windows">‹ <span>Back</span></button><span className="nav-title">{title}</span><div className="nav-actions"><ThemeToggle /><WalletButton required /></div></nav>;
}
