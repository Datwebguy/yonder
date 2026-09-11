"use client";

import { useState } from "react";
import type { TapeRow, YonderMarket } from "@/lib/types";
import { shareFill, shareInputFromRow } from "@/lib/share";

export function ShareButton({ market, row, label = "Share on X" }: { market: YonderMarket; row: TapeRow; label?: string }) {
  const [busy, setBusy] = useState(false);
  return <button className="button button-secondary share-button" disabled={busy} onClick={async () => { setBusy(true); try { await shareFill(shareInputFromRow(market, row)); } finally { setBusy(false); } }}>{busy ? "Making card…" : label}</button>;
}
