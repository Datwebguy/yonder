"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchBook } from "@/lib/dreamdex";
import { formatPrice, formatProbability } from "@/lib/sizing";
import type { YonderMarket } from "@/lib/types";

type Sample = { time: number; value: number };

function midFromBook(book: { bids: { price: number }[]; asks: { price: number }[] }) {
  const bid = book.bids[0]?.price ?? 0;
  const ask = book.asks[0]?.price ?? 0;
  return bid && ask ? (bid + ask) / 2 : bid || ask;
}

export function MarketPulse({ market }: { market: YonderMarket }) {
  const [samples, setSamples] = useState<Sample[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const value = midFromBook(await fetchBook(market));
        if (!active || !value) return;
        setFailed(false);
        setSamples((current) => [...current, { time: Date.now(), value }].slice(-36));
      } catch {
        if (active) setFailed(true);
      }
    };
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [market]);

  const chart = useMemo(() => {
    if (!samples.length) return null;
    const values = samples.map((sample) => sample.value);
    const min = Math.max(0, Math.min(...values) - 0.02);
    const max = Math.min(1, Math.max(...values) + 0.02);
    const range = Math.max(0.04, max - min);
    const points = samples.map((sample, index) => {
      const x = samples.length === 1 ? 50 : (index / (samples.length - 1)) * 100;
      const y = 88 - ((sample.value - min) / range) * 72;
      return `${x},${Math.max(10, Math.min(90, y))}`;
    }).join(" ");
    const area = `0,100 ${points} 100,100`;
    return { points, area, min, max };
  }, [samples]);

  const latest = samples.at(-1)?.value ?? 0;
  return <section className="market-pulse panel" aria-labelledby="market-pulse-title">
    <div className="market-pulse-heading"><div><p className="market-kicker">Live book movement</p><h2 id="market-pulse-title">Probability over time</h2></div>{latest ? <strong>{formatProbability(latest)} Up</strong> : <span>{failed ? "Book unavailable" : "Waiting for book…"}</span>}</div>
    <p className="market-pulse-explainer">Each point is a live midpoint from the Up book. Higher means the market is pricing a greater chance of Up at settlement.</p>
    {chart ? <div className="market-pulse-chart"><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label={`Up probability moved from ${formatProbability(samples[0].value)} to ${formatProbability(latest)}`}><path className="market-pulse-grid" d="M0 20H100 M0 50H100 M0 80H100" /><polygon className="market-pulse-area" points={chart.area} /><polyline className="market-pulse-line" points={chart.points} /></svg><div className="market-pulse-axis"><span>{formatProbability(chart.min)}</span><span>{samples.length} live reads</span><span>{formatProbability(chart.max)}</span></div></div> : <div className="market-pulse-empty">The line starts when the live book returns a price.</div>}
  </section>;
}
