import type { WalletClient } from "viem";
import { fromHuman, toHuman } from "@somnia-chain/markets-sdk";
import type { BinaryBook, TapeRow, TicketQuote, YonderMarket } from "./types";

const INDEXER_URL = "https://dev.smk.somnia.host/v1/graphql";
const WS_RPC_URL = "wss://api.infra.testnet.somnia.network/ws";
const SDK_TIMEOUT_MS = 15_000;

type AnyRecord = Record<string, any>;
let exchangePromise: Promise<any> | undefined;
let marketsLoadedPromise: Promise<any> | undefined;
let liveMarketsRequest: Promise<YonderMarket[]> | undefined;
let liveMarketsCache: { value: YonderMarket[]; fetchedAt: number } | undefined;
const marketCache = new Map<string, { value: YonderMarket; fetchedAt: number }>();
const marketRequests = new Map<string, Promise<YonderMarket>>();

function withTimeout<T>(promise: Promise<T>, label: string, timeoutMs = SDK_TIMEOUT_MS) {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out. Check Shannon and try again.`)), timeoutMs);
    promise.then((value) => { clearTimeout(timer); resolve(value); }, (reason: unknown) => { clearTimeout(timer); reject(reason); });
  });
}

export async function getExchange() {
  if (!exchangePromise) {
    const request = (async () => {
      const sdk = await import("@somnia-chain/markets-sdk");
      const { somniaShannon } = await import("@somnia-chain/markets-sdk/chains");
      const exchange = new sdk.SomniaMarkets({
        indexerUrl: INDEXER_URL,
        chain: somniaShannon,
        wsRpcUrl: WS_RPC_URL,
        addresses: sdk.SOMNIA_TESTNET_ADDRESSES,
      });
      return exchange;
    })();
    exchangePromise = request.catch((reason: unknown) => { exchangePromise = undefined; throw reason; });
  }
  return exchangePromise;
}

async function ensureMarketsLoaded() {
  const exchange = await getExchange();
  if (!marketsLoadedPromise) {
    const request = withTimeout(exchange.loadMarkets(), "Shannon market registry");
    marketsLoadedPromise = request.catch((reason: unknown) => {
      marketsLoadedPromise = undefined;
      throw reason;
    });
  }
  await marketsLoadedPromise;
  return exchange;
}

export async function setExchangeSigner(walletClient?: WalletClient) {
  const exchange = await getExchange();
  exchange.setSigner(walletClient ? { walletClient } : {});
  return exchange;
}

export async function faucetTestUsdc(walletClient: WalletClient) {
  const exchange = await setExchangeSigner(walletClient);
  const trader = exchange.client.createTrader({ walletClient });
  return trader.faucet();
}

function numberValue(value: unknown, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function intervalLabel(seconds: number) {
  if (seconds === 900) return "15m";
  if (seconds === 3600) return "1h";
  if (seconds === 14400) return "4h";
  if (seconds === 86400) return "24h";
  return seconds >= 3600 ? `${Math.round(seconds / 3600)}h` : `${Math.round(seconds / 60)}m`;
}

function address(value: unknown) {
  return String(value ?? "0x0000000000000000000000000000000000000000") as `0x${string}`;
}

function canonicalSymbols(exchange: any, marketId: string, row: AnyRecord) {
  try {
    const tradable = exchange.market(marketId);
    return { yesSymbol: `${tradable.marketSymbol}#YES`, noSymbol: `${tradable.marketSymbol}#NO` };
  } catch {
    const base = String(row.symbol ?? row.marketSymbol ?? marketId);
    return { yesSymbol: base.endsWith("#YES") ? base : `${base}#YES`, noSymbol: base.endsWith("#NO") ? base : `${base}#NO` };
  }
}

