import { createConfig, http } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { shannon, SHANNON_RPC_URL } from "./chain";

const walletConnectProjectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;
const connectors = [injected({
  shimDisconnect: true,
  target: {
    id: "injected",
    name: "Browser wallet",
    provider(window) {
      return window?.ethereum ?? window?.phantom?.ethereum;
    },
  },
})];

// WalletConnect opens browser storage while its connector is constructed. Keep
// that construction client-only so Next's server/static render never touches
// indexedDB, while the browser still gets the QR/deep-link connector.
if (typeof window !== "undefined" && walletConnectProjectId) {
  connectors.push(walletConnect({
    projectId: walletConnectProjectId,
    showQrModal: true,
    metadata: {
      name: "Yonder",
      description: "The next window. A public room for DreamDEX Event Contracts.",
      url: "https://useyonder.vercel.app",
      icons: ["https://useyonder.vercel.app/yonder-mark.svg"],
    },
  }) as (typeof connectors)[number]);
}

export const wagmiConfig = createConfig({
  chains: [shannon],
  connectors,
  transports: { [shannon.id]: http(SHANNON_RPC_URL) },
  ssr: true,
});
