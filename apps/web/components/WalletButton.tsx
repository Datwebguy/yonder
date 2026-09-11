"use client";

import { useEffect, useState } from "react";
import { useAccount, useBalance, useConnect, useDisconnect, useSwitchChain, useWalletClient } from "wagmi";
import { formatUnits } from "viem";
import { explorerTxUrl, TEST_USDC, TEST_USDC_DECIMALS, SHANNON_CHAIN_ID } from "@/lib/chain";
import { faucetTestUsdc, setExchangeSigner } from "@/lib/dreamdex";
import { shortAddress } from "@/lib/sizing";

export function WalletButton({ required = false }: { required?: boolean }) {
  const { address, chainId, isConnected } = useAccount();
  const { connectAsync, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain, isPending: switching } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const { data: stt } = useBalance({ address, chainId: SHANNON_CHAIN_ID, query: { enabled: Boolean(address) } });
  const { data: usdc, refetch: refetchUsdc } = useBalance({ address, chainId: SHANNON_CHAIN_ID, token: TEST_USDC, query: { enabled: Boolean(address) } });
  const [chooserOpen, setChooserOpen] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [switchError, setSwitchError] = useState("");
  const [faucetPending, setFaucetPending] = useState(false);
  const [faucetError, setFaucetError] = useState("");
  const [faucetHash, setFaucetHash] = useState("");
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (walletClient) void setExchangeSigner(walletClient);
  }, [walletClient]);

  useEffect(() => {
    setIsMobile(typeof navigator !== "undefined" && /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!chooserOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setChooserOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [chooserOpen]);

  const injectedConnector = connectors.find((connector) => connector.id === "injected");
  const walletConnectConnector = connectors.find((connector) => connector.id === "walletConnect");
  const injectedConnectors = connectors.filter((connector) => connector.type === "injected");
  // Wagmi adds one connector per EIP-6963 provider after discovery. Do not
  // fall back to the generic injected connector when named providers exist:
  // that connector delegates to window.ethereum, which can silently resolve
  // to Phantom when several extensions are installed.
  const discoveredBrowserWallets = injectedConnectors.filter((connector) => connector.id !== "injected");
  const hasInjectedProvider = typeof window !== "undefined" && Boolean(
    (window as Window & { ethereum?: unknown; phantom?: { ethereum?: unknown } }).ethereum
      ?? (window as Window & { phantom?: { ethereum?: unknown } }).phantom?.ethereum
      ?? discoveredBrowserWallets.length,
  );
  const browserWallets = discoveredBrowserWallets.length
    ? discoveredBrowserWallets
    : injectedConnector
      ? [injectedConnector]
      : [];
  const walletChoices = [
    ...(!isMobile && hasInjectedProvider
      ? browserWallets.map((connector) => ({
        key: `browser-${connector.id}`,
        label: connector.name === "Injected" ? "Browser wallet" : connector.name,
        detail: connector.name === "Injected" ? "Use the extension in this browser." : `Use ${connector.name} in this browser.`,
        connector,
        icon: connector.icon,
      }))
      : []),
    isMobile && hasInjectedProvider && injectedConnector ? { key: "this-wallet", label: "This wallet", detail: "Use the wallet app around this browser.", connector: injectedConnector } : null,
    walletConnectConnector ? { key: "wallet-connect", label: "WalletConnect", detail: isMobile ? "Choose a wallet and continue in its app." : "Scan the QR code with your phone.", connector: walletConnectConnector, icon: undefined } : null,
  ].filter(Boolean) as { key: string; label: string; detail: string; connector: (typeof connectors)[number]; icon?: string }[];

  const connectWallet = () => {
    setConnectError("");
    setChooserOpen(true);
  };

  const chooseWallet = async (connector: (typeof connectors)[number]) => {
    setConnectError("");
    // Let the official WalletConnect/Reown modal own the viewport. Keeping
    // Yonder's chooser mounted underneath it can make a close event look like
    // a reset before the wallet has had a chance to approve the session.
    setChooserOpen(false);
    try {
      await connectAsync({ connector });
    } catch (reason) {
      const message = reason instanceof Error ? reason.message : "Wallet connection was cancelled.";
      setConnectError(/connection request reset/i.test(message)
        ? "WalletConnect was closed before approval. Choose it again and approve in your wallet."
        : message);
    }
  };

  const getTestUsdc = async () => {
    if (!walletClient) {
      setFaucetError("Wallet approval is not ready yet.");
      return;
    }
    setFaucetError("");
    setFaucetHash("");
    setFaucetPending(true);
    try {
      const result = await faucetTestUsdc(walletClient);
      const hash = String(result?.hash ?? result?.receipt?.transactionHash ?? "");
      setFaucetHash(hash);
      await refetchUsdc();
    } catch (reason) {
      setFaucetError(reason instanceof Error ? reason.message : "Could not mint test tUSDC.");
    } finally {
      setFaucetPending(false);
    }
  };

  if (!isConnected || !address) {
    return <>
      <button className="button button-secondary" onClick={connectWallet} disabled={isPending}>{isPending ? "Connecting" : required ? "Connect wallet" : "Connect"}</button>
      {chooserOpen ? <div className="wallet-chooser-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setChooserOpen(false); }}>
        <section className="wallet-chooser" role="dialog" aria-modal="true" aria-labelledby="wallet-chooser-title">
          <div className="wallet-chooser-heading"><div><p className="eyebrow">Connect a wallet</p><h2 id="wallet-chooser-title">Choose how to enter.</h2><p>Select a wallet first. It will ask you to approve the connection.</p></div><button className="wallet-chooser-close" type="button" aria-label="Close wallet chooser" onClick={() => setChooserOpen(false)}>×</button></div>
          <div className="wallet-choices">{walletChoices.map((choice) => <button className="wallet-choice" type="button" key={choice.key} onClick={() => void chooseWallet(choice.connector)}><span className={`wallet-choice-icon wallet-choice-icon-${choice.key}`} aria-hidden="true">{"icon" in choice && choice.icon ? <span className="wallet-choice-icon-image" style={{ backgroundImage: `url("${choice.icon}")` }} /> : choice.key === "wallet-connect" ? "W" : "↗"}</span><span><strong>{choice.label}</strong><small>{choice.detail}</small></span><b aria-hidden="true">›</b></button>)}</div>
          {!walletChoices.length ? <p className="inline-error">No wallet connector is configured yet.</p> : null}
          {connectError ? <p className="inline-error" role="alert">{connectError}</p> : null}
          <p className="wallet-chooser-note">Yonder never connects a wallet before you choose one.</p>
        </section>
      </div> : null}
      {connectError && !chooserOpen ? <p className="inline-error wallet-connect-error" role="alert">{connectError}</p> : null}
    </>;
  }

  if (chainId !== SHANNON_CHAIN_ID) {
    const switchToShannon = async () => {
      setSwitchError("");
      try {
        await switchChain({ chainId: SHANNON_CHAIN_ID });
      } catch (reason) {
        setSwitchError(reason instanceof Error ? reason.message : "Could not switch to Shannon.");
      }
    };
    return <><button className="button button-blue" onClick={() => void switchToShannon()} disabled={switching}>{switching ? "Switching" : "Switch to Shannon"}</button>{switchError ? <p className="inline-error wallet-connect-error" role="alert">{switchError}</p> : null}</>;
  }

  return (
    <details className="wallet-details">
      <summary className="button button-secondary">{shortAddress(address)}</summary>
      <div className="wallet-popover">
        <div><span>STT</span><strong>{stt ? Number(formatUnits(stt.value, stt.decimals)).toFixed(3) : "n/a"}</strong></div>
        <div><span>tUSDC</span><strong>{usdc ? Number(formatUnits(usdc.value, TEST_USDC_DECIMALS)).toFixed(2) : "n/a"}</strong></div>
        <button className="wallet-faucet-button" type="button" onClick={() => void getTestUsdc()} disabled={faucetPending}>{faucetPending ? "Minting tUSDC…" : "Get 10,000 tUSDC"}</button>
        {faucetHash ? <a className="wallet-faucet-link" href={explorerTxUrl(faucetHash)} target="_blank" rel="noreferrer">View faucet transaction ↗</a> : null}
        {faucetError ? <p className="inline-error" role="alert">{faucetError}</p> : null}
        <button className="text-button" onClick={() => disconnect()}>Disconnect</button>
      </div>
    </details>
  );
}