function normalizeMarket(exchange: any, row: AnyRecord, onchain: AnyRecord): YonderMarket {
  const marketId = address(row.marketId ?? row.id);
  const tradingStart = numberValue(row.tradingStart, Math.max(0, numberValue(row.expiry) - numberValue(row.intervalSec, 900)));
  const expiry = numberValue(row.expiry, numberValue(onchain.expiry));
  const intervalSec = numberValue(row.intervalSec, Math.max(60, expiry - tradingStart));
  const symbols = canonicalSymbols(exchange, marketId, row);
  return {
    marketId,
    asset: String(row.asset ?? "Event"),
    intervalSec,
    intervalLabel: String(row.interval ?? intervalLabel(intervalSec)),
    question: String(row.question ?? "Up or Down at expiry"),
    tradingStart,
    expiry,
    poolAddress: address(onchain.pool ?? row.poolAddress),
    marketAddress: address(onchain.marketAddress ?? row.marketAddress),
    decimals: numberValue(onchain.decimals, 6),
    yesSymbol: symbols.yesSymbol,
    noSymbol: symbols.noSymbol,
    // Never infer that a market is tradable when the chain read is incomplete.
    // Status 0 is intentionally non-trading and keeps every write fail-closed.
    status: numberValue(onchain.status, 0) as YonderMarket["status"],
    winningOutcome: onchain.isResolved ? numberValue(onchain.winningOutcome) : row.winningOutcome == null ? null : numberValue(row.winningOutcome),
    isVoided: Boolean(onchain.isVoided ?? row.isVoided),
  };
}

export async function listLiveMarkets(): Promise<YonderMarket[]> {
  if (typeof window !== "undefined") {
    const response = await fetch("/api/markets", { cache: "no-store" });
    if (!response.ok) throw new Error((await response.text()) || "Could not reach Shannon.");
    return response.json() as Promise<YonderMarket[]>;
  }
  const now = Date.now();
  if (liveMarketsCache && now - liveMarketsCache.fetchedAt < 10_000) return liveMarketsCache.value;
  if (liveMarketsRequest) return liveMarketsRequest;
  liveMarketsRequest = (async () => {
    const exchange = await getExchange();
    const rows = (await withTimeout(exchange.client.listLiveBinaryMarkets(), "Live market list")) as AnyRecord[];
    const markets = await Promise.all(
      rows.map(async (row) => {
        const id = address(row.marketId ?? row.id);
        try {
          const onchain = await withTimeout(exchange.client.getMarketOnchain(id), "Market status") as AnyRecord;
          return normalizeMarket(exchange, row, onchain);
        } catch {
          return null;
        }
      }),
    );
    const value = markets.filter((market): market is YonderMarket => market !== null && market.status === 1);
    liveMarketsCache = { value, fetchedAt: Date.now() };
    return value;
  })();
  try {
    return await liveMarketsRequest;
  } finally {
    liveMarketsRequest = undefined;
  }
}

export async function getMarket(marketId: string): Promise<YonderMarket> {
  if (typeof window !== "undefined") {
    const response = await fetch(`/api/markets/${encodeURIComponent(marketId)}`, { cache: "no-store" });
    if (!response.ok) throw new Error((await response.text()) || "Could not load this window.");
    return response.json() as Promise<YonderMarket>;
  }
  const cached = marketCache.get(marketId);
  if (cached && Date.now() - cached.fetchedAt < 30_000) return cached.value;
  const existing = marketRequests.get(marketId);
  if (existing) return existing;
  const request = (async () => {
    const exchange = await getExchange();
    const [row, onchain] = await Promise.all([
      withTimeout(exchange.client.getBinaryMarket(marketId) as Promise<AnyRecord | null>, "Market details"),
      withTimeout(exchange.client.getMarketOnchain(marketId), "Market status") as Promise<AnyRecord>,
    ]);
    const value = normalizeMarket(exchange, row ?? { marketId }, onchain);
    marketCache.set(marketId, { value, fetchedAt: Date.now() });
    return value;
  })();
  marketRequests.set(marketId, request);
  try {
    return await request;
  } finally {
    marketRequests.delete(marketId);
  }
}

export function preloadMarket(marketId: string) {
  void getMarket(marketId).catch(() => undefined);
}

function normalizeLevel(level: unknown): { price: number; amount: number } | null {
  if (Array.isArray(level)) return { price: numberValue(level[0]), amount: numberValue(level[1]) };
  const item = level as AnyRecord;
  const price = numberValue(item?.price ?? item?.["0"]);
  const amount = numberValue(item?.amount ?? item?.quantity ?? item?.size ?? item?.["1"]);
  return price > 0 && amount > 0 ? { price, amount } : null;
}

