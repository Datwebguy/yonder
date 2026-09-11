# Yonder

<p align="center"><strong>The next window.</strong></p>

<p align="center">
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js" alt="Next.js 15"></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.7-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript 5.7"></a>
  <a href="https://somnia.network/"><img src="https://img.shields.io/badge/Somnia-Shannon-1F00FF?style=flat-square" alt="Somnia Shannon"></a>
  <a href="https://www.npmjs.com/package/@somnia-chain/markets-sdk"><img src="https://img.shields.io/badge/Markets%20SDK-0.29.0-0B57D0?style=flat-square" alt="Somnia Markets SDK 0.29.0"></a>
</p>

<p align="center">Yonder is a mobile first public room for one DreamDEX Event Contract window. Choose Up or Down, set the most you can lose, and take a seat only when an IOC order fills.</p>

<p align="center"><a href="https://useyonder.vercel.app">Open Yonder</a> · <a href="https://github.com/Datwebguy/yonder">Source</a> · <a href="https://docs.dreamdex.io/developers/event-contracts">DreamDEX Event Contracts</a> · <a href="https://shannon-explorer.somnia.network">Shannon Explorer</a></p>

## The product

DreamDEX already provides the on chain event contract market. Yonder gives each live window a clear public page that people can share, understand, and act on.

The page puts the market probability, book, countdown, ticket, and public fill tape in one readable flow. A view is not a position. A prediction is not a seat. A fill is the only seat.

After settlement, the locker shows claimable positions and sends the connected wallet through the venue redemption flow. Losing redemptions can return zero and are treated as valid settlement results, not application errors.

Yonder is deliberately focused. It is not an agent, a vault, a copy trading system, a chat room, or a market factory.

## How a window works

Open a live BTC or ETH window from the live board. Read the probability and the best available Up or Down prices. Enter a maximum loss in tUSDC. Yonder snaps the order to the venue lot rules, quotes the book, and sends an IOC buy through the connected wallet.

The ticket accepts new entry only while the fresh on chain market status is explicitly Trading. Missing or invalid status is treated as unavailable. The application reads the current market pool before every write, so recycled pool addresses are never used as market identity and no pool is hardcoded.

Filled orders appear on a shared public tape read from DreamDEX market activity. The browser keeps `yonder:tape:{marketId}` only as an optimistic cache while the indexer catches up, so local storage is not the source of truth. Every public row points to the Shannon explorer. Once the window is final, the locker handles redemption and the page can offer the next live window for the same asset.

## Live data and execution

Yonder reads binary markets from `@somnia-chain/markets-sdk` version `0.29.0`. The live board discovers markets from the SDK, confirms their on chain status, and keeps every route keyed by `marketId`.

The browser uses a wallet backed signer. No private key is stored in the client and no matcher or custodial backend is used. WalletConnect is available for QR and mobile deep link flows when a WalletConnect project ID is configured. Browser wallet and in wallet browser connections are presented as explicit choices before approval.

Prices are probabilities between zero and one. The SDK handles market book reads, lot precision, order approval, IOC placement, and redemption. The app never sends a zero lot and never uses the spot HTTP API for Event Contract trading.

## Routes

| Route | Purpose |
| --- | --- |
| `/` | Short product introduction and navigation to live windows |
| `/app` | Live Shannon window board with BTC and ETH markets when available |
| `/m/[marketId]` | Market context, probability, book, countdown, ticket, pulse, and fill tape |
| `/locker` | Live positions, finalized claims, redemption, and rematch entry |

## Technology

The frontend uses Next.js App Router, React, TypeScript, and CSS design tokens. Wagmi and Viem provide wallet and chain connectivity. The interface is mobile first, light by default, and supports a persisted dark theme. The blue and white visual system keeps Up as the primary action while Down remains a clear neutral alternative.

The live board and market pages use small server read routes to keep indexer and RPC reads reliable in browsers. Writes still happen from the user wallet through the SDK. Loading and network failures resolve to visible error states instead of an endless skeleton.

## Run locally

From the repository root:

```bash
cd apps/web
npm install
copy .env.example .env.local
npm run dev
```

Open `http://localhost:3000`.

For mobile WalletConnect, set `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` in `apps/web/.env.local` to a project ID from WalletConnect Cloud. Fund a Shannon test wallet with STT for gas and tUSDC for trading.

The Shannon configuration is kept in `apps/web/lib/chain.ts`. The Event Contract SDK setup, public tape reads, settlement checks, and write paths are in `apps/web/lib/dreamdex.ts`.

## Verification

The application can be checked with:

```bash
cd apps/web
npm run typecheck
npm run lint
npm run build
```

The intended demo path is simple: open a live window, choose a side, enter a maximum loss, approve the wallet transaction, confirm the fill on the tape, open the explorer link, and redeem from the locker after settlement.

## Network

Yonder currently targets Somnia Shannon testnet. The chain ID is `50312`, the collateral is test tUSDC with six decimals, and the live RPC and explorer values are defined in the application chain configuration. Testnet funds have no production value.

The deployed demo is [useyonder.vercel.app](https://useyonder.vercel.app). Built for a clearer way to enter the next DreamDEX Event Contract window.
