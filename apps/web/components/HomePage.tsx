"use client";

import Link from "next/link";
import { LandingNav } from "./Nav";
import { FAQ } from "./FAQ";
import { Reveal } from "./Reveal";

export function HomePage() {
  return <div className="page-shell landing-page"><a className="skip-link" href="#main-content">Skip to content</a><LandingNav /><main className="container" id="main-content">
    <section className="hero">
      <div className="hero-motion" aria-hidden="true"><span className="hero-soft-shape hero-soft-shape-a" /><span className="hero-soft-shape hero-soft-shape-b" /><span className="hero-clean-divider" /></div>
      <div className="hero-copy-block">
        <Reveal><p className="hero-name">Yonder</p><h1><span>The next</span> <em>window.</em></h1><p className="hero-copy">A public page for one DreamDEX Event Contract. No fill, no seat.</p><div className="hero-actions"><Link className="button button-blue button-primary" href="/app">Open live windows</Link><a className="text-button" href="#how-it-works">See how it works <span aria-hidden="true">↓</span></a></div></Reveal>
        <div className="hero-note"><span className="live-pulse" aria-hidden="true" /> Live now on Shannon</div>
      </div>
      <div className="hero-visual" aria-label="Yonder product flow">
        <div className="hero-signal-card"><span className="hero-signal-label">ONE PUBLIC WINDOW</span><strong>UP<em> / </em>DOWN</strong><div className="hero-signal-line"><span /></div><div className="hero-signal-meta"><span>book</span><span>tape</span><span>locker</span></div></div>
        <div className="hero-visual-footer"><span>Fills become seats</span><span>The next window</span></div>
      </div>
    </section>

    <section className="flow-section" id="how-it-works">
      <Reveal><div className="flow-intro"><h2>Make a call.<br /><em>Leave a trace.</em></h2><p>Four moves from a live market to a claimed win.</p></div></Reveal>
      <div className="flow-route" aria-hidden="true"><span className="flow-route-line" /><i /><i /><i /><i /></div>
      <div className="flow-steps">
        <Reveal className="flow-step" delay={0}><span className="flow-index">01</span><div><strong>Open a window</strong><p>Find a live BTC or ETH contract with time left.</p></div></Reveal>
        <Reveal className="flow-step" delay={70}><span className="flow-index">02</span><div><strong>Pick Up or Down</strong><p>Set the most you are willing to lose.</p></div></Reveal>
        <Reveal className="flow-step" delay={140}><span className="flow-index">03</span><div><strong>Get filled</strong><p>Your IOC order either takes a seat or disappears.</p></div></Reveal>
        <Reveal className="flow-step" delay={210}><span className="flow-index">04</span><div><strong>Cash out in the locker</strong><p>After settlement, redeem the winning share.</p></div></Reveal>
      </div>
    </section>

    <section className="why-section">
      <Reveal><div className="why-mark" aria-hidden="true">Y</div></Reveal><Reveal delay={90}><div><p className="why-copy">DreamDEX already has the market. Yonder makes the window public.</p><p className="fine-print">Watch the book. Make a call. See who actually filled.</p></div></Reveal>
    </section>

    <section className="boundaries-section"><Reveal><div className="boundary-copy"><p className="boundary-kicker"><i aria-hidden="true" /> Room rules</p><h2>This is a <em>room,</em><br /> not a machine.</h2><p>One clear market. Two sides. A public record of who got in.</p></div></Reveal><Reveal delay={100}><div className="boundary-list"><div><span>01</span><strong>Not an agent</strong></div><div><span>02</span><strong>Not a vault</strong></div><div><span>03</span><strong>Not a vote without a fill</strong></div></div></Reveal></section>

    <FAQ />
  </main><footer className="footer"><div className="container footer-grid"><Reveal><div className="footer-brand"><Link className="wordmark" href="/">Yonder</Link><p>The next window.</p><p className="footer-description">A public room for people who trade what happens next.</p><span className="footer-status"><i aria-hidden="true" /> Live on Shannon</span></div></Reveal><Reveal className="footer-links-grid" delay={90}><div className="footer-column"><h3>Explore</h3><Link href="/app">Live windows</Link><Link href="/locker">Locker</Link><Link href="#how-it-works">How it works</Link><Link href="#faq">FAQ</Link></div><div className="footer-column"><h3>Learn</h3><a href="https://docs.dreamdex.io/developers/event-contracts" target="_blank" rel="noreferrer">Event Contracts</a><a href="https://docs.dreamdex.io/trading/event-contracts" target="_blank" rel="noreferrer">Trading guide</a><a href="https://docs.dreamdex.io/developers/event-contracts/gotchas.md" target="_blank" rel="noreferrer">Builder notes</a></div><div className="footer-column"><h3>Project</h3><a href="https://docs.dreamdex.io/developers/event-contracts" target="_blank" rel="noreferrer">DreamDEX docs</a><a href="https://shannon-explorer.somnia.network" target="_blank" rel="noreferrer">Explorer</a><a href="https://t.me/+XHq0F0JXMyhmMzM0" target="_blank" rel="noreferrer">Get test funds</a></div></Reveal></div><div className="container footer-bottom"><span>© 2026 Yonder</span><span>The next window.</span><span>DreamDEX Event Contracts</span></div></footer></div>;
}
