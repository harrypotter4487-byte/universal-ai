"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

const MODELS = [
  { value: 'groq',     provider: 'Groq',   label: 'Llama 3.3',  icon: '⚡', color: '#a78bfa', tag: 'FREE' },
  { value: 'gemini',   provider: 'Gemini', label: 'Flash 1.5',  icon: '✦',  color: '#34d399', tag: 'FREE' },
  { value: 'deepseek', provider: 'DeepSeek', label: 'R1',       icon: '🔮', color: '#60a5fa', tag: 'PAID' },
  { value: 'nemotron', provider: 'NVIDIA', label: 'Nemotron 3', icon: '🟢', color: '#f472b6', tag: 'FREE' },
]

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("groq");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
          message: text,
          model: model,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "No reply received.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply, model }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", content: "❌ Error: Try again!", model }]);
    } finally {
      setLoading(false);
    }
  };

  const currentModel = MODELS.find(m => m.value === model)!;

  return (
    <div style={{ display: "flex", height: "100vh", flexDirection: "column", background: "#080808", color: "white", fontFamily: "'Inter', sans-serif" }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:4px; }
        .md p { margin-bottom:10px; line-height:1.75; color:#ccc; font-size:15px; }
        .md p:last-child { margin-bottom:0; }
        .md strong { color:#fff; font-weight:600; }
        .md h1,.md h2,.md h3 { color:white; font-weight:700; margin:14px 0 8px; letter-spacing:-0.02em; }
        .md h1{font-size:20px;} .md h2{font-size:17px;} .md h3{font-size:15px;}
        .md ul,.md ol { padding-left:20px; margin-bottom:10px; }
        .md li { margin-bottom:5px; line-height:1.7; color:#ccc; font-size:15px; }
        .md code { background:#1a1a1a; border:1px solid #2a2a2a; padding:2px 7px; border-radius:5px; font-size:13px; font-family:monospace; color:#e879f9; }
        .md pre { background:#0d0d0d; border:1px solid #1e1e1e; border-radius:10px; padding:16px; overflow-x:auto; margin:12px 0; }
        .md pre code { background:transparent; border:none; padding:0; color:#a8ff78; }
        .md blockquote { border-left:3px solid #2a2a2a; padding-left:14px; color:#555; margin:10px 0; }
        .md table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
        .md th { background:#111; color:#fff; padding:8px 12px; border:1px solid #1e1e1e; }
        .md td { padding:8px 12px; border:1px solid #141414; color:#888; }
        .typing { display:flex; gap:5px; align-items:center; padding:4px 0; }
        .typing span { width:7px; height:7px; border-radius:50%; background:#333; animation:bounce 1.2s infinite; }
        .typing span:nth-child(2){animation-delay:0.2s;} .typing span:nth-child(3){animation-delay:0.4s;}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);background:#333;} 30%{transform:translateY(-7px);background:#666;} }
        .msg-in { animation:msgIn 0.25s ease both; }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
        .model-tab { display:flex; flex-direction:column; align-items:center; gap:3px; padding:8px 16px; border-radius:10px; border:1px solid transparent; cursor:pointer; transition:all 0.2s; background:transparent; font-family:'Inter',sans-serif; }
        .model-tab:hover { background:rgba(255,255,255,0.04); }
        .model-tab.active { border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.06); }
        .chat-ta { flex:1; background:transparent; border:none; outline:none; color:white; font-size:15px; font-family:'Inter',sans-serif; padding:14px 16px; resize:none; max-height:200px; line-height:1.6; }
        .chat-ta::placeholder { color:#333; }
        .send-btn { margin:8px; width:38px; height:38px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; transition:all 0.2s; }
        .suggestion { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:8px; padding:8px 14px; font-size:13px; color:#555; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; white-space:nowrap; }
        .suggestion:hover { border-color:#2a2a2a; color:#888; }
      `}</style>

      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "0 24px", background: "rgba(8,8,8,0.98)", backdropFilter: "blur(16px)", position: "sticky", top: 0, zIndex: 10, flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>

          {/* Top bar */}
          <div style={{ height: 52, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <a href="/" style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}>
              <div style={{ width: 26, height: 26, background: "white", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: "white", letterSpacing: "-0.02em" }}>Universal AI</span>
            </a>
            <a href="/" style={{ fontSize: 12, color: "#333", textDecoration: "none" }}>← Home</a>
          </div>

          {/* Model Tabs */}
          <div style={{ display: "flex", gap: 4, paddingBottom: 12, justifyContent: "center" }}>
            {MODELS.map(m => (
              <button
                key={m.value}
                onClick={() => setModel(m.value)}
                className={`model-tab ${model === m.value ? "active" : ""}`}
                style={model === m.value ? { borderColor: `${m.color}40`, background: `${m.color}10` } : {}}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{m.icon}</span>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: model === m.value ? m.color : "#555", lineHeight: 1.2 }}>{m.provider}</div>
                    <div style={{ fontSize: 11, color: model === m.value ? `${m.color}99` : "#333", lineHeight: 1.2 }}>{m.label}</div>
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: m.tag === "FREE" ? "#4ade80" : "#f97316", background: m.tag === "FREE" ? "rgba(74,222,128,0.1)" : "rgba(249,115,22,0.1)", padding: "2px 5px", borderRadius: 4, marginLeft: 2 }}>{m.tag}</div>
                </div>
                {model === m.value && (
                  <div style={{ width: "100%", height: 2, background: m.color, borderRadius: 2, marginTop: 4 }} />
                )}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "32px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Empty state */}
          {messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 16, color: currentModel.color }}>✦</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#222", marginBottom: 8, letterSpacing: "-0.02em" }}>What can I help you with?</div>
              <div style={{ fontSize: 14, color: "#333", marginBottom: 36 }}>
                Using <span style={{ color: currentModel.color, fontWeight: 600 }}>{currentModel.icon} {currentModel.provider} {currentModel.label}</span>
              </div>
              <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", maxWidth: 600, margin: "0 auto" }}>
                {["✍️ Write a Python script", "🌌 Explain black holes", "💼 Create a business plan", "🐛 Debug my code", "📝 Summarize this text", "🎨 Give me creative ideas"].map(s => (
                  <button key={s} className="suggestion" onClick={() => setInput(s.split(' ').slice(1).join(' '))}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const msgModel = MODELS.find(m => m.value === msg.model) || currentModel;
            return (
              <div key={i} className="msg-in" style={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start", gap: 10, alignItems: "flex-start" }}>

                {msg.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: `${msgModel.color}15`, border: `1px solid ${msgModel.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2 }}>
                    {msgModel.icon}
                  </div>
                )}

                <div style={{
                  maxWidth: "82%",
                  padding: msg.role === "user" ? "11px 16px" : "14px 18px",
                  borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "4px 16px 16px 16px",
                  background: msg.role === "user" ? "white" : "#0d0d0d",
                  color: msg.role === "user" ? "#080808" : "#ccc",
                  border: msg.role === "assistant" ? "1px solid #1a1a1a" : "none",
                  fontSize: 15, lineHeight: 1.75,
                  fontWeight: msg.role === "user" ? 500 : 400,
                  wordBreak: "break-word",
                }}>
                  {msg.role === "user" ? msg.content : (
                    <div className="md"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div style={{ width: 30, height: 30, borderRadius: 9, background: "#1a1a1a", border: "1px solid #222", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, marginTop: 2, color: "#444", fontWeight: 700 }}>U</div>
                )}
              </div>
            );
          })}

          {/* Loading */}
          {loading && (
            <div className="msg-in" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <div style={{ width: 30, height: 30, borderRadius: 9, background: `${currentModel.color}15`, border: `1px solid ${currentModel.color}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                {currentModel.icon}
              </div>
              <div style={{ padding: "14px 18px", borderRadius: "4px 16px 16px 16px", background: "#0d0d0d", border: "1px solid #1a1a1a" }}>
                <div className="typing"><span /><span /><span /></div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* ── INPUT ── */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px", background: "rgba(8,8,8,0.98)", backdropFilter: "blur(16px)", flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ background: "#0d0d0d", border: `1px solid ${currentModel.color}30`, borderRadius: 14, display: "flex", alignItems: "flex-end", transition: "border-color 0.2s" }}>
            <textarea
              ref={textareaRef}
              className="chat-ta"
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 200) + "px";
              }}
              onKeyDown={e => {
                if (e.key === "Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={`Ask ${currentModel.provider} anything...`}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{ background: input.trim() && !loading ? currentModel.color : "#1a1a1a", color: input.trim() && !loading ? "white" : "#333" }}
            >
              ↑
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8, padding: "0 4px" }}>
            <span style={{ fontSize: 11, color: "#222" }}>Enter to send · Shift+Enter new line</span>
            <span style={{ fontSize: 11, color: currentModel.color, opacity: 0.6 }}>{currentModel.icon} {currentModel.provider} {currentModel.label}</span>
          </div>
        </div>
      </div>
    </div>
  );
}