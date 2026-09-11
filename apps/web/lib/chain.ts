import { defineChain } from "viem";

export const SHANNON_CHAIN_ID = 50312;
export const SHANNON_RPC_URL = "https://dream-rpc.somnia.network";
export const SHANNON_EXPLORER_URL = "https://shannon-explorer.somnia.network";

export const shannon = defineChain({
  id: SHANNON_CHAIN_ID,
  name: "Somnia Shannon",
  nativeCurrency: { name: "Somnia Testnet Token", symbol: "STT", decimals: 18 },
  rpcUrls: { default: { http: [SHANNON_RPC_URL] } },
  blockExplorers: { default: { name: "Shannon Explorer", url: SHANNON_EXPLORER_URL } },
  testnet: true,
});

export const TEST_USDC = "0x70a86D8842FB63C4Ad2b7cdddF530eBf1BB25d8E" as const;
export const TEST_USDC_DECIMALS = 6;

export function explorerTxUrl(hash: string) {
  return `${SHANNON_EXPLORER_URL}/tx/${hash}`;
}

export function explorerAddressUrl(address: string) {
  return `${SHANNON_EXPLORER_URL}/address/${address}`;
}
