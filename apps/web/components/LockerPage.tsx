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

function positionStatus(market: YonderMarket) {
  return market.status === 1 ? "Live" : "Locked";
}

export function LockerPage() {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [claims, setClaims] = useState<ClaimWithMarket[]>([]);
  const [positions, setPositions] = useState<PositionWithMarket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [allHash, setAllHash] = useState("");
  const [claimedHashes, setClaimedHashes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!address) {
      setClaims([]);
      setPositions([]);
      return;
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

  const claimable = claims.filter(({ claim }) => BigInt(String(claim.amount)) > 0n);
  const openPositions = positions.filter(({ market, position }) => market.status < 4 && BigInt(String(position.balance ?? 0)) > 0n);

  const redeemAllNow = async () => {
    if (!walletClient || !claimable.length) return;
    setLoading(true);
    setError("");
    try {
      const result = await redeemAll(claimable.map(({ claim }) => claim), walletClient);
      setAllHash(String(result.receipt?.transactionHash ?? result.hash ?? ""));
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
          <p className="eyebrow">Claim your seats</p>
          <h1>Locker</h1>
          <p className="hero-copy">Winning shares do not arrive automatically. Redeem them here.</p>
        </div>

        {!isConnected ? <div className="empty-state">Connect on Shannon to see your positions.</div> : loading && !claims.length && !positions.length ? <div className="empty-state">Checking the locker…</div> : error ? <p className="inline-error">{error}</p> : (
          <>
            {claimable.length ? <section className="locker-section"><div className="section-heading"><h2>Claimable</h2><span className="tape-note">redeem</span></div><div className="locker-list">{claimable.map(({ claim, market }) => {
              const amount = BigInt(String(claim.amount));
              const claimKey = `${claim.marketId}-${claim.outcomeIdx}`;
              const row: TapeRow = { id: `claim-${claimKey}`, marketId: market.marketId, wallet: address ?? "", side: Number(claim.outcomeIdx) === 0 ? "Up" : "Down", size: Number(formatUnits(amount, market.decimals)), price: 1, timestamp: Date.now(), txHash: claimedHashes[claimKey] ?? "", outcome: "won" };
              const claimedHash = claimedHashes[claimKey];
              return <article className="locker-row" key={claimKey}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{row.side} · {row.size.toFixed(3)} shares</div></div><span className="status-chip status-4">Claimable</span></div><div className="locker-row-bottom"><RedeemButton market={market} amount={amount} outcomeIdx={Number(claim.outcomeIdx) as 0 | 1} onRedeemed={(hash) => setClaimedHashes((current) => ({ ...current, [claimKey]: hash }))} />{claimedHash ? <span className="locker-share"><ShareButton market={market} row={row} label="Share" /></span> : null}</div></article>;
            })}</div></section> : null}

            {openPositions.length ? <section className="locker-section"><div className="section-heading"><h2>Held</h2><span className="tape-note">live + locked</span></div><div className="locker-list">{openPositions.map(({ position, market }) => <article className="locker-row" key={`${market.marketId}-${position.outcomeIndex}`}><div className="locker-row-top"><div><strong>{market.asset} · {market.intervalLabel}</strong><div className="fine-print">{Number(position.outcomeIndex) === 0 ? "Up" : "Down"} · {Number(formatUnits(BigInt(String(position.balance)), market.decimals)).toFixed(3)} shares</div></div><span className={`status-chip status-${market.status}`}>{positionStatus(market)}</span></div></article>)}</div></section> : null}

            {!claimable.length && !openPositions.length ? <div className="empty-state">Nothing to claim. <Link className="tx-link" href="/app">Open a window</Link></div> : null}
          </>
        )}
        {allHash ? <a className="tx-link" href={explorerTxUrl(allHash)} target="_blank" rel="noreferrer">View redeem-all receipt ↗</a> : null}
      </main>
      {claimable.length && walletClient ? <div className="redeem-all"><button className="button button-blue" disabled={loading} onClick={redeemAllNow}>{loading ? "Check wallet…" : `Redeem all · ${claimable.length}`}</button></div> : null}
    </div>
  );
}
