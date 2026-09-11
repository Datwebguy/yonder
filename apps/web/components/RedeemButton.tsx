"use client";

import { useState } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { explorerTxUrl } from "@/lib/chain";
import { redeemPosition } from "@/lib/dreamdex";
import type { YonderMarket } from "@/lib/types";
import { WalletButton } from "./WalletButton";

export function RedeemButton({ market, amount, outcomeIdx, onRedeemed }: { market: YonderMarket; amount: bigint; outcomeIdx: 0 | 1; onRedeemed?: (hash: string) => void }) {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [pending, setPending] = useState(false);
  const [hash, setHash] = useState("");
  const [error, setError] = useState("");
  if (!isConnected || !walletClient) return <WalletButton required />;
  return <div><button className="button button-blue button-primary" disabled={pending || amount <= 0n} onClick={async () => { setPending(true); setError(""); try { const result = await redeemPosition({ marketId: market.marketId, amount, outcomeIdx, walletClient }); const nextHash = String(result.receipt?.transactionHash ?? result.hash ?? ""); setHash(nextHash); onRedeemed?.(nextHash); } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not redeem"); } finally { setPending(false); } }}>{pending ? "Check wallet…" : "Cash out"}</button>{hash ? <a className="tx-link" href={explorerTxUrl(hash)} target="_blank" rel="noreferrer">View receipt ↗</a> : null}{error ? <p className="inline-error">{error}</p> : null}</div>;
}
