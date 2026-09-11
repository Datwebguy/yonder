import type { MarketStatus } from "@/lib/types";

const labels: Record<MarketStatus, string> = { 0: "Listed", 1: "Live", 2: "Locked", 3: "Settling", 4: "Final", 5: "Void" };

export function StatusChip({ status }: { status: MarketStatus }) {
  return <span className={`status-chip status-${status}`}>{labels[status]}</span>;
}
