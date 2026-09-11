import { ImageResponse } from "next/og";

export const alt = "Yonder. The next window.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, background: "#0b57d0", color: "white", fontFamily: "Arial" }}>
      <div style={{ display: "flex", fontSize: 34, fontWeight: 800 }}>Yonder</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ display: "flex", fontSize: 88, fontWeight: 800, letterSpacing: -6 }}>The next window.</div>
        <div style={{ display: "flex", fontSize: 28, opacity: 0.82 }}>A public room for one DreamDEX Event Contract.</div>
      </div>
      <div style={{ display: "flex", fontSize: 22, opacity: 0.78 }}>No fill, no seat.</div>
    </div>,
    { ...size },
  );
}
