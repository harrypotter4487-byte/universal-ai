"use client";

import { useState, useRef } from "react";

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
  { id: "none",          label: "None",       icon: "✦"  },
  { id: "photorealistic",label: "Photo",      icon: "📷" },
  { id: "cinematic",     label: "Cinematic",  icon: "🎬" },
  { id: "anime",         label: "Anime",      icon: "⛩"  },
  { id: "oil-painting",  label: "Oil Paint",  icon: "🖌"  },
  { id: "watercolor",    label: "Watercolor", icon: "💧" },
  { id: "3d-render",     label: "3D Render",  icon: "◉"  },
  { id: "sketch",        label: "Sketch",     icon: "✏️" },
];

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  style: string;
  timestamp: Date;
}

export default function ImagesPage() {
  const [prompt,   setPrompt]   = useState("");
  const [style,    setStyle]    = useState("none");
  const [model,    setModel]    = useState("sdxl");
  const [loading,  setLoading]  = useState(false);
  const [images,   setImages]   = useState<GeneratedImage[]>([]);
  const [selected, setSelected] = useState<GeneratedImage | null>(null);
  const taRef = useRef<HTMLTextAreaElement>(null);

  const generate = async (overridePrompt?: string) => {
    const p = (overridePrompt ?? prompt).trim();
    if (!p || loading) return;
    setLoading(true);
    const finalPrompt = style !== "none" ? `${p}, ${style} style` : p;
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: finalPrompt, model }),
      });
      const data = await res.json();
      if (!data?.image) { setLoading(false); return; }
      const img: GeneratedImage = {
        id: Date.now().toString(),
        prompt: p,
        url: data.image,
        style,
        timestamp: new Date(),
      };
      setImages(prev => [img, ...prev]);
      setSelected(img);
    } catch (err) {
      console.error("Generation failed:", err);
    }
    setLoading(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@300;400;500&display=swap');

        *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

        .img-root {
          min-height: 100vh;
          background: #020205;
          color: #e8e8f0;
          font-family: 'DM Sans', sans-serif;
          position: relative;
          overflow-x: hidden;
        }

        /* Ambient background */
        .bg-orb {
          position: fixed;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
          z-index: 0;
        }
        .bg-orb-1 {
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(120,80,255,0.15), transparent);
          top: -200px; left: -100px;
          animation: orbFloat 18s ease-in-out infinite;
        }
        .bg-orb-2 {
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(255,80,120,0.1), transparent);
          bottom: -100px; right: -100px;
          animation: orbFloat 22s ease-in-out infinite reverse;
        }
        .bg-orb-3 {
          width: 400px; height: 400px;
          background: radial-gradient(circle, rgba(80,180,255,0.08), transparent);
          top: 40%; left: 40%;
          animation: orbFloat 14s ease-in-out infinite 4s;
        }
        @keyframes orbFloat {
          0%,100% { transform: translate(0,0) scale(1); }
          33% { transform: translate(40px,-30px) scale(1.08); }
          66% { transform: translate(-30px,40px) scale(0.92); }
        }

        /* Noise grain overlay */
        .grain {
          position: fixed;
          inset: 0;
          z-index: 1;
          pointer-events: none;
          opacity: 0.03;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
          background-size: 200px 200px;
        }

        /* Grid lines */
        .grid-lines {
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background-image:
            linear-gradient(rgba(255,255,255,0.015) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.015) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .content {
          position: relative;
          z-index: 2;
          max-width: 1100px;
          margin: 0 auto;
          padding: 60px 40px;
        }

        /* HEADER */
        .header {
          margin-bottom: 56px;
          animation: fadeUp 0.6s ease both;
        }
        .header-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 99px;
          background: rgba(120,80,255,0.12);
          border: 1px solid rgba(120,80,255,0.25);
          font-size: 0.72rem;
          font-weight: 500;
          color: #a78bfa;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 20px;
        }
        .badge-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background: #a78bfa;
          animation: pulse 2s infinite;
        }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        .header h1 {
          font-family: 'Syne', sans-serif;
          font-size: clamp(2.4rem, 5vw, 4rem);
          font-weight: 800;
          letter-spacing: -0.04em;
          line-height: 1.05;
          background: linear-gradient(135deg, #e8e8f0 0%, #a78bfa 50%, #f472b6 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 12px;
        }
        .header p {
          font-size: 0.95rem;
          color: rgba(232,232,240,0.4);
          font-weight: 300;
        }

        /* MAIN CARD - glass */
        .main-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 24px;
          padding: 36px;
          backdrop-filter: blur(20px);
          box-shadow:
            0 0 0 1px rgba(255,255,255,0.02),
            0 32px 80px rgba(0,0,0,0.5),
            inset 0 1px 0 rgba(255,255,255,0.06);
          margin-bottom: 32px;
          animation: fadeUp 0.6s ease 0.1s both;
        }

        /* MODEL SELECTOR */
        .model-row {
          display: flex;
          gap: 10px;
          margin-bottom: 24px;
        }
        .model-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(232,232,240,0.5);
          font-size: 0.82rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .model-btn:hover {
          border-color: rgba(167,139,250,0.3);
          color: #e8e8f0;
          background: rgba(167,139,250,0.05);
        }
        .model-btn.active {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.1);
          color: #a78bfa;
        }
        .model-icon {
          width: 20px; height: 20px;
          border-radius: 6px;
          background: rgba(167,139,250,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 11px;
        }

        /* PROMPT AREA */
        .prompt-wrap {
          position: relative;
          margin-bottom: 20px;
        }
        .prompt-label {
          font-size: 0.72rem;
          font-weight: 600;
          color: rgba(232,232,240,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-bottom: 10px;
        }
        .prompt-box {
          position: relative;
          border-radius: 16px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.08);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .prompt-box:focus-within {
          border-color: rgba(167,139,250,0.4);
          box-shadow: 0 0 0 3px rgba(167,139,250,0.08), 0 0 30px rgba(167,139,250,0.06);
        }
        .prompt-ta {
          display: block;
          width: 100%;
          min-height: 110px;
          padding: 18px 20px;
          background: transparent;
          border: none;
          outline: none;
          color: #e8e8f0;
          font-size: 0.96rem;
          line-height: 1.6;
          resize: none;
          font-family: 'DM Sans', sans-serif;
          font-weight: 300;
        }
        .prompt-ta::placeholder { color: rgba(232,232,240,0.2); }
        .prompt-foot {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px 14px;
          border-top: 1px solid rgba(255,255,255,0.04);
        }
        .char-count {
          font-size: 0.7rem;
          color: rgba(232,232,240,0.2);
        }

        /* GENERATE BUTTON */
        .gen-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 28px;
          border-radius: 12px;
          background: linear-gradient(135deg, #7c3aed, #a855f7);
          border: none;
          color: #fff;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          font-family: 'DM Sans', sans-serif;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(124,58,237,0.35);
          letter-spacing: 0.02em;
          position: relative;
          overflow: hidden;
        }
        .gen-btn::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
          opacity: 0;
          transition: opacity 0.2s;
        }
        .gen-btn:hover::before { opacity: 1; }
        .gen-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 28px rgba(124,58,237,0.45); }
        .gen-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none; box-shadow: none; }

        .gen-spinner {
          width: 16px; height: 16px;
          border-radius: 50%;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: #fff;
          animation: spin 0.6s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* STYLE SELECTOR */
        .style-section { margin-bottom: 24px; }
        .style-grid {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .style-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.07);
          background: rgba(255,255,255,0.02);
          color: rgba(232,232,240,0.45);
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
        }
        .style-btn:hover {
          border-color: rgba(255,255,255,0.15);
          color: #e8e8f0;
          background: rgba(255,255,255,0.05);
          transform: translateY(-1px);
        }
        .style-btn.active {
          border-color: rgba(167,139,250,0.5);
          background: rgba(167,139,250,0.1);
          color: #a78bfa;
          box-shadow: 0 0 16px rgba(167,139,250,0.1);
        }

        /* SUGGESTIONS */
        .sugg-section { margin-bottom: 8px; }
        .sugg-scroll {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .sugg-btn {
          padding: 7px 14px;
          border-radius: 99px;
          border: 1px solid rgba(255,255,255,0.06);
          background: rgba(255,255,255,0.02);
          color: rgba(232,232,240,0.35);
          font-size: 0.75rem;
          cursor: pointer;
          transition: all 0.18s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .sugg-btn:hover {
          border-color: rgba(244,114,182,0.3);
          color: #f9a8d4;
          background: rgba(244,114,182,0.05);
          transform: translateY(-1px);
        }

        /* PREVIEW */
        .preview-card {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 32px;
          animation: fadeUp 0.4s ease both;
        }
        .preview-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .preview-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(232,232,240,0.4);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .preview-actions {
          display: flex;
          gap: 8px;
        }
        .action-btn {
          padding: 6px 14px;
          border-radius: 8px;
          border: 1px solid rgba(255,255,255,0.08);
          background: transparent;
          color: rgba(232,232,240,0.5);
          font-size: 0.72rem;
          cursor: pointer;
          transition: all 0.15s;
          font-family: 'DM Sans', sans-serif;
        }
        .action-btn:hover {
          background: rgba(255,255,255,0.06);
          color: #e8e8f0;
          border-color: rgba(255,255,255,0.15);
        }
        .preview-img {
          display: block;
          width: 100%;
          max-height: 600px;
          object-fit: contain;
          background: #0a0a0f;
        }
        .preview-footer {
          padding: 16px 20px;
          background: rgba(0,0,0,0.2);
        }
        .preview-prompt {
          font-size: 0.84rem;
          color: rgba(232,232,240,0.45);
          line-height: 1.5;
        }
        .preview-meta {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }
        .meta-tag {
          padding: 3px 10px;
          border-radius: 99px;
          background: rgba(167,139,250,0.1);
          border: 1px solid rgba(167,139,250,0.2);
          font-size: 0.68rem;
          color: #a78bfa;
          font-weight: 500;
        }

        /* LOADING SHIMMER */
        .loading-preview {
          background: rgba(255,255,255,0.02);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          overflow: hidden;
          margin-bottom: 32px;
          height: 400px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          animation: fadeUp 0.3s ease both;
        }
        .loading-orb {
          width: 64px; height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #7c3aed, #a855f7, #f472b6);
          animation: loadSpin 2s linear infinite;
          position: relative;
        }
        .loading-orb::after {
          content: '';
          position: absolute;
          inset: 4px;
          border-radius: 50%;
          background: #020205;
        }
        @keyframes loadSpin {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.1); }
          100% { transform: rotate(360deg) scale(1); }
        }
        .loading-text {
          font-family: 'Syne', sans-serif;
          font-size: 0.9rem;
          color: rgba(232,232,240,0.3);
          letter-spacing: 0.05em;
        }
        .loading-dots::after {
          content: '';
          animation: dots 1.5s infinite;
        }
        @keyframes dots {
          0% { content: ''; }
          33% { content: '.'; }
          66% { content: '..'; }
          100% { content: '...'; }
        }

        /* IMAGE GRID */
        .grid-section {}
        .grid-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .grid-title {
          font-family: 'Syne', sans-serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(232,232,240,0.3);
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
        .grid-count {
          font-size: 0.72rem;
          color: rgba(232,232,240,0.2);
        }
        .img-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }
        .img-card {
          border-radius: 14px;
          overflow: hidden;
          cursor: pointer;
          border: 1px solid rgba(255,255,255,0.06);
          transition: all 0.2s;
          position: relative;
          background: rgba(255,255,255,0.02);
          animation: fadeUp 0.4s ease both;
        }
        .img-card:hover {
          border-color: rgba(167,139,250,0.3);
          transform: translateY(-3px);
          box-shadow: 0 12px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(167,139,250,0.15);
        }
        .img-card.selected {
          border-color: rgba(167,139,250,0.6);
          box-shadow: 0 0 0 2px rgba(167,139,250,0.3);
        }
        .img-card img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          display: block;
          transition: transform 0.3s;
        }
        .img-card:hover img { transform: scale(1.03); }
        .img-card-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 50%);
          opacity: 0;
          transition: opacity 0.2s;
          display: flex;
          align-items: flex-end;
          padding: 12px;
        }
        .img-card:hover .img-card-overlay { opacity: 1; }
        .img-card-prompt {
          font-size: 0.68rem;
          color: rgba(232,232,240,0.8);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* EMPTY STATE */
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 40px;
          text-align: center;
          border: 1px dashed rgba(255,255,255,0.06);
          border-radius: 20px;
          background: rgba(255,255,255,0.01);
        }
        .empty-icon {
          width: 64px; height: 64px;
          border-radius: 18px;
          background: rgba(167,139,250,0.08);
          border: 1px solid rgba(167,139,250,0.15);
          display: flex; align-items: center; justify-content: center;
          font-size: 26px;
          margin-bottom: 16px;
        }
        .empty-title {
          font-family: 'Syne', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: rgba(232,232,240,0.3);
          margin-bottom: 8px;
        }
        .empty-sub {
          font-size: 0.8rem;
          color: rgba(232,232,240,0.15);
          line-height: 1.6;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        @media(max-width: 640px) {
          .content { padding: 32px 20px; }
          .main-card { padding: 24px 20px; }
          .model-row { flex-wrap: wrap; }
        }
      `}</style>

      <div className="img-root">
        <div className="bg-orb bg-orb-1"/>
        <div className="bg-orb bg-orb-2"/>
        <div className="bg-orb bg-orb-3"/>
        <div className="grain"/>
        <div className="grid-lines"/>

        <div className="content">

          {/* HEADER */}
          <div className="header">
            <div className="header-badge">
              <div className="badge-dot"/>
              AI Powered · Free
            </div>
            <h1>Image Generator</h1>
            <p>Transform your imagination into stunning visuals with SDXL & Flux</p>
          </div>

          {/* MAIN CARD */}
          <div className="main-card">

            {/* MODEL */}
            <div className="prompt-label">Model</div>
            <div className="model-row">
              {[
                { v:"sdxl", label:"Stable Diffusion XL", icon:"⚡" },
                { v:"flux",  label:"Flux · NVIDIA",       icon:"◈"  },
              ].map(m=>(
                <button
                  key={m.v}
                  className={`model-btn ${model===m.v?"active":""}`}
                  onClick={()=>setModel(m.v)}
                >
                  <div className="model-icon">{m.icon}</div>
                  {m.label}
                </button>
              ))}
            </div>

            {/* PROMPT */}
            <div className="prompt-wrap">
              <div className="prompt-label">Describe your image</div>
              <div className="prompt-box">
                <textarea
                  ref={taRef}
                  className="prompt-ta"
                  value={prompt}
                  placeholder="A hyper-realistic portrait of a futuristic samurai warrior at dusk..."
                  onChange={e=>setPrompt(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();generate();}}}
                />
                <div className="prompt-foot">
                  <span className="char-count">{prompt.length} / 500</span>
                  <button
                    className="gen-btn"
                    onClick={()=>generate()}
                    disabled={!prompt||loading}
                  >
                    {loading
                      ? <><div className="gen-spinner"/>Generating...</>
                      : <>✦ Generate</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* STYLE */}
            <div className="style-section">
              <div className="prompt-label">Style</div>
              <div className="style-grid">
                {STYLES.map(s=>(
                  <button
                    key={s.id}
                    className={`style-btn ${style===s.id?"active":""}`}
                    onClick={()=>setStyle(s.id)}
                  >
                    {s.icon} {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* SUGGESTIONS */}
            <div className="sugg-section">
              <div className="prompt-label">Quick ideas</div>
              <div className="sugg-scroll">
                {SUGGESTIONS.map((s,i)=>(
                  <button
                    key={i}
                    className="sugg-btn"
                    onClick={()=>{ setPrompt(s); generate(s); }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* LOADING */}
          {loading && (
            <div className="loading-preview">
              <div className="loading-orb"/>
              <div className="loading-text">
                <span className="loading-dots">Creating your masterpiece</span>
              </div>
            </div>
          )}

          {/* SELECTED PREVIEW */}
          {selected && !loading && (
            <div className="preview-card">
              <div className="preview-header">
                <span className="preview-title">✦ Latest Generation</span>
                <div className="preview-actions">
                  <a
                    href={selected.url}
                    download="generated.png"
                    className="action-btn"
                    style={{textDecoration:"none",display:"inline-block"}}
                  >
                    ↓ Download
                  </a>
                  <button className="action-btn" onClick={()=>navigator.clipboard.writeText(selected.url)}>
                    📋 Copy URL
                  </button>
                </div>
              </div>
              <img
                src={selected.url}
                alt={selected.prompt}
                className="preview-img"
              />
              <div className="preview-footer">
                <div className="preview-prompt">{selected.prompt}</div>
                <div className="preview-meta">
                  <span className="meta-tag">{model === "sdxl" ? "SDXL" : "Flux"}</span>
                  {selected.style !== "none" && (
                    <span className="meta-tag">{selected.style}</span>
                  )}
                  <span className="meta-tag">
                    {selected.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* GRID */}
          <div className="grid-section">
            <div className="grid-header">
              <span className="grid-title">Gallery</span>
              <span className="grid-count">{images.length} image{images.length !== 1 ? "s" : ""}</span>
            </div>

            {images.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎨</div>
                <div className="empty-title">No images yet</div>
                <div className="empty-sub">
                  Describe your vision above and hit Generate<br/>
                  Your creations will appear here
                </div>
              </div>
            ) : (
              <div className="img-grid">
                {images.map(img=>(
                  <div
                    key={img.id}
                    className={`img-card ${selected?.id===img.id?"selected":""}`}
                    onClick={()=>setSelected(img)}
                  >
                    <img src={img.url} alt={img.prompt}/>
                    <div className="img-card-overlay">
                      <div className="img-card-prompt">{img.prompt}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}