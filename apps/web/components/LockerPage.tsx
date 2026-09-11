"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import { explorerTxUrl } from "@/lib/chain";
import { listClaimable, listOpenPositions, redeemAll } from "@/lib/dreamdex";
import type { TapeRow, YonderMarket } from "@/lib/types";
import { WindowNav } from "./Nav";
import { RedeemButton } from "./RedeemButton";
import { ShareButton } from "./ShareButton";

type AnyRecord = Record<string, any>;
type ClaimWithMarket = { claim: AnyRecord; market: YonderMarket };
type PositionWithMarket = { position: AnyRecord; market: YonderMarket };
type RedeemedRecord = { claim: AnyRecord; market: YonderMarket; txHash: string };

function positionStatus(market: YonderMarket) {
  if (market.status === 1) return "Live";
  if (market.status === 2 || market.status === 3) return "Locked";
  return market.isVoided ? "Void" : "Final";
}

export function LockerPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [claims, setClaims] = useState<ClaimWithMarket[]>([]);
  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allHash, setAllHash] = useState("");
  const [redeemedRecords, setRedeemedRecords] = useState<RedeemedRecord[]>([]);

  const keyForClaim = (claim: AnyRecord) => `${String(claim.marketId).toLowerCase()}-${String(claim.outcomeIdx)}`;

  useEffect(() => {
    if (!address) {
      setClaims([]);
      setPositions([]);
      setRedeemedRecords([]);
      return;
    }
    try {
      const remembered = window.localStorage.getItem(`yonder:redeemed:${address.toLowerCase()}`);
      setRedeemedRecords(remembered ? JSON.parse(remembered) as RedeemedRecord[] : []);
    } catch {
      setRedeemedRecords([]);
    }
    setLoading(true);
    setError("");
    void Promise.all([listClaimable(address), listOpenPositions(address)])
      .then(([nextClaims, nextPositions]) => {
        setClaims(nextClaims as ClaimWithMarket[]);
        setPositions(nextPositions as PositionWithMarket[]);
      })
      .catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load the locker."))
      .finally(() => setLoading(false));
  }, [address]);

  const redeemedKeys = new Set(redeemedRecords.map(({ claim }) => keyForClaim(claim)));
  const claimable = claims.filter(({ claim }) => BigInt(String(claim.amount)) > 0n && !redeemedKeys.has(keyForClaim(claim)));
  const zeroClaims = claims.filter(({ claim }) => BigInt(String(claim.amount)) === 0n);
  const openPositions = positions.filter(({ market, position }) => market.status < 4 && BigInt(String(position.balance ?? 0)) > 0n);
  const claimableKeys = new Set(claimable.map(({ claim }) => keyForClaim(claim)));
  const settledLosses = positions.filter(({ market, position }) => {
    const amount = BigInt(String(position.balance ?? 0));
    const key = `${market.marketId}-${position.outcomeIndex}`;
    return market.status >= 4 && amount > 0n && !claimableKeys.has(key) && !market.isVoided && market.winningOutcome !== Number(position.outcomeIndex);
  });

  const rememberRedeemed = (records: RedeemedRecord[]) => {
    setRedeemedRecords((current) => {
      const next = new Map(current.map((record) => [keyForClaim(record.claim), record]));
      records.forEach((record) => next.set(keyForClaim(record.claim), record));
      const value = [...next.values()];
      try { if (address) window.localStorage.setItem(`yonder:redeemed:${address.toLowerCase()}`, JSON.stringify(value)); } catch { /* local storage is optional */ }
      return value;
    });
  };

  const redeemAllNow = async () => {
    if (!walletClient || !claimable.length) return;
    setLoading(true);
    setError("");
    try {
      const result = await redeemAll(claimable.map(({ claim }) => claim), walletClient);
      const txHash = String(result.receipt?.transactionHash ?? result.hash ?? "");
      setAllHash(txHash);
      rememberRedeemed(claimable.map(({ claim, market }) => ({ claim: { marketId: String(claim.marketId), outcomeIdx: Number(claim.outcomeIdx), amount: String(claim.amount) }, market, txHash })));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Could not redeem all.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-shell">
      <WindowNav title="Locker" />
      <main className="container locker-main">
        <div className="locker-header">
          <div className="locker-header-copy">
            <p className="eyebrow">Your positions</p>
            <h1>Locker</h1>
            <p className="hero-copy">Track every seat, cash out winners, and keep a record of every call.</p>
          </div>
          <div className="locker-overview" aria-label="Locker summary">
            <div className="locker-overview-top"><span>Portfolio on Shannon</span><span className="locker-wallet-dot" aria-hidden="true" /></div>
            <div className="locker-stat-grid">
              <div><strong>{claimable.length}</strong><span>Claimable</span></div>
              <div><strong>{settledLosses.length + zeroClaims.length}</strong><span>Settled</span></div>
              <div><strong>{openPositions.length}</strong><span>Held</span></div>
            </div>
          </div>
        </div>

        {!isConnected ? <div className="empty-state">Connect on Shannon to see your positions.</div> : loading && !claims.length && !positions.length ? <div className="empty-state">Checking the locker…</div> : error ? <p className="inline-error">{error}</p> : (
          <>
            {claimable.length ? <section className="locker-section locker-section-claimable"><div className="section-heading"><h2>Claimable</h2><span className="tape-note">{claimable.length} position{claimable.length === 1 ? "" : "s"}</span></div><div className="locker-list">{claimable.map(({ claim, market }) => {
              const amount = BigInt(String(claim.amount));
              const claimKey = keyForClaim(claim);
              const row: TapeRow = { id: `claim-${claimKey}`, marketId: market.marketId, wallet: address ?? "", side: Number(claim.outcomeIdx) === 0 ? "Up" : "Down", size: Number(formatUnits(amount, market.decimals)), price: 1, timestamp: Date.now(), txHash: "", outcome: "won" };
              return <article className="locker-row" key={claimKey}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{row.side} · {row.size.toFixed(3)} shares{market.isVoided ? " · void" : " · winner"}</div></div><span className="status-chip status-4">{market.isVoided ? "Void" : "Claimable"}</span></div><div className="locker-row-bottom"><RedeemButton market={market} amount={amount} outcomeIdx={Number(claim.outcomeIdx) as 0 | 1} onRedeemed={(hash) => rememberRedeemed([{ claim: { marketId: String(claim.marketId), outcomeIdx: Number(claim.outcomeIdx), amount: String(claim.amount) }, market, txHash: hash }])} /></div></article>;
            })}</div></section> : null}

            {redeemedRecords.length ? <section className="locker-section locker-section-claimed"><div className="section-heading"><h2>Claimed</h2><span className="tape-note">redeemed winners</span></div><div className="locker-list">{redeemedRecords.map(({ claim, market, txHash }) => { const amount = BigInt(String(claim.amount)); const row: TapeRow = { id: `claimed-${keyForClaim(claim)}`, marketId: market.marketId, wallet: address ?? "", side: Number(claim.outcomeIdx) === 0 ? "Up" : "Down", size: Number(formatUnits(amount, market.decimals)), price: 1, timestamp: Date.now(), txHash, outcome: "won" }; return <article className="locker-row" key={keyForClaim(claim)}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{row.side} · {row.size.toFixed(3)} shares · winner</div></div><span className="status-chip status-4">Claimed</span></div><div className="locker-row-bottom"><a className="tx-link" href={explorerTxUrl(txHash)} target="_blank" rel="noreferrer">View receipt ↗</a><ShareButton market={market} row={row} label="Share win on X" /></div></article>; })}</div></section> : null}

            {zeroClaims.length ? <section className="locker-section locker-section-settled"><div className="section-heading"><h2>Zero</h2><span className="tape-note">settled at 0</span></div><div className="locker-list">{zeroClaims.map(({ claim, market }) => { const row: TapeRow = { id: `zero-${claim.marketId}-${claim.outcomeIdx}`, marketId: market.marketId, wallet: address ?? "", side: Number(claim.outcomeIdx) === 0 ? "Up" : "Down", size: 0, price: 0, timestamp: Date.now(), txHash: "", outcome: "lost" }; return <article className="locker-row" key={`${claim.marketId}-${claim.outcomeIdx}`}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{row.side} · 0.000 shares redeemable</div></div><span className="status-chip status-5">{market.isVoided ? "Void" : "Zero"}</span></div><div className="locker-row-bottom"><p className="fine-print">This is a valid settlement result. There is nothing to redeem.</p><ShareButton market={market} row={row} /></div></article>; })}</div></section> : null}

            {settledLosses.length ? <section className="locker-section locker-section-settled"><div className="section-heading"><h2>Settled</h2><span className="tape-note">not a winning share</span></div><div className="locker-list">{settledLosses.map(({ market, position }) => { const row: TapeRow = { id: `lost-${market.marketId}-${position.outcomeIndex}`, marketId: market.marketId, wallet: address ?? "", side: Number(position.outcomeIndex) === 0 ? "Up" : "Down", size: Number(formatUnits(BigInt(String(position.balance)), market.decimals)), price: 0, timestamp: Date.now(), txHash: "", outcome: "lost" }; return <article className="locker-row" key={`${market.marketId}-${position.outcomeIndex}`}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{row.side} · {row.size.toFixed(3)} shares</div></div><span className="status-chip status-5">Lost</span></div><div className="locker-row-bottom"><p className="fine-print">This window settled on the other side. There is nothing to redeem.</p><ShareButton market={market} row={row} /></div></article>; })}</div></section> : null}

            {openPositions.length ? <section className="locker-section locker-section-held"><div className="section-heading"><h2>Held</h2><span className="tape-note">live + locked</span></div><div className="locker-list">{openPositions.map(({ position, market }) => <article className="locker-row" key={`${market.marketId}-${position.outcomeIndex}`}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{Number(position.outcomeIndex) === 0 ? "Up" : "Down"} · {Number(formatUnits(BigInt(String(position.balance)), market.decimals)).toFixed(3)} shares</div></div><span className={`status-chip status-${market.status}`}>{positionStatus(market)}</span></div></article>)}</div></section> : null}

            {!claimable.length && !redeemedRecords.length && !zeroClaims.length && !settledLosses.length && !openPositions.length ? <div className="empty-state">Nothing to claim. <Link className="tx-link" href="/app">Open a window</Link></div> : null}
          </>
        )}
        {allHash ? <a className="tx-link" href={explorerTxUrl(allHash)} target="_blank" rel="noreferrer">View redeem-all receipt ↗</a> : null}
      </main>
      {claimable.length && walletClient ? <div className="redeem-all"><button className="button button-blue" disabled={loading} onClick={redeemAllNow}>{loading ? "Check wallet…" : `Redeem all · ${claimable.length}`}</button></div> : null}
    </div>
  );
}
