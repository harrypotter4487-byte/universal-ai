"use client";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";

const MODELS = [
  { id: "groq",   name: "Groq",     full: "Llama 3.3",  tag: "Fastest",   desc: "500+ tokens / sec" },
  { id: "gemini", name: "Gemini",   full: "1.5 Flash",  tag: "Smartest",  desc: "Google AI" },
  { id: "deep",   name: "DeepSeek", full: "Chat",        tag: "Reasoning", desc: "Logic AI" },
  { id: "nvidia", name: "NVIDIA",   full: "Nemotron 3", tag: "Free",      desc: "NVIDIA AI" },
];

const CONVOS = [
  { q: "Fix my React useEffect infinite loop",
    a: `useEffect(() => {\n  fetchData();\n}, []); // ← run once\n\n// Missing dependency array\n// was causing the loop.`,
    t: "0.4s", m: "Groq Llama 3.3" },
  { q: "Explain quantum entanglement simply",
    a: `Two particles become linked.\nMeasure one — instantly know\nthe other's state, any distance.\n\n"Spooky action at a distance."`,
    t: "1.1s", m: "Gemini 1.5 Flash" },
  { q: "What's 15% of 847, step by step",
    a: `10% of 847 = 84.7\n 5% of 847 = 42.35\n\n84.7 + 42.35 = 127.05`,
    t: "0.9s", m: "DeepSeek Chat" },
  { q: "Write a Python function for duplicates",
    a: `def find_dupes(lst):\n    seen = set()\n    return [x for x in lst\n            if x in seen\n            or seen.add(x)]`,
    t: "0.7s", m: "NVIDIA Nemotron" },
];

