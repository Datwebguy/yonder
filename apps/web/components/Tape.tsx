"use client";

import Link from "next/link";
import { useAccount } from "wagmi";
import { explorerTxUrl } from "@/lib/chain";
import { shortAddress } from "@/lib/sizing";
import { loadTape, saveTape, settleTape } from "@/lib/tape";
import type { TapeRow, YonderMarket } from "@/lib/types";
import { ShareButton } from "./ShareButton";
import { useEffect, useState } from "react";

export function Tape({ market, highlightId, refreshKey = 0 }: { market: YonderMarket; highlightId?: string; refreshKey?: number }) {
  const { address } = useAccount();
  const [rows, setRows] = useState<TapeRow[]>([]);
  useEffect(() => {
    const nextRows = settleTape(loadTape(market.marketId), market);
    setRows(nextRows);
    saveTape(market.marketId, nextRows);
  }, [market, refreshKey]);
  return <section className="tape-section"><div className="section-heading"><div><p className="eyebrow">Public fill tape</p><h2>Tape</h2></div><span className="tape-note">fills only</span></div>{rows.length ? <div className="tape-list">{rows.map((row) => <Link className={`tape-row ${row.id === highlightId ? "tape-highlight" : ""}`} key={row.id} href={explorerTxUrl(row.txHash)} target="_blank" rel="noreferrer"><div><span className="tape-wallet">{shortAddress(row.wallet)}</span><strong className={row.side === "Up" ? "up-text" : "down-text"}>{row.side}</strong></div><div><span>{row.size.toFixed(3)} @ {row.price.toFixed(2)}</span><small>{Math.max(0, Math.floor((Date.now() - row.timestamp) / 1000))}s · ↗</small></div>{address?.toLowerCase() === row.wallet.toLowerCase() ? <span onClick={(event) => event.preventDefault()}><ShareButton market={market} row={row} label="Share" /></span> : null}{row.outcome ? <em className={row.outcome === "won" ? "won" : "lost"}>{row.outcome}</em> : null}</Link>)}</div> : <div className="empty-state">No fills yet. A fill is the only seat.</div>}</section>;
}
