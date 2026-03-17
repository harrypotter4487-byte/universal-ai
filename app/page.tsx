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
  const [step,        setStep]        = useState(0);
  const [openFaq,     setOpenFaq]     = useState<number | null>(null);
  const [visible,     setVisible]     = useState<Set<string>>(new Set());
  const [isLoggedIn,  setIsLoggedIn]  = useState(false);  // ✅ NEW
  const [userName,    setUserName]    = useState("");      // ✅ NEW
  const observerRef = useRef<IntersectionObserver | null>(null);

  /* ✅ Check localStorage session on mount */
  useEffect(() => {
    try {
      const session = localStorage.getItem("uai_session");
      if (session) {
        const data = JSON.parse(session);
        setIsLoggedIn(true);
        setUserName(data.email?.split("@")[0] || "User");
      }
    } catch {}
  }, []);

  /* scroll-triggered reveals */
  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const key = e.target.getAttribute("data-reveal") || "";
            setVisible((prev) => new Set(Array.from(prev).concat(key)));
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) =>
      observerRef.current?.observe(el)
    );
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

  const handleLogout = () => {
    localStorage.removeItem("uai_session");
    setIsLoggedIn(false);
    setUserName("");
  };

  return (
    <>
      {/* ── NAV ── */}
      <nav className="nav">
        <a href="/" className="nav-logo">
          <div className="nav-dot" />
          Universal AI
        </a>
        <div className="nav-center">
          {[["#how","How it works"],["#features","Features"],["#models","Models"],["#pricing","Pricing"]].map(([h,l]) => (
            <a key={h} href={h} className="nav-link">{l}</a>
          ))}
        </div>

        {/* ✅ AUTH-AWARE NAV BUTTONS */}
        <div className="nav-right">
          {isLoggedIn ? (
            <>
              {/* Logged in: show user avatar + Open Chat */}
              <div style={{
                display:"flex", alignItems:"center", gap:8,
                padding:"6px 12px", borderRadius:99,
                border:"1px solid rgba(255,255,255,0.1)",
                background:"rgba(255,255,255,0.04)",
                fontSize:"0.78rem", color:"rgba(255,255,255,0.6)"
              }}>
                <div style={{
                  width:24, height:24, borderRadius:"50%",
                  background:"linear-gradient(135deg,#ff9500,#ff453a)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"0.65rem", fontWeight:700, color:"#fff"
                }}>
                  {userName?.[0]?.toUpperCase() || "U"}
                </div>
                {userName}
              </div>
              <Link href="/chat" className="nav-cta">Open chat</Link>
            </>
          ) : (
            <>
              {/* Not logged in: show Sign in + Get started */}
              <Link href="/login" className="nav-signin">Sign in</Link>
              <Link href="/login" className="nav-cta">Get started</Link>
            </>
          )}
        </div>
      </nav>

      {/* ── HERO ── */}
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
            {/* ✅ If logged in → /chat, else → /login */}
            <Link href={isLoggedIn ? "/chat" : "/login"} className="btn-primary">
              {isLoggedIn ? "Open chat" : "Start chatting free"}
            </Link>
            <Link href="/images" className="btn-secondary">Generate images</Link>
          </div>

          <div className="model-selector">
            <span className="model-selector-label">try →</span>
            {MODELS.map((m, i) => (
              <button
                key={m.id}
                className={`model-btn ${activeModel === i ? "active" : ""}`}
                onClick={() => setActiveModel(i)}
              >
                <div className="model-btn-dot" />
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chat demo */}
        <div className="chat-wrap">
          <div className="chat-glass">
            <div className="chat-bar">
              <div className="chat-dots">
                <span className="dot-r" /><span className="dot-y" /><span className="dot-g" />
              </div>
              <div className="chat-bar-label">
                Universal AI — {MODELS[activeModel].name} {MODELS[activeModel].full}
              </div>
              <div className="chat-live"><span />LIVE</div>
            </div>

            <div className="chat-tabs">
              {MODELS.map((m, i) => (
                <button
                  key={m.id}
                  className={`chat-tab ${activeModel === i ? "on" : ""}`}
                  onClick={() => setActiveModel(i)}
                >
                  <div className="chat-tab-pip" />{m.name}
                </button>
              ))}
            </div>

            <div className="chat-body">
              {step >= 1 && <div className="msg msg-u">{conv.q}</div>}
              {step === 1 && (
                <div className="typing"><span /><span /><span /></div>
              )}
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
              <Link href={isLoggedIn ? "/chat" : "/login"} className="chat-send-btn">↑</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="divider" />

      {/* ── STATS ── */}
      <div className="stats">
        <div className="stats-inner">
          {[["4","AI Models"],["Free","Groq & Gemini"],["SDXL","Image Gen"],["<1s","Groq Speed"]].map(([n,l],i) => (
            <div
              key={l}
              className={`stat reveal ${isVis(`s${i}`) ? "visible" : ""} reveal-d${i+1}`}
              data-reveal={`s${i}`}
            >
              <div className="stat-n">{n}</div>
              <div className="stat-l">{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <div id="how" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sec">
          <div className={`reveal ${isVis("how0") ? "visible" : ""}`} data-reveal="how0">
            <div className="sec-tag">How it works</div>
            <h2 className="sec-h">Three steps to your answer. <em>No friction.</em></h2>
            <p className="sec-p" style={{ maxWidth: 440 }}>No API keys. No setup. No configuration. Open and ask.</p>
          </div>
          <div className="steps">
            {[
              { n:"01", icon:"🎯", t:"Pick your model",  d:"Groq for speed, Gemini for depth, DeepSeek for reasoning, NVIDIA for STEM. Or try all four." },
              { n:"02", icon:"✏️", t:"Ask anything",     d:"Code, writing, math, analysis, creative work. Any language, any topic, zero restrictions." },
              { n:"03", icon:"⚡", t:"Get your answer",  d:"Groq responds in under a second. Unhappy? Switch models in one click and compare." },
            ].map((s,i) => (
              <div
                key={i}
                className={`step reveal reveal-d${i+1} ${isVis(`hw${i}`) ? "visible" : ""}`}
                data-reveal={`hw${i}`}
              >
                <div className="step-n">STEP {s.n}</div>
                <span className="step-icon">{s.icon}</span>
                <div className="step-t">{s.t}</div>
                <p className="step-d">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FEATURES ── */}
      <div id="features" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sec">
          <div className={`reveal ${isVis("f0") ? "visible" : ""}`} data-reveal="f0">
            <div className="sec-tag">Features</div>
            <h2 className="sec-h">Built lean. <em>Every feature earns its place.</em></h2>
          </div>
          <div className="feats">
            {[
              { i:"⚡", t:"Groq is 10× faster",        d:"500+ tokens per second. Answers appear before you finish reading the question." },
              { i:"🎨", t:"SDXL image generation",     d:"Describe anything — photorealistic, artistic, cinematic. Type it, see it. Instantly." },
              { i:"🔄", t:"Switch models instantly",   d:"Not satisfied? Same question, different model, one click. Compare four outputs side by side." },
              { i:"🆓", t:"Genuinely free",             d:"No credit card. No expiring trial. Groq and Gemini are unlimited forever." },
              { i:"💾", t:"Full chat history",          d:"Every conversation saved and searchable. Never lose an answer." },
              { i:"🔒", t:"Privacy by default",        d:"We never train on your conversations. Anonymous sessions aren't stored." },
            ].map((f,i) => (
              <div
                key={i}
                className={`feat reveal reveal-d${(i%3)+1} ${isVis(`ft${i}`) ? "visible" : ""}`}
                data-reveal={`ft${i}`}
              >
                <span className="feat-icon">{f.i}</span>
                <div className="feat-t">{f.t}</div>
                <p className="feat-d">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── IMAGE GEN ── */}
      <div className="imggen">
        <div className="imggen-inner">
          <div className={`reveal ${isVis("ig0") ? "visible" : ""}`} data-reveal="ig0">
            <div className="sec-tag">Image generation</div>
            <h2 className="sec-h" style={{ fontSize: "clamp(1.8rem,3.5vw,2.8rem)" }}>
              Type a thought. <em>See it instantly.</em>
            </h2>
            <p className="sec-p" style={{ maxWidth: 360, marginBottom: 28 }}>
              SDXL turns your descriptions into studio-quality visuals. Any style, any subject.
            </p>
            {[
              '"Neon Tokyo street at midnight, cinematic rain"',
              '"Minimalist geometric logo, tech startup"',
              '"Astronaut portrait, oil painting style"',
            ].map((p,i) => (
              <div key={i} className="prompt-row">
                <span className="prompt-arrow">→</span>{p}
              </div>
            ))}
            <div style={{ marginTop: 28 }}>
              <Link href="/images" className="btn-primary" style={{ display: "inline-flex" }}>
                Try image generator
              </Link>
            </div>
          </div>
          <div className={`img-grid reveal reveal-d2 ${isVis("ig1") ? "visible" : ""}`} data-reveal="ig1">
            {[
              { e:"🌆", c:"neon tokyo midnight" },
              { e:"🤖", c:"robot oil painting"  },
              { e:"🌊", c:"abstract waves"       },
              { e:"🏔️", c:"mountain summit"     },
            ].map((t,i) => (
              <div key={i} className="img-tile" style={{ gridRow: i===0 ? "1/3" : "auto" }}>
                <span style={{ fontSize: i===0 ? "4rem" : "2.5rem" }}>{t.e}</span>
                <div className="img-cap">{t.c}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── MODELS ── */}
      <div id="models" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sec">
          <div className={`reveal ${isVis("m0") ? "visible" : ""}`} data-reveal="m0">
            <div className="sec-tag">AI Models</div>
            <h2 className="sec-h">Four models. <em>One app.</em></h2>
            <p className="sec-p" style={{ maxWidth: 440, marginBottom: 0 }}>
              Different models excel at different things. Use the right one for the right job.
            </p>
          </div>
          <div className="models">
            {MODELS.map((m,i) => (
              <div
                key={m.id}
                className={`model-card reveal reveal-d${i+1} ${isVis(`mc${i}`) ? "visible" : ""}`}
                data-reveal={`mc${i}`}
              >
                <div className="mc-icon">{m.id.slice(0,2).toUpperCase()}</div>
                <div><div className="mc-name">{m.name}</div><div className="mc-sub">{m.full}</div></div>
                <div className="mc-tag">{m.tag}</div>
                <p className="mc-desc">
                  {m.id==="groq"   && "Lightning fast. 500+ tokens/sec via Groq's LPU hardware. Best for coding, quick Q&A, and anything where speed matters."}
                  {m.id==="gemini" && "Google's flagship. Best for long documents, nuanced analysis, deep reasoning, and complex multi-part questions."}
                  {m.id==="deep"   && "Exceptional step-by-step reasoning. Math, logic, and research problems where you want the working shown."}
                  {m.id==="nvidia" && "Strong technical depth. STEM topics, detailed explanations, and scenarios where accuracy beats speed."}
                </p>
                {/* ✅ Model try links also auth-aware */}
                <Link href={isLoggedIn ? "/chat" : "/login"} className="mc-link">Try {m.name} →</Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PRICING ── */}
      <div id="pricing" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sec">
          <div className={`reveal ${isVis("p0") ? "visible" : ""}`} data-reveal="p0">
            <div className="sec-tag">Pricing</div>
            <h2 className="sec-h">Actually free. <em>No asterisk.</em></h2>
            <p className="sec-p" style={{ maxWidth: 440 }}>
              Groq and Gemini have generous free tiers. We pass them straight to you.
            </p>
          </div>
          <div className="pricing-grid">
            {[
              { tier:"Free forever",   price:"$0",      sub:"Groq + Gemini — unlimited",          perks:["Unlimited Groq Llama 3.3","Unlimited Gemini 1.5 Flash","SDXL image generation","Full chat history","No credit card, ever"], hi:true,  cta:"Start for free" },
              { tier:"Pay as you go",  price:"~$0.001", sub:"per DeepSeek / NVIDIA message",       perks:["DeepSeek Chat","NVIDIA Nemotron 3","No monthly subscription","Pay only what you use","Cancel anytime"],               hi:false, cta:"Learn more"    },
            ].map((p,i) => (
              <div
                key={i}
                className={`price-card ${p.hi ? "hi" : ""} reveal reveal-d${i+1} ${isVis(`pc${i}`) ? "visible" : ""}`}
                data-reveal={`pc${i}`}
              >
                <div className="price-tier">{p.tier}</div>
                <div className="price-num">{p.price}</div>
                <div className="price-sub">{p.sub}</div>
                <ul className="price-perks">
                  {p.perks.map((k,j) => <li key={j}>{k}</li>)}
                </ul>
                <Link
                  href={isLoggedIn ? "/chat" : "/login"}
                  className={p.hi ? "btn-primary" : "btn-secondary"}
                  style={{ textAlign: "center", justifyContent: "center" }}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 20, fontSize: "0.68rem", color: "rgba(255,255,255,0.18)", fontFamily: "'JetBrains Mono',monospace", letterSpacing: "0.04em" }}>
            No credit card · No trial expiry · No dark patterns
          </p>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="sec">
          <div className={`reveal ${isVis("fq0") ? "visible" : ""}`} data-reveal="fq0">
            <div className="sec-tag">FAQ</div>
            <h2 className="sec-h">Questions <em>answered.</em></h2>
          </div>
          <div className="faqs">
            {[
              { q:"Is this actually free — what's the catch?",       a:"Groq Llama 3.3 and Gemini 1.5 Flash offer genuinely generous free tiers, and we pass them directly to you. DeepSeek and NVIDIA are pay-as-you-go at fractions of a cent. No subscription. No bait-and-switch." },
              { q:"How is this different from ChatGPT?",              a:"Three key differences: you get four AI models instead of one, Groq is dramatically faster than GPT-4, and it's free — ChatGPT Plus costs $20/month. You also get SDXL image generation included." },
              { q:"Which model should I use for what?",               a:"Groq for speed and coding. Gemini for analysis, long documents, nuanced questions. DeepSeek for math and step-by-step reasoning. NVIDIA for deep technical topics. When unsure, start with Groq." },
              { q:"Do you store or train on my conversations?",       a:"Conversations are saved only for signed-in users and are only accessible by you. We never use your conversations to train AI models. Anonymous sessions aren't stored at all." },
              { q:"How good is the image generation?",                a:"SDXL produces high-quality results across photorealistic, artistic, anime, and abstract styles. Results improve significantly with detailed prompts." },
            ].map((f,i) => (
              <div
                key={i}
                className={`faq ${openFaq===i ? "on" : ""}`}
                onClick={() => setOpenFaq(openFaq===i ? null : i)}
              >
                <div className="faq-q">
                  <span>{f.q}</span>
                  <span className="faq-icon">+</span>
                </div>
                {openFaq===i && <div className="faq-a">{f.a}</div>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── FINAL CTA ── */}
      <div className="fin">
        <div className="fin-ring"  />
        <div className="fin-ring2" />
        <div className={`reveal ${isVis("fc0") ? "visible" : ""}`} data-reveal="fc0">
          <h2 className="fin-h">
            The best AI models.
            <span>All free. All here.</span>
          </h2>
          <p className="fin-p">No signup needed to try. No credit card. Open and chat.</p>
          <div className="fin-btns">
            <Link href={isLoggedIn ? "/chat" : "/login"} className="btn-primary" style={{ height: 52, padding: "0 36px", fontSize: "0.95rem" }}>
              {isLoggedIn ? "Open chat" : "Open chat — it's free"}
            </Link>
            <Link href="/images" className="btn-secondary" style={{ height: 52, padding: "0 36px", fontSize: "0.95rem" }}>Generate images</Link>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="foot">
          <a href="/" className="foot-logo">
            <div className="nav-dot" />
            Universal AI
          </a>
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