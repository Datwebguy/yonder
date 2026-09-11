"use client";

import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { SHANNON_CHAIN_ID } from "@/lib/chain";
import { placeIocBuy, quoteTicket } from "@/lib/dreamdex";
import { countdown, formatPrice } from "@/lib/sizing";
import type { TicketQuote, YonderMarket } from "@/lib/types";
import { WalletButton } from "./WalletButton";

const ENTRY_CUTOFF_SECONDS = 20;

export function Ticket({ market, onSuccess }: { market: YonderMarket; onSuccess: (result: { side: "Up" | "Down"; size: number; price: number; txHash: string; fills: unknown[] }) => void }) {
  const { address, chainId, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [side, setSide] = useState<"Up" | "Down">("Up");
  const [maxLoss, setMaxLoss] = useState("1");
  const [quote, setQuote] = useState<TicketQuote>({ size: 0, price: 0, risk: 0, disabledReason: "Enter a max loss" });
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const secondsLeft = Math.max(0, Math.floor(market.expiry - Date.now() / 1000));

  useEffect(() => {
    let active = true;
    const value = Number(maxLoss);
    void quoteTicket(market, side, value).then((next) => { if (active) setQuote(next); }).catch(() => { if (active) setQuote({ size: 0, price: 0, risk: value, disabledReason: "No ask" }); });
    return () => { active = false; };
  }, [market, side, maxLoss]);

  const reason = market.status !== 1 ? market.status === 2 || market.status === 3 ? "Locked" : "Final" : secondsLeft < ENTRY_CUTOFF_SECONDS ? `T-${ENTRY_CUTOFF_SECONDS}s` : chainId !== undefined && chainId !== SHANNON_CHAIN_ID ? "Wrong network" : quote.disabledReason;
  const disabled = Boolean(reason) || !isConnected || !walletClient || pending;
  const buy = async () => {
    if (!walletClient) return;
    setPending(true);
    setError("");
    try {
      const result = await placeIocBuy(market, side, Number(maxLoss), walletClient);
      if (!result.fills.length) setError("No fill. The IOC remainder cancelled.");
      onSuccess({ side, size: result.size, price: result.price, txHash: result.txHash, fills: result.fills });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Transaction cancelled");
    } finally {
      setPending(false);
    }
  };
  return <section className="ticket panel"><div className="panel-heading"><div><p className="eyebrow">Your ticket</p><h2>Take a side</h2></div><span className="ioc-label">IOC only</span></div><div className="side-toggle"><button className={side === "Up" ? "selected-up" : ""} onClick={() => setSide("Up")}>Up</button><button className={side === "Down" ? "selected-down" : ""} onClick={() => setSide("Down")}>Down</button></div><label className="field-label" htmlFor="max-loss">Max I can lose <span>tUSDC</span></label><div className="input-wrap"><input id="max-loss" inputMode="decimal" type="number" min="0" step="0.001" value={maxLoss} onChange={(event) => setMaxLoss(event.target.value)} /><span>tUSDC</span></div><div className="ticket-summary"><div><span>You buy roughly</span><strong>{quote.size ? `${quote.size.toFixed(3)} ${side}` : "n/a"}</strong></div><div><span>At</span><strong>{quote.price ? formatPrice(quote.price) : "n/a"}</strong></div><div><span>Risk</span><strong>{quote.risk ? `${quote.risk.toFixed(3)} tUSDC` : "n/a"}</strong></div></div>{isConnected ? <button className="button button-blue button-primary" disabled={disabled} onClick={buy}>{pending ? "Check wallet" : reason ?? `Buy ${side}`}</button> : <WalletButton required />}{error ? <p className="inline-error">{error}</p> : null}<p className="fine-print">A fill is the only seat. Unfilled IOC size cancels.</p></section>;
}
