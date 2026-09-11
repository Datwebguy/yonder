import type { TapeRow } from "./types";

export function tapeStorageKey(marketId: string) {
  return `yonder:tape:${marketId}`;
}

export function loadTape(marketId: string): TapeRow[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(tapeStorageKey(marketId));
    return raw ? (JSON.parse(raw) as TapeRow[]) : [];
  } catch {
    return [];
  }
}

export function saveTape(marketId: string, rows: TapeRow[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(tapeStorageKey(marketId), JSON.stringify(rows));
}

export function appendTape(marketId: string, rows: TapeRow[]) {
  if (typeof window === "undefined" || rows.length === 0) return;
  const current = loadTape(marketId);
  saveTape(marketId, [...rows, ...current]);
}

export function settleTape(rows: TapeRow[], market: { status: number; winningOutcome: number | null; isVoided: boolean }) {
  if (market.status < 4 || (!market.isVoided && market.winningOutcome == null)) return rows;
  return rows.map((row) => {
    const outcome: TapeRow["outcome"] = market.isVoided || row.side === (market.winningOutcome === 0 ? "Up" : "Down") ? "won" : "lost";
    return { ...row, outcome };
  });
}