export default function Page() {
  const [activeModel, setActiveModel] = useState(0);
  const [step, setStep]               = useState(0);
  const [openFaq, setOpenFaq]         = useState<number | null>(null);
  const [scrollY, setScrollY]         = useState(0);
  const [visible, setVisible]         = useState<Set<string>>(new Set());
  const observerRef                   = useRef<IntersectionObserver | null>(null);

  /* scroll progress for hero parallax */
  useEffect(() => {
    const fn = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* intersection observer for scroll-triggered reveals */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setVisible((prev) => new Set([...prev, e.target.getAttribute("data-reveal") || ""]));
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => observerRef.current?.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  /* chat demo animation */
  useEffect(() => {
    setStep(0);
    const t1 = setTimeout(() => setStep(1), 600);
    const t2 = setTimeout(() => setStep(2), 1800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeModel]);

  const conv  = CONVOS[activeModel];
  const isVis = (id: string) => visible.has(id);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,300&family=JetBrains+Mono:wght@400;500;700&display=swap');

        /* ─── RESET & BASE ─────────────────────────────── */
        *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
        html { scroll-behavior:smooth; font-size:16px; }
        body {
          background:#000;
          color:#fff;
          font-family:'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          -webkit-font-smoothing:antialiased;
          -moz-osx-font-smoothing:grayscale;
          overflow-x:hidden;
        }
        a    { text-decoration:none; color:inherit; }
        pre  { font-family:'JetBrains Mono',monospace; white-space:pre-wrap; }

        /* ─── SCROLLBAR ────────────────────────────────── */
        ::-webkit-scrollbar       { width:4px; }
        ::-webkit-scrollbar-track { background:#000; }
        ::-webkit-scrollbar-thumb { background:#333; border-radius:2px; }

        /* ─── KEYFRAMES ────────────────────────────────── */
        @keyframes heroIn   { from{opacity:0;transform:translateY(40px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes slideR   { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:translateX(0)} }
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        @keyframes dot1     { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes dot2     { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes dot3     { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes shimText {
          0%   { background-position:0% center }
          100% { background-position:200% center }
        }
        @keyframes borderPulse {
          0%,100%{ border-color:rgba(255,255,255,0.08) }
          50%    { border-color:rgba(255,255,255,0.18) }
        }

        /* ─── REVEAL UTILITY ───────────────────────────── */
        .reveal {
          opacity:0;
          transform:translateY(28px);
          transition:opacity 0.75s cubic-bezier(.16,1,.3,1),
                     transform 0.75s cubic-bezier(.16,1,.3,1);
        }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .reveal-d1 { transition-delay:0.08s; }
        .reveal-d2 { transition-delay:0.16s; }
        .reveal-d3 { transition-delay:0.24s; }
        .reveal-d4 { transition-delay:0.32s; }
        .reveal-d5 { transition-delay:0.40s; }
        .reveal-d6 { transition-delay:0.48s; }

        /* ─── NAV ──────────────────────────────────────── */
        .nav {
          position:fixed; inset:0 0 auto;
          z-index:200;
          height:52px;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 32px;
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(20px) saturate(180%);
          -webkit-backdrop-filter:blur(20px) saturate(180%);
          border-bottom:1px solid rgba(255,255,255,0.06);
        }
        .nav-logo {
          font-size:0.9rem; font-weight:600; letter-spacing:-0.02em;
          color:#fff; display:flex; align-items:center; gap:8px;
        }
        .nav-dot {
          width:6px; height:6px; border-radius:50%; background:#fff;
          animation:pulse 3s ease-in-out infinite;
        }
        .nav-center {
          display:flex; align-items:center; gap:2px;
          position:absolute; left:50%; transform:translateX(-50%);
        }
        .nav-link {
          padding:6px 14px; border-radius:7px;
          font-size:0.8rem; font-weight:500; color:rgba(255,255,255,0.45);
          transition:color 0.15s, background 0.15s;
          letter-spacing:-0.01em;
        }
        .nav-link:hover { color:#fff; background:rgba(255,255,255,0.07); }
        .nav-right { display:flex; align-items:center; gap:8px; }
        .nav-signin {
          padding:6px 14px; border-radius:7px;
          font-size:0.8rem; font-weight:500; color:rgba(255,255,255,0.55);
          transition:color 0.15s;
        }
        .nav-signin:hover { color:#fff; }
        .nav-cta {
          padding:7px 16px; border-radius:8px;
          font-size:0.8rem; font-weight:600;
          background:#fff; color:#000;
          transition:opacity 0.15s, transform 0.15s;
        }
        .nav-cta:hover { opacity:0.88; transform:scale(0.98); }

        /* ─── HERO ─────────────────────────────────────── */
        .hero {
          min-height:100vh;
          display:flex; flex-direction:column;
          align-items:center; justify-content:center;
          text-align:center;
          padding:120px 24px 80px;
          position:relative; overflow:hidden;
        }

        /* noise grain — Apple uses this */
        .hero::before {
          content:'';
          position:absolute; inset:0; z-index:0;
          opacity:0.028;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)'/%3E%3C/svg%3E");
          pointer-events:none;
        }

        /* radial white glow from center top */
        .hero::after {
          content:'';
          position:absolute; top:-200px; left:50%;
          transform:translateX(-50%);
          width:900px; height:600px;
          background:radial-gradient(ellipse at 50% 0%,
            rgba(255,255,255,0.06) 0%,
            rgba(255,255,255,0.02) 40%,
            transparent 70%);
          pointer-events:none; z-index:0;
        }

        .hero-inner { position:relative; z-index:1; max-width:900px; width:100%; }

        .hero-badge {
          display:inline-flex; align-items:center; gap:8px;
          padding:5px 14px 5px 8px;
          border:1px solid rgba(255,255,255,0.1);
          border-radius:99px;
          font-size:0.72rem; font-weight:500; color:rgba(255,255,255,0.45);
          letter-spacing:0.01em;
          margin-bottom:32px;
          animation:heroIn 1s 0.1s cubic-bezier(.16,1,.3,1) both;
        }
        .hero-badge-dot {
          width:18px; height:18px; border-radius:50%;
          background:rgba(255,255,255,0.08);
          border:1px solid rgba(255,255,255,0.12);
          display:flex; align-items:center; justify-content:center;
          font-size:9px;
        }

        /* The headline — this is where the money is */
        .hero-h1 {
          font-size:clamp(3.5rem, 9vw, 7.5rem);
          font-weight:700;
          line-height:0.95;
          letter-spacing:-0.045em;
          color:#fff;
          margin-bottom:28px;
          animation:heroIn 1s 0.18s cubic-bezier(.16,1,.3,1) both;
        }
        /* Second line slightly dimmer — Apple's exact technique */
        .hero-h1-dim {
          display:block;
          color:rgba(255,255,255,0.28);
          font-weight:300;
          letter-spacing:-0.03em;
        }

        .hero-sub {
          font-size:clamp(1rem, 2vw, 1.2rem);
          font-weight:400;
          color:rgba(255,255,255,0.4);
          line-height:1.65;
          max-width:520px;
          margin:0 auto 44px;
          letter-spacing:-0.01em;
          animation:heroIn 1s 0.26s cubic-bezier(.16,1,.3,1) both;
        }

        .hero-actions {
          display:flex; align-items:center; justify-content:center;
          gap:12px; flex-wrap:wrap;
          animation:heroIn 1s 0.34s cubic-bezier(.16,1,.3,1) both;
          margin-bottom:72px;
        }

        /* PRIMARY — white pill, Apple style */
        .btn-primary {
          display:inline-flex; align-items:center; gap:8px;
          height:48px; padding:0 28px;
          background:#fff; color:#000;
          border-radius:99px;
          font-size:0.88rem; font-weight:600; letter-spacing:-0.01em;
          transition:all 0.2s cubic-bezier(.16,1,.3,1);
          box-shadow:0 0 0 0 rgba(255,255,255,0);
        }
        .btn-primary:hover {
          transform:scale(1.03);
          box-shadow:0 0 32px rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.92);
        }

        /* SECONDARY — ghost pill */
        .btn-secondary {
          display:inline-flex; align-items:center; gap:8px;
          height:48px; padding:0 28px;
          background:rgba(255,255,255,0.07);
          border:1px solid rgba(255,255,255,0.12);
          border-radius:99px;
          font-size:0.88rem; font-weight:500; color:rgba(255,255,255,0.65);
          letter-spacing:-0.01em;
          transition:all 0.2s;
          backdrop-filter:blur(10px);
        }
        .btn-secondary:hover {
          background:rgba(255,255,255,0.11);
          border-color:rgba(255,255,255,0.22);
          color:#fff;
        }

        /* Model selector row under hero */
        .model-selector {
          display:flex; align-items:center; justify-content:center;
          gap:8px; flex-wrap:wrap;
          animation:heroIn 1s 0.42s cubic-bezier(.16,1,.3,1) both;
        }
        .model-selector-label {
          font-size:0.72rem; color:rgba(255,255,255,0.22);
          font-weight:400; letter-spacing:0.04em; margin-right:4px;
          font-family:'JetBrains Mono',monospace;
        }
        .model-btn {
          display:flex; align-items:center; gap:6px;
          padding:6px 14px;
          border:1px solid rgba(255,255,255,0.08);
          border-radius:8px;
          font-size:0.76rem; font-weight:500; color:rgba(255,255,255,0.35);
          cursor:pointer;
          background:transparent;
          transition:all 0.18s;
          font-family:'DM Sans',sans-serif;
        }
        .model-btn:hover { color:rgba(255,255,255,0.75); border-color:rgba(255,255,255,0.16); background:rgba(255,255,255,0.04); }
        .model-btn.active {
          color:#fff;
          border-color:rgba(255,255,255,0.25);
          background:rgba(255,255,255,0.07);
        }
        .model-btn-dot {
          width:5px; height:5px; border-radius:50%;
          background:rgba(255,255,255,0.3); flex-shrink:0;
          transition:background 0.18s, box-shadow 0.18s;
        }
        .model-btn.active .model-btn-dot {
          background:#fff;
          box-shadow:0 0 6px rgba(255,255,255,0.7);
        }

        /* ─── CHAT DEMO ─────────────────────────────────── */
        .chat-wrap {
          position:relative; z-index:1;
          max-width:640px; margin:72px auto 0;
          animation:heroIn 1s 0.5s cubic-bezier(.16,1,.3,1) both;
        }

        /* Glass card — Apple liquid glass */
        .chat-glass {
          border-radius:20px;
          background:rgba(255,255,255,0.04);
          border:1px solid rgba(255,255,255,0.1);
          backdrop-filter:blur(40px) saturate(1.5);
          -webkit-backdrop-filter:blur(40px) saturate(1.5);
          overflow:hidden;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 40px 80px rgba(0,0,0,0.8),
            0 0 0 1px rgba(255,255,255,0.04);
        }

        .chat-bar {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 16px;
          border-bottom:1px solid rgba(255,255,255,0.06);
          background:rgba(255,255,255,0.02);
        }
        .chat-dots { display:flex; gap:6px; }
        .chat-dots span { width:10px; height:10px; border-radius:50%; }
        .dot-r{background:#ff5f57;} .dot-y{background:#ffbd2e;} .dot-g{background:#28c840;}

        .chat-bar-label {
          font-family:'JetBrains Mono',monospace;
          font-size:0.6rem; color:rgba(255,255,255,0.25); letter-spacing:0.06em;
        }
        .chat-live {
          display:flex; align-items:center; gap:5px;
          font-family:'JetBrains Mono',monospace;
          font-size:0.56rem; font-weight:700; color:rgba(255,255,255,0.4);
          letter-spacing:0.1em;
        }
        .chat-live span {
          width:4px; height:4px; border-radius:50%; background:#fff; opacity:0.5;
          animation:pulse 1.8s infinite;
        }

        /* tabs */
        .chat-tabs {
          display:flex;
          border-bottom:1px solid rgba(255,255,255,0.05);
          overflow-x:auto; scrollbar-width:none;
        }
        .chat-tab {
          flex-shrink:0; display:flex; align-items:center; gap:5px;
          padding:9px 16px;
          font-size:0.68rem; font-weight:500;
          color:rgba(255,255,255,0.28);
          border-bottom:1.5px solid transparent;
          cursor:pointer; transition:all 0.15s; white-space:nowrap;
          background:none; border-left:none; border-right:none; border-top:none;
          font-family:'DM Sans',sans-serif;
        }
        .chat-tab.on { color:#fff; border-bottom-color:rgba(255,255,255,0.6); }
        .chat-tab-pip {
          width:5px; height:5px; border-radius:50%;
          background:rgba(255,255,255,0.2); flex-shrink:0;
        }
        .chat-tab.on .chat-tab-pip { background:#fff; box-shadow:0 0 5px rgba(255,255,255,0.7); }

        /* messages */
        .chat-body { padding:20px; min-height:200px; display:flex; flex-direction:column; gap:10px; }

        .msg { border-radius:12px; padding:10px 14px; font-size:0.8rem; line-height:1.6; }
        .msg-u {
          align-self:flex-end; max-width:80%;
          background:rgba(255,255,255,0.09);
          border:1px solid rgba(255,255,255,0.1);
          color:rgba(255,255,255,0.85);
          animation:msgIn 0.25s ease both;
        }
        .msg-a {
          align-self:flex-start; width:100%;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          color:rgba(255,255,255,0.65);
          animation:msgIn 0.3s ease both;
        }
        .msg-a-head {
          display:flex; align-items:center; gap:7px;
          margin-bottom:8px;
        }
        .msg-a-icon {
          width:18px; height:18px; border-radius:5px;
          background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1);
          display:flex; align-items:center; justify-content:center;
          font-size:9px; color:rgba(255,255,255,0.5);
        }
        .msg-a-name { font-size:0.66rem; font-weight:600; color:rgba(255,255,255,0.45); }
        .msg-speed {
          font-family:'JetBrains Mono',monospace;
          font-size:0.58rem; color:rgba(255,255,255,0.28);
          padding:1px 6px; border:1px solid rgba(255,255,255,0.07);
          border-radius:99px;
        }
        .msg-code {
          font-family:'JetBrains Mono',monospace;
          font-size:0.72rem; line-height:1.75;
          color:rgba(255,255,255,0.5);
        }
        .typing {
          display:flex; gap:4px; padding:10px 14px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          border-radius:12px; align-self:flex-start;
          animation:msgIn 0.2s ease both;
        }
        .typing span {
          width:5px; height:5px; border-radius:50%;
          background:rgba(255,255,255,0.25);
        }
        .typing span:nth-child(1){animation:dot1 1.2s 0.0s infinite;}
        .typing span:nth-child(2){animation:dot2 1.2s 0.15s infinite;}
        .typing span:nth-child(3){animation:dot3 1.2s 0.3s infinite;}

        /* bottom bar */
        .chat-foot {
          display:flex; align-items:center; gap:8px;
          padding:10px 16px;
          border-top:1px solid rgba(255,255,255,0.05);
          background:rgba(0,0,0,0.3);
        }
        .chat-input-mock {
          flex:1; padding:8px 12px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
          border-radius:8px; font-size:0.72rem;
          color:rgba(255,255,255,0.18); font-style:italic;
        }
        .chat-send-btn {
          width:30px; height:30px; border-radius:8px;
          background:#fff; color:#000;
          display:flex; align-items:center; justify-content:center;
          font-size:0.8rem; font-weight:700; flex-shrink:0;
          cursor:pointer; transition:all 0.18s;
          box-shadow:0 0 14px rgba(255,255,255,0.12);
        }
        .chat-send-btn:hover { transform:scale(1.1); box-shadow:0 0 20px rgba(255,255,255,0.2); }

        /* ─── DIVIDER ───────────────────────────────────── */
        .divider {
          width:100%; height:1px;
          background:linear-gradient(90deg, transparent, rgba(255,255,255,0.07), transparent);
        }

        /* ─── STATS ─────────────────────────────────────── */
        .stats {
          display:flex; justify-content:center;
          padding:48px 24px;
        }
        .stats-inner {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:0; max-width:900px; width:100%;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px;
          overflow:hidden;
        }
        .stat {
          display:flex; flex-direction:column; align-items:center;
          padding:32px 16px;
          border-right:1px solid rgba(255,255,255,0.06);
        }
        .stat:last-child { border-right:none; }
        .stat-n {
          font-size:2.6rem; font-weight:700;
          letter-spacing:-0.05em; color:#fff; line-height:1;
        }
        .stat-l {
          font-size:0.68rem; color:rgba(255,255,255,0.25);
          margin-top:6px; letter-spacing:0.06em;
          text-transform:uppercase; font-weight:400;
          font-family:'JetBrains Mono',monospace;
        }

        /* ─── SECTION BASE ──────────────────────────────── */
        .sec { padding:96px 24px; max-width:1100px; margin:0 auto; }
        .sec-center { text-align:center; }

        .sec-tag {
          display:inline-block;
          font-family:'JetBrains Mono',monospace;
          font-size:0.62rem; font-weight:700;
          letter-spacing:0.18em; text-transform:uppercase;
          color:rgba(255,255,255,0.25);
          margin-bottom:16px;
        }
        .sec-h {
          font-size:clamp(2rem,4vw,3.4rem);
          font-weight:700; letter-spacing:-0.04em; line-height:1.02; color:#fff;
          margin-bottom:16px;
        }
        .sec-h em { font-style:normal; color:rgba(255,255,255,0.3); font-weight:300; }
        .sec-p {
          font-size:1rem; color:rgba(255,255,255,0.35);
          line-height:1.75; letter-spacing:-0.01em;
        }

        /* ─── HOW IT WORKS ──────────────────────────────── */
        .steps {
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:1px; margin-top:56px;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px; overflow:hidden;
        }
        .step {
          padding:36px 28px;
          background:rgba(255,255,255,0.02);
          border-right:1px solid rgba(255,255,255,0.06);
          transition:background 0.25s;
        }
        .step:last-child { border-right:none; }
        .step:hover { background:rgba(255,255,255,0.04); }
        .step-n {
          font-size:0.62rem; font-weight:700;
          font-family:'JetBrains Mono',monospace;
          color:rgba(255,255,255,0.2); letter-spacing:0.1em;
          margin-bottom:20px;
        }
        .step-icon {
          font-size:1.5rem; margin-bottom:16px; display:block;
        }
        .step-t { font-size:1rem; font-weight:600; color:#fff; margin-bottom:8px; letter-spacing:-0.02em; }
        .step-d { font-size:0.83rem; color:rgba(255,255,255,0.35); line-height:1.72; letter-spacing:-0.005em; }

        /* ─── FEATURES ──────────────────────────────────── */
        .feats {
          display:grid; grid-template-columns:repeat(3,1fr);
          gap:1px; margin-top:56px;
          border:1px solid rgba(255,255,255,0.06);
          border-radius:16px; overflow:hidden;
        }
        .feat {
          padding:32px 28px;
          background:rgba(255,255,255,0.02);
          border-right:1px solid rgba(255,255,255,0.06);
          border-bottom:1px solid rgba(255,255,255,0.06);
          transition:background 0.25s;
          position:relative; overflow:hidden;
        }
        .feat:nth-child(3n) { border-right:none; }
        .feat:nth-child(4),.feat:nth-child(5),.feat:nth-child(6) { border-bottom:none; }
        .feat:hover { background:rgba(255,255,255,0.04); }
        /* top light line on hover */
        .feat::before {
          content:''; position:absolute; top:0; left:20%; right:20%; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
          opacity:0; transition:opacity 0.3s;
        }
        .feat:hover::before { opacity:1; }
        .feat-icon { font-size:1.4rem; margin-bottom:14px; display:block; }
        .feat-t { font-size:0.93rem; font-weight:600; color:#fff; margin-bottom:6px; letter-spacing:-0.02em; }
        .feat-d { font-size:0.8rem; color:rgba(255,255,255,0.32); line-height:1.7; }

        /* ─── MODELS ────────────────────────────────────── */
        .models {
          display:grid; grid-template-columns:repeat(4,1fr);
          gap:12px; margin-top:56px;
        }
        .model-card {
          padding:24px 20px;
          border:1px solid rgba(255,255,255,0.07);
          border-radius:14px;
          background:rgba(255,255,255,0.02);
          display:flex; flex-direction:column; gap:10px;
          transition:all 0.25s cubic-bezier(.16,1,.3,1);
          cursor:default;
          position:relative; overflow:hidden;
        }
        /* glass top highlight */
        .model-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.12),transparent);
        }
        .model-card:hover {
          border-color:rgba(255,255,255,0.15);
          background:rgba(255,255,255,0.04);
          transform:translateY(-4px);
          box-shadow:0 20px 48px rgba(0,0,0,0.5);
        }
        .mc-icon {
          width:40px; height:40px; border-radius:10px;
          background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.08);
          display:flex; align-items:center; justify-content:center;
          font-family:'JetBrains Mono',monospace; font-size:0.7rem; font-weight:700;
          color:rgba(255,255,255,0.6);
        }
        .mc-name { font-size:0.93rem; font-weight:600; color:#fff; letter-spacing:-0.02em; }
        .mc-sub  { font-size:0.68rem; color:rgba(255,255,255,0.25); font-family:'JetBrains Mono',monospace; }
        .mc-tag  {
          display:inline-block; padding:3px 9px; border-radius:99px;
          font-size:0.6rem; font-weight:600; letter-spacing:0.04em;
          background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.4);
          border:1px solid rgba(255,255,255,0.08); width:fit-content;
          font-family:'JetBrains Mono',monospace;
        }
        .mc-desc { font-size:0.76rem; color:rgba(255,255,255,0.28); line-height:1.65; flex:1; letter-spacing:-0.005em; }
        .mc-link {
          font-size:0.74rem; font-weight:500; color:rgba(255,255,255,0.35);
          padding:7px 12px; border-radius:8px;
          border:1px solid rgba(255,255,255,0.07);
          text-align:center; transition:all 0.18s;
          letter-spacing:-0.01em;
        }
        .mc-link:hover { color:#fff; border-color:rgba(255,255,255,0.18); background:rgba(255,255,255,0.05); }

        /* ─── IMAGE GEN ─────────────────────────────────── */
        .imggen {
          padding:96px 24px;
          border-top:1px solid rgba(255,255,255,0.05);
        }
        .imggen-inner {
          max-width:1100px; margin:0 auto;
          display:grid; grid-template-columns:1fr 1fr; gap:64px; align-items:center;
        }
        .prompt-row {
          display:flex; align-items:center; gap:10px;
          padding:11px 14px;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.06);
          border-radius:10px;
          font-family:'JetBrains Mono',monospace;
          font-size:0.72rem; color:rgba(255,255,255,0.3);
          margin-bottom:10px;
          transition:border-color 0.2s;
        }
        .prompt-row:hover { border-color:rgba(255,255,255,0.12); }
        .prompt-arrow { color:rgba(255,255,255,0.2); flex-shrink:0; }

        .img-grid { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
        .img-tile {
          border-radius:14px; overflow:hidden;
          background:rgba(255,255,255,0.03);
          border:1px solid rgba(255,255,255,0.07);
          aspect-ratio:1;
          display:flex; align-items:center; justify-content:center;
          font-size:2.8rem; position:relative;
          transition:all 0.3s cubic-bezier(.16,1,.3,1);
        }
        .img-tile:first-child { grid-row:1/3; font-size:4rem; }
        .img-tile:hover { transform:scale(1.03); border-color:rgba(255,255,255,0.14); box-shadow:0 16px 40px rgba(0,0,0,0.5); }
        .img-cap {
          position:absolute; inset:auto 0 0;
          padding:8px 10px;
          background:rgba(0,0,0,0.6);
          backdrop-filter:blur(12px);
          font-size:0.58rem; color:rgba(255,255,255,0.4);
          font-family:'JetBrains Mono',monospace; letter-spacing:0.04em;
          white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        }

        /* ─── PRICING ───────────────────────────────────── */
        .pricing-grid {
          display:grid; grid-template-columns:1fr 1fr;
          gap:12px; margin-top:56px; max-width:680px;
        }
        .price-card {
          border-radius:16px; padding:28px;
          border:1px solid rgba(255,255,255,0.07);
          background:rgba(255,255,255,0.02);
          display:flex; flex-direction:column; gap:18px;
          position:relative; overflow:hidden;
          backdrop-filter:blur(20px);
        }
        .price-card::before {
          content:''; position:absolute; top:0; left:0; right:0; height:1px;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);
        }
        /* Featured card — noticeably brighter */
        .price-card.hi {
          background:rgba(255,255,255,0.05);
          border-color:rgba(255,255,255,0.14);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.1), 0 0 60px rgba(255,255,255,0.03);
        }
        .price-card.hi::before {
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.22),transparent);
        }
        .price-tier {
          font-family:'JetBrains Mono',monospace;
          font-size:0.6rem; font-weight:700; letter-spacing:0.18em;
          text-transform:uppercase; color:rgba(255,255,255,0.3);
        }
        .price-num {
          font-size:3rem; font-weight:700;
          letter-spacing:-0.06em; line-height:1; color:#fff;
        }
        .price-sub { font-size:0.78rem; color:rgba(255,255,255,0.25); margin-top:-10px; }
        .price-perks { list-style:none; display:flex; flex-direction:column; gap:8px; }
        .price-perks li {
          display:flex; gap:8px; align-items:flex-start;
          font-size:0.8rem; color:rgba(255,255,255,0.42); letter-spacing:-0.005em;
        }
        .price-perks li::before { content:'—'; color:rgba(255,255,255,0.2); flex-shrink:0; }

        /* ─── FAQ ───────────────────────────────────────── */
        .faqs { display:flex; flex-direction:column; gap:1px; margin-top:48px; max-width:680px; }
        .faq {
          border-bottom:1px solid rgba(255,255,255,0.06);
          cursor:pointer; transition:background 0.18s;
        }
        .faq:first-child { border-top:1px solid rgba(255,255,255,0.06); }
        .faq-q {
          display:flex; align-items:center; justify-content:space-between;
          padding:18px 4px; font-size:0.88rem; font-weight:500;
          color:rgba(255,255,255,0.65); gap:16px; letter-spacing:-0.015em;
          transition:color 0.18s;
        }
        .faq:hover .faq-q { color:#fff; }
        .faq-icon { color:rgba(255,255,255,0.25); font-size:1rem; flex-shrink:0; transition:transform 0.2s, color 0.18s; }
        .faq.on .faq-icon { transform:rotate(45deg); color:#fff; }
        .faq-a {
          padding:0 4px 18px; font-size:0.82rem;
          color:rgba(255,255,255,0.32); line-height:1.82; letter-spacing:-0.005em;
        }

        /* ─── FINAL CTA ─────────────────────────────────── */
        .fin {
          text-align:center; padding:120px 24px;
          position:relative; overflow:hidden;
          border-top:1px solid rgba(255,255,255,0.05);
        }
        /* Radial glow — understated */
        .fin::before {
          content:''; position:absolute; top:-100px; left:50%; transform:translateX(-50%);
          width:800px; height:500px;
          background:radial-gradient(ellipse at 50% 0%,
            rgba(255,255,255,0.05) 0%,
            transparent 65%);
          pointer-events:none;
        }
        /* Rotating ring — barely visible */
        .fin-ring {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          width:700px; height:700px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.04);
          animation:borderPulse 6s ease-in-out infinite;
          pointer-events:none;
        }
        .fin-ring2 {
          position:absolute; top:50%; left:50%;
          transform:translate(-50%,-50%);
          width:1000px; height:1000px; border-radius:50%;
          border:1px solid rgba(255,255,255,0.02);
          pointer-events:none;
        }
        .fin-h {
          position:relative; z-index:1;
          font-size:clamp(2.4rem,6vw,5rem);
          font-weight:700; letter-spacing:-0.045em; line-height:0.97; color:#fff;
          margin-bottom:20px;
        }
        .fin-h span { color:rgba(255,255,255,0.25); font-weight:300; display:block; }
        .fin-p {
          position:relative; z-index:1;
          font-size:1rem; color:rgba(255,255,255,0.3); line-height:1.7;
          margin-bottom:40px; letter-spacing:-0.01em;
        }
        .fin-btns {
          position:relative; z-index:1;
          display:flex; gap:12px; justify-content:center; flex-wrap:wrap;
        }

        /* ─── FOOTER ────────────────────────────────────── */
        .foot {
          border-top:1px solid rgba(255,255,255,0.06);
          padding:32px 32px;
          display:flex; align-items:center; justify-content:space-between;
          flex-wrap:wrap; gap:16px;
          max-width:1100px; margin:0 auto;
        }
        .foot-logo { font-size:0.82rem; font-weight:600; color:rgba(255,255,255,0.3); display:flex; align-items:center; gap:7px; }
        .foot-links { display:flex; gap:24px; flex-wrap:wrap; }
        .foot-link { font-size:0.76rem; color:rgba(255,255,255,0.22); transition:color 0.15s; }
        .foot-link:hover { color:rgba(255,255,255,0.6); }
        .foot-copy { font-size:0.7rem; color:rgba(255,255,255,0.15); font-family:'JetBrains Mono',monospace; }

        /* ─── RESPONSIVE ────────────────────────────────── */
        @media(max-width:900px){
          .steps,.feats { grid-template-columns:1fr 1fr; }
          .step { border-bottom:1px solid rgba(255,255,255,0.06); }
          .feat:nth-child(3n){ border-right:1px solid rgba(255,255,255,0.06); }
          .feat:nth-child(2n){ border-right:none; }
          .models { grid-template-columns:1fr 1fr; }
          .imggen-inner { grid-template-columns:1fr; gap:40px; }
          .stats-inner { grid-template-columns:1fr 1fr; }
          .pricing-grid { max-width:100%; }
          .nav-center { display:none; }
        }
        @media(max-width:600px){
          .steps,.feats { grid-template-columns:1fr; }
          .models { grid-template-columns:1fr; }
          .pricing-grid { grid-template-columns:1fr; }
          .stats-inner { grid-template-columns:1fr 1fr; }
          .nav-right .nav-signin { display:none; }
        }
      `}</style>

      {/* ─── NAV ──────────────────────────────────────── */}
      <nav className="nav">
        <div className="nav-logo">
          <div className="nav-dot" />
          Universal AI
        </div>
        <div className="nav-center">
          {[["#how","How it works"],["#features","Features"],["#models","Models"],["#pricing","Pricing"]].map(([h,l]) => (
            <a key={h} href={h} className="nav-link">{l}</a>
          ))}
        </div>
        <div className="nav-right">
          <Link href="/login" className="nav-signin">Sign in</Link>
          <Link href="/chat" className="nav-cta">Get started</Link>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <div className="hero-badge-dot">✦</div>
            Groq · Gemini · DeepSeek · NVIDIA — all in one place
          </div>

          <h1 className="hero-h1">
            Every great AI.
            <span className="hero-h1-dim">One place. Free.</span>
          </h1>

          <p className="hero-sub">
            Chat with four of the world's best AI models. Generate images with SDXL.
            Switch models in one click. No credit card. No limits on Groq and Gemini.
          </p>

          <div className="hero-actions">
            <Link href="/chat" className="btn-primary">Start chatting free</Link>
            <Link href="/images" className="btn-secondary">Generate images</Link>
          </div>

          <div className="model-selector">
            <span className="model-selector-label">try →</span>
            {MODELS.map((m, i) => (
              <button key={m.id} className={`model-btn ${activeModel === i ? "active" : ""}`} onClick={() => setActiveModel(i)}>
                <div className="model-btn-dot" />
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chat demo card */}
        <div className="chat-wrap">
          <div className="chat-glass">
            <div className="chat-bar">
              <div className="chat-dots">
                <span className="dot-r"/><span className="dot-y"/><span className="dot-g"/>
              </div>
              <div className="chat-bar-label">Universal AI — {MODELS[activeModel].name} {MODELS[activeModel].full}</div>
              <div className="chat-live"><span/>LIVE</div>
            </div>

            <div className="chat-tabs">
              {MODELS.map((m, i) => (
                <button key={m.id} className={`chat-tab ${activeModel === i ? "on" : ""}`} onClick={() => setActiveModel(i)}>
                  <div className="chat-tab-pip" />{m.name}
                </button>
              ))}
            </div>

            <div className="chat-body">
              {step >= 1 && <div className="msg msg-u">{conv.q}</div>}
              {step === 1 && <div className="typing"><span/><span/><span/></div>}
              {step >= 2 && (
                <div className="msg msg-a">
                  <div className="msg-a-head">
                    <div className="msg-a-icon">✦</div>
                    <span className="msg-a-name">{conv.m}</span>
                    <span className="msg-speed">⚡ {conv.t}</span>
                  </div>
                  <pre className="msg-code">{conv.a}</pre>
                </div>
              )}
            </div>

            <div className="chat-foot">
              <div className="chat-input-mock">Ask anything...</div>
              <Link href="/chat" className="chat-send-btn">↑</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ─── STATS ────────────────────────────────────── */}
      <div className="stats">
        <div className="stats-inner">
          {[["4","AI Models"],["Free","Groq & Gemini"],["SDXL","Image Gen"],["<1s","Groq Speed"]].map(([n,l],i) => (
            <div key={l} className={`stat reveal ${isVis(`s${i}`) ? "visible" : ""}`} data-reveal={`s${i}`} style={{transitionDelay:`${i*0.07}s`}}>
              <div className="stat-n">{n}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─────────────────────────────── */}
      <div id="how" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="sec">
          <div className={`reveal ${isVis("how0") ? "visible" : ""}`} data-reveal="how0">
            <div className="sec-tag">How it works</div>
            <h2 className="sec-h">Three steps to your answer. <em>No friction.</em></h2>
            <p className="sec-p" style={{maxWidth:440}}>No API keys. No setup. No configuration. Open and ask.</p>
          </div>
          <div className="steps">
            {[
              {n:"01",icon:"🎯",t:"Pick your model",d:"Groq for speed, Gemini for depth, DeepSeek for reasoning, NVIDIA for STEM. Or try all four."},
              {n:"02",icon:"✏️",t:"Ask anything",d:"Code, writing, math, analysis, creative work. Any language, any topic, zero restrictions."},
              {n:"03",icon:"⚡",t:"Get your answer",d:"Groq responds in under a second. Unhappy? Switch models in one click and compare."},
            ].map((s,i) => (
              <div key={i} className={`step reveal reveal-d${i+1} ${isVis(`hw${i}`) ? "visible" : ""}`} data-reveal={`hw${i}`}>
                <div className="step-n">STEP {s.n}</div>
                <span className="step-icon">{s.icon}</span>
                <div className="step-t">{s.t}</div>
                <p className="step-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FEATURES ─────────────────────────────────── */}
      <div id="features" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="sec">
          <div className={`reveal ${isVis("f0") ? "visible" : ""}`} data-reveal="f0">
            <div className="sec-tag">Features</div>
            <h2 className="sec-h">Built lean. <em>Every feature earns its place.</em></h2>
          </div>
          <div className="feats">
            {[
              {i:"⚡",t:"Groq is 10× faster",d:"500+ tokens per second from Groq's LPU chips. Answers appear before you finish reading the question."},
              {i:"🎨",t:"SDXL image generation",d:"Describe anything — photorealistic, artistic, abstract, cinematic. Type it, see it. Instantly."},
              {i:"🔄",t:"Switch models instantly",d:"Not satisfied? Same question, different model, one click. Compare four AI outputs side by side."},
              {i:"🆓",t:"Genuinely free",d:"No credit card. No expiring trial. Groq and Gemini are unlimited forever. No hidden fees."},
              {i:"💾",t:"Full chat history",d:"Every conversation saved and searchable. Never lose an answer. Pick up where you left off."},
              {i:"🔒",t:"Privacy by default",d:"We never train on your conversations. Anonymous sessions aren't stored. Your data stays yours."},
            ].map((f,i) => (
              <div key={i} className={`feat reveal reveal-d${(i%3)+1} ${isVis(`ft${i}`) ? "visible" : ""}`} data-reveal={`ft${i}`}>
                <span className="feat-icon">{f.i}</span>
                <div className="feat-t">{f.t}</div>
                <p className="feat-d">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── IMAGE GEN ────────────────────────────────── */}
      <div className="imggen">
        <div className="imggen-inner">
          <div className={`reveal ${isVis("ig0") ? "visible" : ""}`} data-reveal="ig0">
            <div className="sec-tag">Image generation</div>
            <h2 className="sec-h" style={{fontSize:"clamp(1.8rem,3.5vw,2.8rem)"}}>Type a thought. <em>See it instantly.</em></h2>
            <p className="sec-p" style={{maxWidth:360,marginBottom:28}}>SDXL turns your descriptions into studio-quality visuals. Any style, any subject.</p>
            {['"Neon Tokyo street at midnight, cinematic rain"','"Minimalist geometric logo, tech startup"','"Astronaut portrait, oil painting style"'].map((p,i) => (
              <div key={i} className="prompt-row">
                <span className="prompt-arrow">→</span>
                {p}
              </div>
            ))}
            <div style={{marginTop:28}}>
              <Link href="/images" className="btn-primary" style={{display:"inline-flex"}}>Try image generator</Link>
            </div>
          </div>
          <div className={`img-grid reveal reveal-d2 ${isVis("ig1") ? "visible" : ""}`} data-reveal="ig1">
            {[{e:"🌆",c:"neon tokyo midnight"},{e:"🤖",c:"robot oil painting"},{e:"🌊",c:"abstract waves"},{e:"🏔️",c:"mountain summit"}].map((t,i) => (
              <div key={i} className="img-tile" style={{gridRow:i===0?"1/3":"auto"}}>
                <span style={{fontSize:i===0?"4rem":"2.5rem"}}>{t.e}</span>
                <div className="img-cap">{t.c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── MODELS ───────────────────────────────────── */}
      <div id="models" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="sec">
          <div className={`reveal ${isVis("m0") ? "visible" : ""}`} data-reveal="m0">
            <div className="sec-tag">AI Models</div>
            <h2 className="sec-h">Four models. <em>One app.</em></h2>
            <p className="sec-p" style={{maxWidth:440,marginBottom:0}}>Different models excel at different things. Use the right one for the right job.</p>
          </div>
          <div className="models">
            {MODELS.map((m,i) => (
              <div key={m.id} className={`model-card reveal reveal-d${i+1} ${isVis(`mc${i}`) ? "visible" : ""}`} data-reveal={`mc${i}`}>
                <div className="mc-icon">{m.id.slice(0,2).toUpperCase()}</div>
                <div><div className="mc-name">{m.name}</div><div className="mc-sub">{m.full}</div></div>
                <div className="mc-tag">{m.tag}</div>
                <p className="mc-desc">
                  {m.id==="groq"   && "Lightning fast. 500+ tokens/sec via Groq's LPU hardware. Best for coding, quick Q&A, and anything where speed matters."}
                  {m.id==="gemini" && "Google's flagship. Best for long documents, nuanced analysis, deep reasoning, and complex multi-part questions."}
                  {m.id==="deep"   && "Exceptional step-by-step reasoning. Math, logic, and research problems where you want the working shown, not just the answer."}
                  {m.id==="nvidia" && "Strong technical depth. STEM topics, detailed explanations, and scenarios where accuracy and thoroughness beat speed."}
                </p>
                <Link href="/chat" className="mc-link">Try {m.name} →</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── PRICING ──────────────────────────────────── */}
      <div id="pricing" style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="sec">
          <div className={`reveal ${isVis("p0") ? "visible" : ""}`} data-reveal="p0">
            <div className="sec-tag">Pricing</div>
            <h2 className="sec-h">Actually free. <em>No asterisk.</em></h2>
            <p className="sec-p" style={{maxWidth:440}}>Groq and Gemini have generous free tiers. We pass them straight to you — no markup, no paywall.</p>
          </div>
          <div className="pricing-grid">
            {[
              {tier:"Free forever",price:"$0",sub:"Groq + Gemini — unlimited",perks:["Unlimited Groq Llama 3.3","Unlimited Gemini 1.5 Flash","SDXL image generation","Full chat history","No credit card, ever"],hi:true,cta:"Start for free"},
              {tier:"Pay as you go",price:"~$0.001",sub:"per DeepSeek / NVIDIA message",perks:["DeepSeek Chat","NVIDIA Nemotron 3","No monthly subscription","Pay only what you use","Cancel anytime"],hi:false,cta:"Learn more"},
            ].map((p,i) => (
              <div key={i} className={`price-card ${p.hi?"hi":""} reveal reveal-d${i+1} ${isVis(`pc${i}`) ? "visible" : ""}`} data-reveal={`pc${i}`}>
                <div className="price-tier">{p.tier}</div>
                <div className="price-num">{p.price}</div>
                <div className="price-sub">{p.sub}</div>
                <ul className="price-perks">{p.perks.map((k,j)=><li key={j}>{k}</li>)}</ul>
                <Link href="/chat" className={p.hi ? "btn-primary" : "btn-secondary"} style={{textAlign:"center",justifyContent:"center"}}>
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{marginTop:20,fontSize:"0.68rem",color:"rgba(255,255,255,0.18)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.04em"}}>
            No credit card · No trial expiry · No dark patterns
          </p>
        </div>
      </div>

      {/* ─── FAQ ──────────────────────────────────────── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.05)"}}>
        <div className="sec">
          <div className={`reveal ${isVis("fq0") ? "visible" : ""}`} data-reveal="fq0">
            <div className="sec-tag">FAQ</div>
            <h2 className="sec-h">Questions <em>answered.</em></h2>
          </div>
          <div className="faqs">
            {[
              {q:"Is this actually free — what's the catch?",a:"Groq Llama 3.3 and Gemini 1.5 Flash offer genuinely generous free tiers, and we pass them directly to you. DeepSeek and NVIDIA are pay-as-you-go at fractions of a cent per message. No subscription. No bait-and-switch."},
              {q:"How is this different from ChatGPT?",a:"Three key differences: you get four AI models instead of one, Groq is dramatically faster than GPT-4, and it's free — ChatGPT Plus costs $20/month. You also get SDXL image generation without an extra subscription."},
              {q:"Which model should I use for what?",a:"Groq for speed and coding. Gemini for analysis, long documents, nuanced questions. DeepSeek for math and step-by-step reasoning. NVIDIA for deep technical topics. When unsure, start with Groq."},
              {q:"Do you store or train on my conversations?",a:"Conversations are saved only for signed-in users and are only accessible by you. We never use your conversations to train AI models. Anonymous sessions aren't stored at all."},
              {q:"How good is the image generation?",a:"SDXL produces high-quality results across photorealistic, artistic, anime, and abstract styles. Results improve significantly with detailed prompts — describe the lighting, mood, composition, and style you want."},
            ].map((f,i) => (
              <div key={i} className={`faq ${openFaq===i?"on":""}`} onClick={() => setOpenFaq(openFaq===i?null:i)}>
                <div className="faq-q"><span>{f.q}</span><span className="faq-icon">+</span></div>
                {openFaq===i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── FINAL CTA ────────────────────────────────── */}
      <div className="fin">
        <div className="fin-ring" />
        <div className="fin-ring2" />
        <div className={`reveal ${isVis("fc0") ? "visible" : ""}`} data-reveal="fc0">
          <h2 className="fin-h">
            The best AI models.
            <span>All free. All here.</span>
          </h2>
          <p className="fin-p">No signup needed to try. No credit card. Open and chat.</p>
          <div className="fin-btns">
            <Link href="/chat" className="btn-primary" style={{height:52,padding:"0 36px",fontSize:"0.95rem"}}>Open chat — it's free</Link>
            <Link href="/images" className="btn-secondary" style={{height:52,padding:"0 36px",fontSize:"0.95rem"}}>Generate images</Link>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ───────────────────────────────────── */}
      <div style={{borderTop:"1px solid rgba(255,255,255,0.06)"}}>
        <div className="foot">
          <div className="foot-logo">
            <div className="nav-dot" />
            Universal AI
          </div>
          <div className="foot-links">
            {[["#","Privacy"],["#","Terms"],["#","Documentation"],["https://github.com","GitHub"],["#","Contact"]].map(([h,l]) => (
              <a key={l} href={h} className="foot-link">{l}</a>
            ))}
          </div>
          <div className="foot-copy">© 2025 Universal AI</div>
        </div>
      </div>
    </>
  );
}