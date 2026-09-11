export type MarketStatus = 0 | 1 | 2 | 3 | 4 | 5;

export type YonderMarket = {
  marketId: `0x${string}`;
  asset: string;
  intervalSec: number;
  intervalLabel: string;
  question: string;
  tradingStart: number;
  expiry: number;
  poolAddress: `0x${string}`;
  marketAddress: `0x${string}`;
  decimals: number;
  yesSymbol: string;
  noSymbol: string;
  status: MarketStatus;
  winningOutcome: number | null;
  isVoided: boolean;
};

export type BookLevel = { price: number; amount: number };

export type BinaryBook = {
  bids: BookLevel[];
  asks: BookLevel[];
};

export type TapeRow = {
  id: string;
  marketId: string;
  wallet: string;
  side: "Up" | "Down";
  size: number;
  price: number;
  timestamp: number;
  txHash: string;
  outcome?: "won" | "lost";
};

export type TicketQuote = {
  size: number;
  price: number;
  risk: number;
  disabledReason?: string;
};
