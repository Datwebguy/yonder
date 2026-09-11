import type { TapeRow, YonderMarket } from "./types";

type ShareInput = { market: YonderMarket; side: "Up" | "Down"; size: number; price: number; outcome?: "won" | "lost" };

export async function makeShareCard(input: ShareInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  context.fillStyle = "#0b57d0";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#ffffff";
  context.font = "700 58px Arial";
  context.fillText("Yonder", 72, 108);
  context.font = "400 28px Arial";
  context.fillText("The next window.", 76, 150);
  context.font = "700 110px Arial";
  context.fillText(`${input.market.asset} ${input.market.intervalLabel}`, 72, 310);
  context.font = "700 76px Arial";
  context.fillText(`${input.side} @ ${input.price.toFixed(2)}`, 72, 420);
  context.font = "400 30px Arial";
  context.fillText(`${input.size.toFixed(3)} shares  •  Somnia Shannon`, 76, 486);
  if (input.outcome) context.fillText(input.outcome === "won" ? "Won" : "Lost", 76, 540);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create share card"))), "image/png"));
}

export async function shareFill(input: ShareInput) {
  const blob = await makeShareCard(input);
  const url = `${window.location.origin}/m/${input.market.marketId}`;
  const text = input.outcome === "won" ? `Won the ${input.market.asset} ${input.market.intervalLabel} on Yonder.` : `${input.side} on ${input.market.asset} ${input.market.intervalLabel} @ ${Math.round(input.price * 100)}¢. The next window.`;
  const downloadUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = downloadUrl;
  anchor.download = "yonder-card.png";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(downloadUrl);

  const intent = new URL("https://x.com/intent/post");
  intent.searchParams.set("text", text);
  intent.searchParams.set("url", url);
  const shareWindow = window.open(intent.toString(), "_blank", "noopener,noreferrer");
  if (!shareWindow) window.location.assign(intent.toString());
}

export function shareInputFromRow(market: YonderMarket, row: TapeRow): ShareInput {
  return { market, side: row.side, size: row.size, price: row.price, outcome: row.outcome };
}
