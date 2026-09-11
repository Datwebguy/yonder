"use client";

import type { YonderMarket } from "@/lib/types";
import { countdown } from "@/lib/sizing";
import { StatusChip } from "./StatusChip";

function formatExpiry(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(timestamp * 1000));
}

export function MarketOverview({ market, secondsLeft }: { market: YonderMarket; secondsLeft: number }) {
  const symbol = market.asset.trim().toUpperCase() || "—";
  const total = Math.max(1, market.expiry - market.tradingStart);
  const elapsed = Math.max(0, Math.min(total, Date.now() / 1000 - market.tradingStart));
  const progress = Math.round((elapsed / total) * 100);
  const remaining = secondsLeft > 0 ? countdown(market.expiry) : "00:00";
  return <section className="market-overview" aria-labelledby="market-overview-title">
    <div className="market-overview-header">
      <div className="market-identity">
        <div className="market-token-icon" aria-label={`${symbol} token`}>{symbol}</div>
        <div>
          <p className="market-kicker">Event Contract · Shannon</p>
          <h1 id="market-overview-title">{symbol}</h1>
          <p className="market-question">{market.question}</p>
        </div>
      </div>
      <div className="market-overview-status"><StatusChip status={market.status} /><strong className="market-countdown" aria-live="polite">{remaining}</strong></div>
    </div>
    <div className="market-tabs" aria-label="Market sections"><span className="is-active">Overview</span><span>Live book</span><span>Fill tape</span></div>
    <div className="market-context">
      <div className="market-context-heading"><div><p className="market-kicker">Market context</p><h2>One window. Two sides. One settlement.</h2></div><span>Prices come from the book.</span></div>
      <div className="market-timeline" aria-label={`${progress}% of the window elapsed`}><div className="market-timeline-labels"><span>Opened</span><span>{progress}% elapsed</span><span>Settles {formatExpiry(market.expiry)}</span></div><div className="market-timeline-track"><i style={{ width: `${progress}%` }} /></div></div>
      <div className="market-facts"><div><span>Asset</span><strong>{market.asset}</strong></div><div><span>Window</span><strong>{market.intervalLabel}</strong></div><div><span>Settlement</span><strong>{formatExpiry(market.expiry)}</strong></div></div>
    </div>
  </section>;
}
