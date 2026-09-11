import type { TapeRow, YonderMarket } from "./types";

type ShareInput = { market: YonderMarket; side: "Up" | "Down"; size: number; price: number; outcome?: "won" | "lost" };

function roundedRect(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
}

function drawLogo(context: CanvasRenderingContext2D, x: number, y: number, color: string) {
  context.save();
  context.fillStyle = color;
  roundedRect(context, x, y, 34, 34, 9);
  context.fill();
  context.fillStyle = "#1f00ff";
  context.beginPath();
  context.moveTo(x + 6, y + 6);
  context.lineTo(x + 15, y + 6);
  context.lineTo(x + 21, y + 13);
  context.lineTo(x + 27, y + 6);
  context.lineTo(x + 29, y + 6);
  context.lineTo(x + 21, y + 18);
  context.lineTo(x + 21, y + 28);
  context.lineTo(x + 13, y + 28);
  context.lineTo(x + 13, y + 18);
  context.closePath();
  context.fill();
  context.restore();
}

function drawGrid(context: CanvasRenderingContext2D, color: string) {
  context.save();
  context.strokeStyle = color;
  context.lineWidth = 1;
  for (let x = 0; x <= 1200; x += 40) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x, 630);
    context.stroke();
  }
  for (let y = 0; y <= 630; y += 40) {
    context.beginPath();
    context.moveTo(0, y);
    context.lineTo(1200, y);
    context.stroke();
  }
  context.restore();
}

function drawOutcomeMark(context: CanvasRenderingContext2D, x: number, y: number, state: "won" | "lost" | "live", accent: string) {
  context.save();
  context.strokeStyle = accent;
  context.lineWidth = 5;
  context.beginPath();
  context.arc(x, y, 78, 0, Math.PI * 2);
  context.stroke();
  context.lineWidth = 2;
  context.globalAlpha = 0.35;
  context.beginPath();
  context.arc(x, y, 94, 0, Math.PI * 2);
  context.stroke();
  context.globalAlpha = 1;
  context.fillStyle = accent;
  context.font = "800 78px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(state === "won" ? "✓" : state === "lost" ? "×" : "↗", x, y - 2);
  context.restore();
}

function fitText(context: CanvasRenderingContext2D, value: string, maxWidth: number) {
  if (context.measureText(value).width <= maxWidth) return value;
  let output = value;
  while (output.length > 1 && context.measureText(`${output}…`).width > maxWidth) output = output.slice(0, -1);
  return `${output}…`;
}