export async function fetchBook(market: YonderMarket, outcome: "YES" | "NO" = "YES"): Promise<BinaryBook> {
  if (typeof window !== "undefined") {
    const response = await fetch(`/api/markets/${encodeURIComponent(market.marketId)}/book?outcome=${outcome}`, { cache: "no-store" });
    if (!response.ok) throw new Error((await response.text()) || "Order book unavailable.");
    return response.json() as Promise<BinaryBook>;
  }
  const exchange = await getExchange();
  const raw = await withTimeout(exchange.client.getBinaryOrderBook(market.poolAddress, { depth: 5, decimals: market.decimals }), "Order book") as AnyRecord;
  const levels = (items: unknown[]) => items.map((level) => {
    const item = level as AnyRecord;
    return { price: Number(toHuman(BigInt(String(item.price)), market.decimals)), amount: Number(toHuman(BigInt(String(item.quantity)), market.decimals)) };
  });
  const bids = levels((outcome === "YES" ? raw.yesBids : raw.noBids) ?? []) as BinaryBook["bids"];
  const asks = levels((outcome === "YES" ? raw.yesAsks : raw.noAsks) ?? []) as BinaryBook["asks"];
  return { bids, asks };
}

export async function listPublicTape(market: YonderMarket): Promise<TapeRow[]> {
  if (typeof window !== "undefined") {
    const response = await fetch(`/api/markets/${encodeURIComponent(market.marketId)}/tape`, { cache: "no-store" });
    if (!response.ok) throw new Error((await response.text()) || "Public fill tape unavailable.");
    return response.json() as Promise<TapeRow[]>;
  }
  const exchange = await getExchange();
  const activity = await withTimeout(
    exchange.client.getMarketActivity(market.marketId, {
      limit: 50,
      pool: market.poolAddress,
      kinds: ["TRADE"],
    }),
    "Public fill tape",
  ) as AnyRecord[];

  return activity.flatMap((trade, index) => {
    const rawSide = String(trade.takerSide ?? trade.makerSide ?? "");
    const side = rawSide.includes("NO") ? "Down" : rawSide.includes("YES") ? "Up" : null;
    const wallet = String(trade.taker ?? trade.maker ?? "");
    if (!side || !wallet) return [];

    const price = Number(toHuman(BigInt(String(trade.fillPrice ?? 0)), market.decimals));
    const size = Number(toHuman(BigInt(String(trade.quantity ?? 0)), market.decimals));
    if (!Number.isFinite(price) || !Number.isFinite(size) || price <= 0 || size <= 0) return [];

    return [{
      id: String(trade.id ?? `${trade.txHash}-${index}`),
      marketId: market.marketId,
      wallet,
      side,
      size,
      price: side === "Up" ? price : Math.max(0, Math.min(1, 1 - price)),
      timestamp: Number(trade.timestamp) * 1000 || Date.now(),
      txHash: String(trade.txHash ?? ""),
    } satisfies TapeRow];
  });
}

export async function quoteTicket(market: YonderMarket, side: "Up" | "Down", maxLoss: number): Promise<TicketQuote> {
  const exchange = await getExchange();
  if (!Number.isFinite(maxLoss) || maxLoss <= 0) return { size: 0, price: 0, risk: maxLoss, disabledReason: "Enter a max loss" };
  const symbol = side === "Up" ? market.yesSymbol : market.noSymbol;
  let snapped = 0;
  try {
    snapped = Number(exchange.amountToPrecision(symbol, maxLoss));
  } catch {
    snapped = maxLoss;
  }
  if (!snapped) return { size: 0, price: 0, risk: maxLoss, disabledReason: "Below one lot" };
  const book = await fetchBook(market, side === "Up" ? "YES" : "NO");
  const ask = book.asks[0]?.price ?? 0;
  if (!ask) return { size: 0, price: 0, risk: snapped, disabledReason: "No ask" };
  const size = Number((snapped / ask).toFixed(6));
  return { size, price: ask, risk: snapped };
}

