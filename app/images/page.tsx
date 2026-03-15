"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

const SUGGESTIONS = [
  "A cyberpunk city at night with neon lights",
  "A majestic lion in a golden savanna",
  "An astronaut floating in colorful nebula",
  "A cozy cabin in snowy mountains",
  "A futuristic underwater city",
  "A dragon flying over ancient castle",
  "Hyper-realistic portrait of a samurai",
  "Bioluminescent forest at midnight",
];

const STYLES = [
  { id: "none",           label: "None",       icon: "✦"  },
  { id: "photorealistic", label: "Photo",      icon: "📷" },
  { id: "cinematic",      label: "Cinematic",  icon: "🎬" },
  { id: "anime",          label: "Anime",      icon: "⛩"  },
  { id: "oil-painting",   label: "Oil Paint",  icon: "🖌"  },
  { id: "watercolor",     label: "Watercolor", icon: "💧" },
  { id: "3d-render",      label: "3D Render",  icon: "◉"  },
  { id: "sketch",         label: "Sketch",     icon: "✏️" },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  style: string;
  timestamp: Date;
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap');
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
html{scroll-behavior:smooth;}
::-webkit-scrollbar{width:3px;}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}
@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes imgReveal{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:scale(1)}}
@keyframes shimmer{0%{background-position:-400% center}100%{background-position:400% center}}
.img-a0{animation-delay:0s}.img-a1{animation-delay:.05s}.img-a2{animation-delay:.1s}.img-a3{animation-delay:.15s}.img-a4{animation-delay:.2s}.img-a5{animation-delay:.25s}
.bg-noise{position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.025;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");}
.bg-glow{position:fixed;top:-250px;left:50%;transform:translateX(-50%);width:1100px;height:700px;pointer-events:none;z-index:0;background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.06) 0%,transparent 65%);}
.i-nav{position:fixed;inset:0 0 auto;z-index:100;height:52px;display:flex;align-items:center;justify-content:space-between;padding:0 28px;background:rgba(0,0,0,0.7);backdrop-filter:blur(24px) saturate(200%);-webkit-backdrop-filter:blur(24px) saturate(200%);border-bottom:1px solid rgba(255,255,255,0.07);}
.i-nav-logo{display:flex;align-items:center;gap:8px;font-size:0.88rem;font-weight:600;letter-spacing:-0.02em;color:#fff;text-decoration:none;}
.i-nav-logo-icon{width:28px;height:28px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;}
.i-nav-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:2px;}
.i-nav-link{padding:5px 14px;border-radius:7px;font-size:0.8rem;font-weight:500;color:rgba(255,255,255,0.38);transition:color .15s,background .15s;text-decoration:none;font-family:'DM Sans',-apple-system,sans-serif;}
.i-nav-link:hover{color:#fff;background:rgba(255,255,255,0.06);}
.i-nav-link.on{color:#fff;background:rgba(255,255,255,0.07);}
.i-nav-cta{height:32px;padding:0 16px;border-radius:8px;background:#fff;color:#000;font-size:0.8rem;font-weight:600;display:flex;align-items:center;text-decoration:none;transition:opacity .15s,transform .15s;font-family:'DM Sans',-apple-system,sans-serif;}
.i-nav-cta:hover{opacity:0.85;transform:scale(0.98);}
.i-hero{padding:110px 24px 36px;text-align:center;position:relative;z-index:1;}
.i-badge{display:inline-flex;align-items:center;gap:7px;padding:5px 14px;border-radius:99px;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.04);font-size:0.7rem;font-weight:500;color:rgba(255,255,255,0.4);letter-spacing:0.01em;margin-bottom:26px;animation:fadeUp .6s ease both;font-family:'DM Sans',-apple-system,sans-serif;}
.i-badge-dot{width:6px;height:6px;border-radius:50%;background:#fff;opacity:0.55;animation:pulse 2.5s ease-in-out infinite;}
.i-h1{font-family:'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif;font-size:clamp(2.8rem,8vw,6rem);font-weight:700;letter-spacing:-0.05em;line-height:0.93;color:#fff;margin-bottom:18px;animation:fadeUp .6s .07s ease both;}
.i-h1-dim{display:block;color:rgba(255,255,255,0.22);font-weight:300;letter-spacing:-0.04em;font-size:0.8em;margin-top:5px;font-family:'DM Sans',-apple-system,sans-serif;}
.i-sub{font-size:clamp(0.88rem,1.8vw,1rem);color:rgba(255,255,255,0.3);line-height:1.72;letter-spacing:-0.01em;max-width:460px;margin:0 auto;animation:fadeUp .6s .14s ease both;font-family:'DM Sans',-apple-system,sans-serif;}
.i-main{max-width:840px;margin:0 auto;padding:36px 24px 80px;position:relative;z-index:1;}
.i-glass{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.13);border-radius:20px;backdrop-filter:blur(40px) saturate(1.8) brightness(1.1);-webkit-backdrop-filter:blur(40px) saturate(1.8) brightness(1.1);box-shadow:inset 0 1px 0 rgba(255,255,255,0.18),inset 0 -1px 0 rgba(255,255,255,0.04),0 2px 4px rgba(0,0,0,0.3),0 24px 48px rgba(0,0,0,0.5);overflow:hidden;margin-bottom:13px;transition:border-color .25s,box-shadow .25s;animation:fadeUp .6s .18s ease both;}
.i-glass:focus-within{border-color:rgba(255,255,255,0.25);box-shadow:inset 0 1px 0 rgba(255,255,255,0.22),inset 0 -1px 0 rgba(255,255,255,0.06),0 2px 4px rgba(0,0,0,0.3),0 32px 64px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.05);}
.i-lbl{display:block;padding:15px 18px 0;font-size:0.56rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;}
.i-ta{display:block;width:100%;min-height:96px;max-height:180px;padding:8px 18px 14px;background:transparent;border:none;outline:none;resize:none;color:#fff;font-size:0.94rem;line-height:1.72;letter-spacing:-0.01em;font-family:'DM Sans',-apple-system,sans-serif;font-weight:400;}
.i-ta::placeholder{color:rgba(255,255,255,0.2);}
.i-prog{height:1px;background:rgba(255,255,255,0.07);position:relative;overflow:hidden;}
.i-prog-fill{position:absolute;top:0;left:0;height:100%;background:linear-gradient(90deg,rgba(255,255,255,0.1),rgba(255,255,255,0.8),rgba(255,255,255,0.1));background-size:300%;transition:width .28s ease;animation:shimmer 1.6s linear infinite;}
.i-foot{display:flex;align-items:center;justify-content:space-between;padding:10px 14px 13px;}
.i-hint{font-size:0.62rem;color:rgba(255,255,255,0.18);font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;}
.i-btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 18px;background:#fff;color:#000;border:none;border-radius:99px;font-size:0.8rem;font-weight:600;letter-spacing:-0.01em;cursor:pointer;transition:all .2s cubic-bezier(.16,1,.3,1);font-family:'DM Sans',-apple-system,sans-serif;}
.i-btn:hover:not(:disabled){transform:scale(1.05);box-shadow:0 0 28px rgba(255,255,255,0.2);}
.i-btn:disabled{opacity:0.22;cursor:not-allowed;}
.i-spin{width:13px;height:13px;border-radius:50%;border:2px solid rgba(0,0,0,0.15);border-top-color:#000;animation:spin .65s linear infinite;}
.i-styles{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:13px;animation:fadeUp .6s .22s ease both;}
.i-spill{display:flex;align-items:center;gap:5px;padding:6px 13px;border-radius:99px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.09);backdrop-filter:blur(12px);font-size:0.73rem;font-weight:500;color:rgba(255,255,255,0.38);cursor:pointer;transition:all .18s;white-space:nowrap;font-family:'DM Sans',-apple-system,sans-serif;}
.i-spill:hover{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.75);border-color:rgba(255,255,255,0.16);}
.i-spill.on{background:rgba(255,255,255,0.11);border-color:rgba(255,255,255,0.24);color:#fff;box-shadow:inset 0 1px 0 rgba(255,255,255,0.12);}
.i-suggs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:34px;animation:fadeUp .6s .26s ease both;}
.i-chip{padding:5px 12px;border-radius:99px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);backdrop-filter:blur(8px);font-size:0.72rem;color:rgba(255,255,255,0.32);cursor:pointer;transition:all .18s;white-space:nowrap;font-family:'DM Sans',-apple-system,sans-serif;}
.i-chip:hover{background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.72);border-color:rgba(255,255,255,0.14);transform:translateY(-1px);}
.i-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:12px;animation:fadeUp .6s .3s ease both;}
.i-skel{border-radius:16px;aspect-ratio:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);position:relative;overflow:hidden;}
.i-skel::after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.04),transparent);background-size:200% 100%;animation:shimmer 2s linear infinite;}
.i-skel-body{display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:10px;}
.i-skel-ring{width:26px;height:26px;border-radius:50%;border:2px solid rgba(255,255,255,0.07);border-top-color:rgba(255,255,255,0.35);animation:spin 1s linear infinite;}
.i-skel-txt{font-size:0.68rem;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace;}
.i-tile{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,0.09);aspect-ratio:1;cursor:pointer;position:relative;transition:all .3s cubic-bezier(.16,1,.3,1);animation:imgReveal .4s ease both;background:rgba(255,255,255,0.03);}
.i-tile::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;z-index:2;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.15),transparent);}
.i-tile:hover{transform:scale(1.025);border-color:rgba(255,255,255,0.18);box-shadow:0 20px 56px rgba(0,0,0,0.65);}
.i-tile img{width:100%;height:100%;object-fit:cover;display:block;}
.i-tile-ov{position:absolute;inset:0;z-index:3;background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,transparent 55%);opacity:0;transition:opacity .22s;display:flex;align-items:flex-end;padding:12px;}
.i-tile:hover .i-tile-ov{opacity:1;}
.i-tile-txt{font-size:0.7rem;color:rgba(255,255,255,0.65);line-height:1.45;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;font-family:'DM Sans',-apple-system,sans-serif;}
.i-empty{text-align:center;padding:56px 20px;}
.i-empty-icon{font-size:2.5rem;opacity:0.2;margin-bottom:14px;}
.i-empty-txt{font-size:0.86rem;color:rgba(255,255,255,0.2);line-height:1.75;font-family:'DM Sans',-apple-system,sans-serif;}
.lb-bg{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,0.88);backdrop-filter:blur(28px);-webkit-backdrop-filter:blur(28px);display:flex;align-items:center;justify-content:center;padding:20px;animation:fadeIn .18s ease;}
.lb-wrap{max-width:880px;width:100%;display:grid;grid-template-columns:1fr 320px;gap:20px;align-items:start;animation:fadeUp .22s ease both;position:relative;}
.lb-close{position:absolute;top:-10px;right:0;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,0.45);cursor:pointer;transition:all .18s;font-family:'DM Sans',sans-serif;}
.lb-close:hover{background:rgba(255,255,255,0.13);color:#fff;}
.lb-img{border-radius:18px;overflow:hidden;border:1px solid rgba(255,255,255,0.1);box-shadow:0 40px 80px rgba(0,0,0,0.8);aspect-ratio:1;}
.lb-img img{width:100%;height:100%;object-fit:cover;display:block;}
.lb-panel{background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.1);border-radius:18px;padding:22px;backdrop-filter:blur(40px) saturate(1.6);-webkit-backdrop-filter:blur(40px) saturate(1.6);box-shadow:inset 0 1px 0 rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:18px;}
.lb-sec{font-size:0.56rem;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace;margin-bottom:5px;}
.lb-p{font-size:0.86rem;color:rgba(255,255,255,0.65);line-height:1.78;letter-spacing:-0.005em;font-family:'DM Sans',-apple-system,sans-serif;}
.lb-tag{display:inline-block;padding:3px 10px;border-radius:99px;font-size:0.64rem;font-weight:600;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.42);font-family:'JetBrains Mono',monospace;}
.lb-acts{display:flex;flex-direction:column;gap:7px;}
.lb-act{display:flex;align-items:center;justify-content:center;gap:7px;height:38px;border-radius:10px;font-size:0.78rem;font-weight:600;cursor:pointer;transition:all .18s;letter-spacing:-0.01em;font-family:'DM Sans',-apple-system,sans-serif;}
.lb-act.p{background:#fff;color:#000;border:none;}.lb-act.p:hover{background:rgba(255,255,255,0.88);transform:scale(1.02);}
.lb-act.g{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.45);border:1px solid rgba(255,255,255,0.09);}.lb-act.g:hover{background:rgba(255,255,255,0.09);color:#fff;border-color:rgba(255,255,255,0.16);}
@media(max-width:720px){.lb-wrap{grid-template-columns:1fr;}.i-nav-center{display:none;}.i-grid{grid-template-columns:repeat(2,1fr);gap:8px;}}
@media(max-width:440px){.i-grid{grid-template-columns:1fr;}}
`;

export default function ImagesPage() {
  const [prompt,   setPrompt]   = useState("");
  const [style,    setStyle]    = useState("none");
  const [loading,  setLoading]  = useState(false);
  const [images,   setImages]   = useState<GeneratedImage[]>([]);
  const [selected, setSelected] = useState<GeneratedImage | null>(null);
  const [progress, setProgress] = useState(0);
  const [mounted,  setMounted]  = useState(false);

  const taRef       = useRef<HTMLTextAreaElement>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* mount guard — prevents hydration mismatch */
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!taRef.current) return;
    taRef.current.style.height = "auto";
    taRef.current.style.height = Math.min(taRef.current.scrollHeight, 180) + "px";
  }, [prompt]);

  const startProgress = () => {
    setProgress(0);
    progressRef.current = setInterval(() => {
      setProgress(p => { if (p >= 90) { clearInterval(progressRef.current!); return 90; } return p + Math.random() * 7; });
    }, 280);
  };
  const finishProgress = () => {
    clearInterval(progressRef.current!);
    setProgress(100);
    setTimeout(() => setProgress(0), 500);
  };

  const generate = async (overridePrompt?: string) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || loading) return;
    setLoading(true); startProgress();
    const full = style !== "none" ? `${p}, ${style} style` : p;
    try {
      const res  = await fetch("/api/images", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: full }) });
      const data = await res.json();
      const url  = data.imageUrl || data.url || data.image || "";
      if (url) {
        const img: GeneratedImage = { id: Date.now().toString(), prompt: p, url, style, timestamp: new Date() };
        setImages(prev => [img, ...prev]);
        setSelected(img);
      }
    } catch { console.error("Failed"); }
    finishProgress(); setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); generate(); }
  };

  /* Don't render until client-side to avoid hydration issues */
  if (!mounted) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#000", color: "#fff", fontFamily: "'DM Sans',-apple-system,BlinkMacSystemFont,sans-serif" }}>

      {/* Inject CSS only on client */}
      <style dangerouslySetInnerHTML={{ __html: CSS }} />

      <div className="bg-noise" />
      <div className="bg-glow"  />

      {/* ── NAV ── */}
      <nav className="i-nav">
        <Link href="/" className="i-nav-logo">
          <div className="i-nav-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          Universal AI
        </Link>
        <div className="i-nav-center">
          {[["/" ,"Home"],["/chat","Chat"],["/images","Images"]].map(([h,l]) => (
            <Link key={h} href={h} className={`i-nav-link ${l === "Images" ? "on" : ""}`}>{l}</Link>
          ))}
        </div>
        <Link href="/chat" className="i-nav-cta">Try Chat →</Link>
      </nav>

      {/* ── HERO ── */}
      <div className="i-hero">
        <div className="i-badge">
          <div className="i-badge-dot" />
          Powered by Stable Diffusion XL
        </div>
        <h1 className="i-h1">
          AI Image Generator
          <span className="i-h1-dim">Type it. See it. Instantly.</span>
        </h1>
        <p className="i-sub">Transform your words into stunning visuals — any style, any scene.</p>
      </div>

      {/* ── MAIN ── */}
      <div className="i-main">

        {/* GLASS INPUT */}
        <div className="i-glass">
          <label className="i-lbl">Describe your image</label>
          <textarea
            ref={taRef}
            className="i-ta"
            placeholder="A breathtaking mountain landscape at golden hour, photorealistic, 8K..."
            value={prompt}
            rows={3}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={handleKey}
          />
          <div className="i-prog">
            {loading && <div className="i-prog-fill" style={{ width: `${progress}%` }} />}
          </div>
          <div className="i-foot">
            <span className="i-hint">
              {loading ? `Generating… ${Math.round(progress)}%` : "Ctrl + Enter to generate"}
            </span>
            <button className="i-btn" onClick={() => generate()} disabled={!prompt.trim() || loading}>
              {loading ? <><div className="i-spin" />Generating</> : <>✦ Generate Image</>}
            </button>
          </div>
        </div>

        {/* STYLE PILLS */}
        <div className="i-styles">
          {STYLES.map(s => (
            <button key={s.id} className={`i-spill ${style === s.id ? "on" : ""}`} onClick={() => setStyle(s.id)}>
              <span style={{ fontSize: 13 }}>{s.icon}</span> {s.label}
            </button>
          ))}
        </div>

        {/* SUGGESTION CHIPS */}
        <div className="i-suggs">
          {SUGGESTIONS.map((s, i) => (
            <button key={i} className="i-chip" onClick={() => { setPrompt(s); generate(s); }}>{s}</button>
          ))}
        </div>

        {/* IMAGE AREA */}
        {loading && images.length === 0 ? (
          <div className="i-grid">
            <div className="i-skel">
              <div className="i-skel-body">
                <div className="i-skel-ring" />
                <div className="i-skel-txt">Generating…</div>
              </div>
            </div>
          </div>
        ) : images.length > 0 ? (
          <div className="i-grid">
            {loading && (
              <div className="i-skel">
                <div className="i-skel-body">
                  <div className="i-skel-ring" />
                  <div className="i-skel-txt">{Math.round(progress)}%</div>
                </div>
              </div>
            )}
            {images.map((img, i) => (
              <div key={img.id} className={`i-tile img-a${Math.min(i, 5)}`} onClick={() => setSelected(img)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.url} alt={img.prompt} loading="lazy" />
                <div className="i-tile-ov">
                  <div className="i-tile-txt">{img.prompt}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="i-empty">
            <div className="i-empty-icon">🎨</div>
            <p className="i-empty-txt">Describe any scene and hit Generate.<br />Your creations will appear here.</p>
          </div>
        )}
      </div>

      {/* ── LIGHTBOX ── */}
      {selected && (
        <div className="lb-bg" onClick={() => setSelected(null)}>
          <div className="lb-wrap" onClick={e => e.stopPropagation()}>
            <button className="lb-close" onClick={() => setSelected(null)}>✕</button>
            <div className="lb-img">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.url} alt={selected.prompt} />
            </div>
            <div className="lb-panel">
              <div>
                <div className="lb-sec">Prompt</div>
                <p className="lb-p">{selected.prompt}</p>
              </div>
              {selected.style !== "none" && (
                <div>
                  <div className="lb-sec">Style</div>
                  <span className="lb-tag">{selected.style}</span>
                </div>
              )}
              <div>
                <div className="lb-sec">Generated</div>
                <p style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.25)", fontFamily: "'JetBrains Mono',monospace" }}>
                  {selected.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <div className="lb-acts">
                <a className="lb-act p"
                  href={selected.url} download={`image-${selected.id}.png`}
                  target="_blank" rel="noopener noreferrer">
                  ↓ Download
                </a>
                <button className="lb-act g" onClick={() => { setPrompt(selected.prompt); setSelected(null); }}>
                  ↺ Regenerate
                </button>
                <button className="lb-act g" onClick={() => setSelected(null)}>
                  ✕ Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}