export async function makeShareCard(input: ShareInput) {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas unavailable");
  const won = input.outcome === "won";
  const lost = input.outcome === "lost";
  const background = context.createLinearGradient(0, 0, 1200, 630);
  if (won) {
    background.addColorStop(0, "#10062f");
    background.addColorStop(0.55, "#2610a8");
    background.addColorStop(1, "#0b57d0");
  } else if (lost) {
    background.addColorStop(0, "#160c28");
    background.addColorStop(0.6, "#431548");
    background.addColorStop(1, "#7d2e54");
  } else {
    background.addColorStop(0, "#07152b");
    background.addColorStop(0.6, "#122a87");
    background.addColorStop(1, "#1f00ff");
  }
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  drawGrid(context, won ? "rgba(255,255,255,.06)" : lost ? "rgba(255,225,235,.06)" : "rgba(170,220,255,.07)");

  const accent = won ? "#c8ff63" : lost ? "#ff8797" : "#73f4d0";
  const warmAccent = won ? "#ffd166" : lost ? "#ffbf69" : "#8b7cff";
  const headline = won ? "You called it." : lost ? "Not this time." : "Make a call.";
  const kicker = won ? "WINNING SHARE" : lost ? "SETTLED · LOSS" : "LIVE EVENT CONTRACT";
  const detail = won ? "Your side settled on top." : lost ? "The window settled on the other side." : "One window. Two sides. One settlement.";

  context.save();
  context.globalAlpha = 0.18;
  context.fillStyle = accent;
  context.beginPath();
  context.arc(1040, 120, 190, 0, Math.PI * 2);
  context.fill();
  context.globalAlpha = 0.16;
  context.strokeStyle = warmAccent;
  context.lineWidth = 2;
  context.beginPath();
  context.arc(1040, 120, 136, 0, Math.PI * 2);
  context.stroke();
  context.beginPath();
  context.arc(1040, 120, 172, 0, Math.PI * 2);
  context.stroke();
  context.restore();

  drawLogo(context, 72, 58, "#ffffff");
  context.fillStyle = "#ffffff";
  context.font = "800 28px Arial";
  context.fillText("Yonder", 120, 82);
  context.fillStyle = "rgba(255,255,255,.62)";
  context.font = "700 15px Arial";
  context.letterSpacing = "3px";
  context.fillText("THE NEXT WINDOW", 72, 126);
  context.letterSpacing = "0px";

  context.fillStyle = accent;
  context.font = "800 16px Arial";
  context.fillText(kicker, 72, 196);
  context.fillStyle = "#ffffff";
  context.font = "800 72px Arial";
  context.fillText(headline, 72, 270);
  context.fillStyle = "rgba(255,255,255,.72)";
  context.font = "400 23px Arial";
  context.fillText(detail, 76, 310);

  context.fillStyle = "#ffffff";
  context.font = "800 52px Arial";
  const marketLabel = fitText(context, `${input.market.asset} · ${input.market.intervalLabel}`, 560);
  context.fillText(marketLabel, 72, 390);
  context.fillStyle = accent;
  context.font = "800 30px Arial";
  context.fillText(input.side.toUpperCase(), 76, 438);
  context.fillStyle = "rgba(255,255,255,.74)";
  context.font = "400 22px Arial";
  context.fillText(input.price > 0 ? `Entry ${Math.round(input.price * 100)}¢  ·  ${input.size.toFixed(3)} shares` : `${input.size.toFixed(3)} shares  ·  settled`, 76, 474);

  context.fillStyle = "rgba(255,255,255,.12)";
  roundedRect(context, 72, 520, 600, 1, 1);
  context.fill();
  context.fillStyle = "rgba(255,255,255,.58)";
  context.font = "600 16px Arial";
  context.fillText("DREAMDEX EVENT CONTRACT  ·  SOMNIA SHANNON", 72, 566);

  context.save();
  roundedRect(context, 780, 204, 330, 280, 28);
  context.fillStyle = "rgba(255,255,255,.1)";
  context.fill();
  context.strokeStyle = "rgba(255,255,255,.24)";
  context.lineWidth = 2;
  context.stroke();
  context.fillStyle = "rgba(255,255,255,.72)";
  context.font = "700 15px Arial";
  context.fillText(won ? "RESULT" : lost ? "FINAL CALL" : "POSITION", 816, 250);
  drawOutcomeMark(context, 945, 348, won ? "won" : lost ? "lost" : "live", accent);
  context.fillStyle = "#ffffff";
  context.font = "800 48px Arial";
  context.textAlign = "center";
  context.fillText(won ? "WON" : lost ? "LOST" : input.side.toUpperCase(), 945, 432);
  context.textAlign = "left";
  context.restore();

  context.fillStyle = warmAccent;
  context.font = "800 44px Arial";
  context.fillText(won ? "✦" : lost ? "↘" : "↗", 1088, 560);
  return new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Could not create share card"))), "image/png"));
}

export async function shareFill(input: ShareInput) {
  const blob = await makeShareCard(input);
  const url = `${window.location.origin}/m/${input.market.marketId}`;
  const priceLine = input.price > 0 ? `I took ${input.side} at ${Math.round(input.price * 100)}¢.` : `I took the ${input.side} side.`;
  const text = input.outcome === "won"
    ? `I just won ${input.side} on ${input.market.asset} ${input.market.intervalLabel} on Yonder.\n\nFeels good trying out public Event Contracts on @Somnia_Network with @dreamDEXSomnia.\n\nYou can go check it out: ${url}`
    : input.outcome === "lost"
      ? `${priceLine} It did not land this time, but the public record is on Yonder.\n\nTry the next window on @Somnia_Network with @dreamDEXSomnia.\n\nYou can go check it out: ${url}`
      : `${priceLine} Trying the next window on Yonder.\n\nPublic Event Contracts on @Somnia_Network with @dreamDEXSomnia.\n\nYou can go check it out: ${url}`;
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
