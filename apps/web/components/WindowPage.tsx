"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { appendTape } from "@/lib/tape";
import { getMarket, listLiveMarkets, tapeRowFromFill } from "@/lib/dreamdex";
import type { TapeRow, YonderMarket } from "@/lib/types";
import { WindowNav } from "./Nav";
import { StatusChip } from "./StatusChip";
import { Scoreboard } from "./Scoreboard";
import { Ticket } from "./Ticket";
import { Tape } from "./Tape";
import { ShareButton } from "./ShareButton";
import { MarketOverview } from "./MarketOverview";
import { MarketPulse } from "./MarketPulse";

export function WindowPage({ marketId }: { marketId: string }) {
  const { address } = useAccount();
  const [market, setMarket] = useState<YonderMarket | null>(null);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [highlightId, setHighlightId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState<TapeRow[]>([]);
  const [rematch, setRematch] = useState<YonderMarket | null>(null);
  useEffect(() => { let active = true; const load = () => getMarket(marketId).then((next) => { if (active) setMarket(next); }).catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Could not load this window."); }); void load(); const timer = window.setInterval(load, 10000); return () => { active = false; window.clearInterval(timer); }; }, [marketId]);
  useEffect(() => { const timer = window.setInterval(() => setNow(Date.now()), 1000); return () => window.clearInterval(timer); }, []);
  useEffect(() => { if (market && market.status >= 4) void listLiveMarkets().then((markets) => setRematch(markets.find((item) => item.asset === market.asset && item.marketId !== market.marketId && item.status === 1) ?? null)).catch(() => undefined); }, [market]);
  if (!market) return <><WindowNav title="Yonder" /><main className="container window-main">{error ? <section className="not-found-state"><p className="eyebrow">Window unavailable</p><h1>We couldn’t find that market.</h1><p>{error}</p><Link className="button button-blue" href="/app">Back to live windows</Link></section> : <div className="empty-state">Loading the window from Shannon…</div>}</main></>;
  const title = `${market.asset} ${market.intervalLabel}`;
  const secondsLeft = Math.max(0, Math.floor(market.expiry - now / 1000));
  const onSuccess = (result: { side: "Up" | "Down"; size: number; price: number; txHash: string; fills: unknown[] }) => {
    if (!address || !result.txHash || !result.fills.length) { setRefreshKey((value) => value + 1); return; }
    const nextRows = result.fills.map((fill, index) => tapeRowFromFill(market.marketId, address, result.side, { ...(fill as Record<string, unknown>), decimals: market.decimals }, result.txHash, index));
    appendTape(market.marketId, nextRows);
    setRows(nextRows);
    setHighlightId(nextRows[0]?.id ?? "");
    setRefreshKey((value) => value + 1);
    window.setTimeout(() => document.querySelector(".tape-section")?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };
  return <div className="page-shell"><WindowNav title={title} /><main className="container window-main"><MarketOverview market={market} secondsLeft={secondsLeft} /><div className="window-grid"><div className="window-left"><Scoreboard market={market} /><MarketPulse market={market} /></div><div className="window-right">{market.status >= 4 ? <section className="final-card"><p className="eyebrow">The window is final</p><h2>Cash out in the locker.</h2><div className="final-actions"><Link className="button button-blue" href="/locker">Open locker</Link>{rematch ? <Link className="button button-secondary" href={`/m/${rematch.marketId}`}>Rematch {rematch.asset} {rematch.intervalLabel}</Link> : null}{rows[0] ? <ShareButton market={market} row={rows[0]} /> : null}</div></section> : <Ticket market={market} onSuccess={onSuccess} />}<Tape market={market} highlightId={highlightId} refreshKey={refreshKey} /></div></div></main></div>;
}
