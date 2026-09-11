"use client";

import { useEffect, useState } from "react";
import { fetchBook } from "@/lib/dreamdex";
import { formatPrice } from "@/lib/sizing";
import type { BinaryBook, YonderMarket } from "@/lib/types";

export function Scoreboard({ market }: { market: YonderMarket }) {
  const [book, setBook] = useState<BinaryBook>({ bids: [], asks: [] });
  const [showBook, setShowBook] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => fetchBook(market).then((next) => { if (active) setBook(next); }).catch(() => undefined);
    void load();
    const timer = window.setInterval(load, 5000);
    return () => { active = false; window.clearInterval(timer); };
  }, [market]);
  const bid = book.bids[0]?.price ?? 0;
  const ask = book.asks[0]?.price ?? 0;
  const mid = bid && ask ? (bid + ask) / 2 : bid || ask;
  return <section className="scoreboard panel"><div className="score-label">Probability of Up</div><div className="big-probability">{mid ? `${Math.round(mid * 100)}%` : "0%"}</div><div className="probability-line"><span style={{ width: `${Math.max(0, Math.min(100, mid * 100))}%` }} /></div><div className="score-quotes"><div><span>Up bid</span><strong>{formatPrice(bid)}</strong></div><div><span>Up ask</span><strong>{formatPrice(ask)}</strong></div><div><span>Spread</span><strong>{bid && ask ? formatPrice(ask - bid) : "n/a"}</strong></div></div><button className="book-toggle" onClick={() => setShowBook((value) => !value)}>{showBook ? "Hide book" : "Book"} <span>{showBook ? "−" : "+"}</span></button>{showBook ? <div className="book-grid"><div><p>Bids</p>{book.bids.slice(0, 5).map((level, index) => <div className="book-row" key={`bid-${index}`}><span>{level.amount.toFixed(3)}</span><strong>{level.price.toFixed(2)}</strong></div>)}</div><div><p>Asks</p>{book.asks.slice(0, 5).map((level, index) => <div className="book-row" key={`ask-${index}`}><span>{level.amount.toFixed(3)}</span><strong>{level.price.toFixed(2)}</strong></div>)}</div></div> : null}</section>;
}
