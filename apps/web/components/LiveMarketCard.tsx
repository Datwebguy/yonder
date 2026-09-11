"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import type { BinaryBook, YonderMarket } from "@/lib/types";
import { countdown, formatPrice } from "@/lib/sizing";
import { fetchBook, preloadMarket } from "@/lib/dreamdex";
import { StatusChip } from "./StatusChip";

export function LiveMarketCard({ market }: { market: YonderMarket }) {
  const router = useRouter();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [book, setBook] = useState<BinaryBook>({ bids: [], asks: [] });
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [market]);
  useEffect(() => {
    const node = cardRef.current;
    if (!node) return;
    let active = true;
    const loadBook = () => { void fetchBook(market).then((nextBook) => { if (active) setBook(nextBook); }).catch(() => undefined); };
    if (!("IntersectionObserver" in window)) loadBook();
    else {
      const observer = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) { observer.disconnect(); loadBook(); } }, { rootMargin: "160px" });
      observer.observe(node);
      return () => { active = false; observer.disconnect(); };
    }
    return () => { active = false; };
  }, [market]);
  const bid = book.bids[0]?.price ?? 0;
  const ask = book.asks[0]?.price ?? 0;
  const mid = bid && ask ? (bid + ask) / 2 : bid || ask;
  const hasBook = book.bids.length > 0 || book.asks.length > 0;
  const warmRoute = () => { router.prefetch(`/m/${market.marketId}`); preloadMarket(market.marketId); };
  return <Link ref={cardRef} className="live-card" href={`/m/${market.marketId}`} prefetch={false} onPointerEnter={warmRoute} onFocus={warmRoute} onTouchStart={warmRoute} aria-busy={!hasBook}><div className="card-top"><span>{market.asset} <b>{market.intervalLabel}</b></span><span><StatusChip status={market.status} /> {countdown(market.expiry, now)}</span></div><div className="card-probability">{hasBook ? `${Math.round(mid * 100)}%` : "—"}<small> chance of Up</small></div><div className="split-bar"><span style={{ width: `${Math.max(0, Math.min(100, mid * 100))}%` }} /><i /></div><div className="card-bottom"><span><strong>Up</strong> {hasBook ? formatPrice(bid) : "—"}</span><span><strong>Down</strong> {hasBook ? formatPrice(ask ? 1 - ask : 0) : "—"}</span></div><div className="card-enter">Open window <span aria-hidden="true">↗</span></div></Link>;
}
