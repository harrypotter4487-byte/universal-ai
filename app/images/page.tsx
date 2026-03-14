"use client";

import { useState } from "react";

const SUGGESTIONS = [
  "A cyberpunk city at night with neon lights",
  "A majestic lion in a golden savanna",
  "An astronaut floating in colorful nebula",
  "A cozy cabin in snowy mountains",
  "A futuristic underwater city",
  "A dragon flying over ancient castle",
];

export default function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [images, setImages] = useState<{ url: string; prompt: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else if (data.image) {
        setImages(prev => [{ url: data.image, prompt }, ...prev]);
      }
    } catch {
      setError("Failed to generate image. Try again!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#080808", minHeight: "100vh", fontFamily: "'Inter', sans-serif", color: "white" }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:4px; }
        .grid-bg {
          position:fixed; inset:0; z-index:0; pointer-events:none;
          background-image: linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }
        .img-card {
          border-radius:12px; overflow:hidden;
          border:1px solid rgba(255,255,255,0.06);
          transition:all 0.3s; cursor:pointer; position:relative;
        }
        .img-card:hover { transform:translateY(-4px); border-color:rgba(255,255,255,0.15); box-shadow:0 20px 40px rgba(0,0,0,0.5); }
        .img-overlay {
          position:absolute; inset:0;
          background:linear-gradient(transparent 50%, rgba(0,0,0,0.9) 100%);
          opacity:0; transition:opacity 0.3s;
          display:flex; flex-direction:column; justify-content:flex-end; padding:16px;
        }
        .img-card:hover .img-overlay { opacity:1; }
        .prompt-input {
          width:100%; background:transparent; border:none; outline:none;
          color:white; font-size:15px; font-family:'Inter',sans-serif;
          resize:none; line-height:1.6; padding:0;
        }
        .prompt-input::placeholder { color:#333; }
        .suggestion-chip {
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08);
          border-radius:100px; padding:6px 14px; font-size:12px; color:#555;
          cursor:pointer; transition:all 0.2s; white-space:nowrap;
          font-family:'Inter',sans-serif;
        }
        .suggestion-chip:hover { border-color:rgba(255,255,255,0.2); color:#e2e2e2; }
        .gen-btn {
          padding:12px 28px; border-radius:10px; border:none; cursor:pointer;
          font-size:14px; font-weight:600; font-family:'Inter',sans-serif;
          display:flex; align-items:center; gap:8px; transition:all 0.2s;
        }
        .gen-btn:disabled { opacity:0.4; cursor:not-allowed; }
        @keyframes spin { to { transform:rotate(360deg); } }
        @keyframes shimmer {
          0% { background-position:-200% 0; }
          100% { background-position:200% 0; }
        }
        .skeleton {
          background: linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px);} to{opacity:1;transform:translateY(0);} }
        .fade-up { animation:fadeUp 0.4s ease both; }
      `}} />

      <div className="grid-bg" />

      {/* NAV */}
      <nav style={{ position: "sticky", top: 0, zIndex: 100, height: 52, background: "rgba(8,8,8,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(16px)", display: "flex", alignItems: "center" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 32px", width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
            <div style={{ width: 26, height: 26, background: "white", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>Universal AI</span>
          </a>
          <div style={{ display: "flex", gap: 24 }}>
            {[["/", "Home"], ["/chat", "Chat"], ["/images", "Images"]].map(([h, l]) => (
              <a key={h} href={h} style={{ fontSize: 13, color: h === "/images" ? "white" : "#555", textDecoration: "none", fontWeight: h === "/images" ? 500 : 400 }}>{l}</a>
            ))}
          </div>
          <a href="/chat" style={{ fontSize: 13, fontWeight: 600, padding: "7px 18px", borderRadius: 8, background: "white", color: "#080808", textDecoration: "none" }}>
            Try Chat →
          </a>
        </div>
      </nav>

      <div style={{ position: "relative", zIndex: 10, maxWidth: 900, margin: "0 auto", padding: "60px 24px 80px" }}>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 100, padding: "5px 14px", fontSize: 12, color: "#555", marginBottom: 24 }}>
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", boxShadow: "0 0 8px rgba(74,222,128,0.7)" }} />
            Powered by Stable Diffusion XL
          </div>
          <h1 style={{ fontSize: "clamp(2rem,5vw,3.5rem)", fontWeight: 800, color: "white", letterSpacing: "-0.04em", marginBottom: 12 }}>
            AI Image Generator
          </h1>
          <p style={{ fontSize: 16, color: "#555", lineHeight: 1.6 }}>
            Transform your words into stunning visuals — any style, any scene.
          </p>
        </div>

        {/* Prompt Box */}
        <div className="fade-up" style={{ background: "#0d0d0d", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "20px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 12 }}>
            Describe your image
          </div>
          <textarea
            className="prompt-input"
            rows={3}
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && e.ctrlKey) generate(); }}
            placeholder="A breathtaking mountain landscape at golden hour, photorealistic, 8K..."
          />
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 16, paddingTop: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 12, color: "#333" }}>
              {prompt.length > 0 ? `${prompt.length} characters` : "Ctrl+Enter to generate"}
            </span>
            <button
              className="gen-btn"
              onClick={generate}
              disabled={loading || !prompt.trim()}
              style={{ background: prompt.trim() && !loading ? "white" : "#111", color: prompt.trim() && !loading ? "#080808" : "#333" }}
            >
              {loading ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: "spin 1s linear infinite" }}>
                    <path d="M21 12a9 9 0 11-6.219-8.56" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>✦ Generate Image</>
              )}
            </button>
          </div>
        </div>

        {/* Suggestions */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 48 }}>
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggestion-chip" onClick={() => setPrompt(s)}>{s}</button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 24, fontSize: 14, color: "#f87171", display: "flex", alignItems: "center", gap: 8 }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 16 }}>Generating...</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16 }}>
              {[1, 2].map(i => (
                <div key={i} className="skeleton" style={{ aspectRatio: "1", borderRadius: 12 }} />
              ))}
            </div>
          </div>
        )}

        {/* Generated Images */}
        {images.length > 0 && (
          <div className="fade-up">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#333", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                Generated — {images.length} image{images.length > 1 ? "s" : ""}
              </div>
              <button onClick={() => setImages([])} style={{ fontSize: 12, color: "#333", background: "transparent", border: "none", cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                Clear all
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: images.length === 1 ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
              {images.map((img, i) => (
                <div key={i} className="img-card fade-up">
                  <img src={img.url} alt={img.prompt} style={{ width: "100%", display: "block", aspectRatio: images.length === 1 ? "16/9" : "1", objectFit: "cover" }} />
                  <div className="img-overlay">
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5, marginBottom: 10 }}>
                      {img.prompt.length > 80 ? img.prompt.slice(0, 80) + "..." : img.prompt}
                    </p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <a href={img.url} download={`image-${i}.png`} style={{ flex: 1, background: "white", color: "#080808", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, textDecoration: "none" }}>
                        ↓ Download
                      </a>
                      <button onClick={() => setPrompt(img.prompt)} style={{ flex: 1, background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 500, cursor: "pointer", fontFamily: "'Inter', sans-serif" }}>
                        ↺ Regenerate
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && !loading && (
          <div style={{ textAlign: "center", padding: "40px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#222", marginBottom: 8 }}>No images yet</div>
            <div style={{ fontSize: 14, color: "#333" }}>Enter a description above and hit Generate!</div>
          </div>
        )}
      </div>
    </div>
  );
}