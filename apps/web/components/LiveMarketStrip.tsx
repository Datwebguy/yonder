"use client";

import { useEffect, useState } from "react";
import { listLiveMarkets } from "@/lib/dreamdex";
import type { YonderMarket } from "@/lib/types";
import { LiveMarketCard } from "./LiveMarketCard";

export function LiveMarketStrip() {
  const [markets, setMarkets] = useState<YonderMarket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => listLiveMarkets().then((rows) => { if (active) { setMarkets(rows); setLoading(false); } }).catch((reason: unknown) => { if (active) { setLoading(false); setError(reason instanceof Error ? reason.message : "Could not reach Shannon."); } });
    void load();
    const timer = window.setInterval(load, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);
  return <section className="live-section" id="windows" aria-labelledby="windows-heading"><div className="section-heading"><div><h2 id="windows-heading">Live windows</h2><p className="section-lede">Prices come from the book.</p></div><span className="live-dot" role="status" aria-live="polite"><i aria-hidden="true" /> {markets.length ? `${markets.length} windows` : loading ? "Loading" : "No windows"}</span></div>{error ? <p className="inline-error" role="alert">{error}</p> : loading ? <div className="skeleton-grid live-loading-grid" aria-label="Loading live windows"><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /><div className="skeleton skeleton-card" /></div> : markets.length ? <><div className={`live-strip ${expanded ? "is-expanded" : ""}`}>{markets.map((market) => <LiveMarketCard key={market.marketId} market={market} />)}</div>{markets.length > 4 ? <button className="see-all-windows" type="button" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>{expanded ? "Show fewer windows" : `See all ${markets.length} windows`} <span aria-hidden="true">{expanded ? "↑" : "↓"}</span></button> : null}</> : <div className="empty-state">No live Event Contracts are available on Shannon right now.</div>}</section>;
}
