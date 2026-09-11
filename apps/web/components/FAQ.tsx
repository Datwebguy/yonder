"use client";

import { useState } from "react";
import { Reveal } from "./Reveal";

const questions = [
  ["What is an Event Contract?", "Up or Down on BTC/ETH for a fixed window. Winner pays 1. Max loss is your stake."],
  ["Do I trade on Yonder or DreamDEX?", "Yonder is the room. Orders hit DreamDEX via @somnia-chain/markets-sdk."],
  ["Why isn’t my name on the tape?", "You didn’t get filled. Views don’t count."],
  ["Why cash out?", "This venue pays when you redeem. The locker does that."],
  ["What do I need to play?", "A wallet on Shannon, a little STT for gas, and tUSDC for your max loss."],
  ["Is this an AI agent?", "No."],
];

export function FAQ() {
  const [open, setOpen] = useState(0);
  return <section className="faq-section" id="faq"><Reveal><div className="faq-heading"><p className="faq-kicker">Before you take a seat</p><h2>Read the room.</h2><p className="faq-intro">A window is simple. The book tells you what is happening. The tape tells you who actually got in.</p><div className="faq-flow" aria-hidden="true"><span>question</span><i /><span>call</span><i /><span>fill</span><i /><span>claim</span></div></div></Reveal><Reveal className="faq-list-reveal" delay={100}><div className="faq-list">{questions.map(([question, answer], index) => { const isOpen = open === index; return <div className={`faq-item ${isOpen ? "is-open" : ""}`} key={question}><button onClick={() => setOpen(isOpen ? -1 : index)} aria-expanded={isOpen} aria-controls={`faq-answer-${index}`}><span>{question}</span><span className="faq-plus" aria-hidden="true">{isOpen ? "−" : "+"}</span></button><div className="faq-answer" id={`faq-answer-${index}`} aria-hidden={!isOpen}><p>{answer}</p></div></div>; })}</div></Reveal></section>;
}