export async function placeIocBuy(market: YonderMarket, side: "Up" | "Down", maxLoss: number, walletClient: WalletClient) {
  const exchange = await ensureMarketsLoaded();
  exchange.setSigner({ walletClient });
  // The chain read is deliberately the first step of every buy. Pool addresses are time-varying.
  const onchain = await exchange.client.getMarketOnchain(market.marketId);
  if (Number(onchain.status) !== 1) throw new Error("This window is no longer trading.");
  const decimals = Number(onchain.decimals ?? market.decimals ?? 6);
  const tradable = exchange.market(market.marketId);
  const symbol = `${tradable.marketSymbol}#${side === "Up" ? "YES" : "NO"}`;
  const snappedStake = exchange.amountToPrecision(symbol, maxLoss);
  if (!snappedStake) throw new Error("Below one lot.");
  const rawStake = fromHuman(snappedStake, decimals);
  const quote = await exchange.client.quoteBinaryStake({
    marketId: market.marketId,
    side: side === "Up" ? "BUY_YES" : "BUY_NO",
    stake: rawStake,
    depth: 5,
  });
  if (!quote) throw new Error("No ask or below one lot.");
  const trader = exchange.client.createTrader({ walletClient });
  const result = await trader.placeOrder({
    pool: onchain.pool,
    side: side === "Up" ? "BUY_YES" : "BUY_NO",
    price: quote.yesPrice,
    quantity: quote.quantity,
    orderType: (await import("@somnia-chain/markets-sdk")).ORDER_TYPE.MARKET,
  });
  const fills = Array.isArray(result.fills) ? result.fills : [];
  const txHash = String(result.receipt?.transactionHash ?? result.hash ?? "");
  return {
    txHash,
    fills,
    size: Number(toHuman(quote.quantity, decimals)),
    price: Number(toHuman(quote.limitPrice, decimals)),
  };
}

export async function redeemPosition(input: { marketId: string; amount: bigint; outcomeIdx: 0 | 1; walletClient: WalletClient }) {
  const market = await getMarket(input.marketId);
  if (market.status < 4) throw new Error("This window is not finalized yet.");
  const exchange = await setExchangeSigner(input.walletClient);
  const trader = exchange.client.createTrader({ walletClient: input.walletClient });
  return trader.redeem({ marketId: input.marketId, amount: input.amount, outcomeIdx: input.outcomeIdx });
}

export async function listClaimable(account: string) {
  const exchange = await getExchange();
  const claims = (await withTimeout(exchange.client.getClaimable(account), "Claimable positions")) as AnyRecord[];
  return Promise.all(claims.map(async (claim) => ({ claim, market: await getMarket(String(claim.marketId)) })));
}

export async function listOpenPositions(account: string) {
  const exchange = await getExchange();
  const portfolio = await withTimeout(exchange.client.getPortfolio(account, { ordersLimit: 0, tradesLimit: 0 }), "Open positions") as AnyRecord;
  const positions = (portfolio?.positions ?? []) as AnyRecord[];
  const rows = await Promise.all(positions.map(async (position) => {
    const marketId = String(position.market?.id ?? position.marketId ?? "");
    if (!marketId) return null;
    try {
      return { position, market: await getMarket(marketId) };
    } catch {
      return null;
    }
  }));
  return rows.filter((row): row is { position: AnyRecord; market: YonderMarket } => row !== null);
}

export async function redeemAll(claims: AnyRecord[], walletClient: WalletClient) {
  const markets = await Promise.all(claims.map((claim) => getMarket(String(claim.marketId))));
  if (markets.some((market) => market.status < 4)) throw new Error("Every claim must be finalized before redeeming.");
  const exchange = await setExchangeSigner(walletClient);
  const trader = exchange.client.createTrader({ walletClient });
  return trader.redeemMany({ entries: claims.map((claim) => ({ marketId: String(claim.marketId), amount: BigInt(String(claim.amount)), outcomeIdx: Number(claim.outcomeIdx) as 0 | 1 })) });
}

export function tapeRowFromFill(marketId: string, wallet: string, side: "Up" | "Down", fill: AnyRecord, txHash: string, index: number): TapeRow {
  const human = (value: unknown, decimals: number) => {
    if (typeof value === "bigint") return Number(toHuman(value, decimals));
    if (typeof value === "string" && /^\d+$/.test(value)) return Number(toHuman(BigInt(value), decimals));
    return numberValue(value);
  };
  const decimals = numberValue(fill.decimals, 6);
  const yesPrice = human(fill.fillPrice ?? fill.price ?? fill.yesPrice, decimals);
  return {
    id: `${txHash}-${index}`,
    marketId,
    wallet,
    side,
    size: human(fill.quantityFilled ?? fill.quantity ?? fill.amount ?? fill.size, decimals),
    price: side === "Up" ? yesPrice : Math.max(0, Math.min(1, 1 - yesPrice)),
    timestamp: Date.now(),
    txHash,
  };
}
