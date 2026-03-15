"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

const MODELS = [
  { value: "groq",     provider: "Groq",     label: "Llama 3.3",    icon: "⚡", color: "#a78bfa", tag: "FREE" },
  { value: "gemini",   provider: "Gemini",   label: "Flash 1.5",    icon: "✦",  color: "#34d399", tag: "FREE" },
  { value: "deepseek", provider: "DeepSeek", label: "V3.2",         icon: "🔮", color: "#60a5fa", tag: "FREE" },
  { value: "nemotron", provider: "NVIDIA",   label: "Nemotron 120B",icon: "🟢", color: "#f472b6", tag: "FREE" },
  { value: "gptoss",   provider: "OpenAI",   label: "GPT OSS 120B", icon: "🤖", color: "#10a37f", tag: "FREE" },
];

const KITTU_SYSTEM = "Your name is Kittu. You are a cute, friendly, and helpful AI voice assistant. When someone first talks to you, greet them warmly as Kittu. Always reply in Hinglish — a natural mix of Hindi and English, just like Indian people talk. Be warm, friendly, and conversational. Keep responses concise for voice.";

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("groq");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [liveText, setLiveText] = useState("");

  // Kittu voice overlay
  const [voiceMode, setVoiceMode] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceAiText, setVoiceAiText] = useState("");
  const [voiceHistory, setVoiceHistory] = useState<{ role: string; content: string }[]>([]);
  const [kittuGreeted, setKittuGreeted] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isListeningRef = useRef(false);
  const inputRef = useRef("");
  const voiceActiveRef = useRef(false);
  const voiceInputRef = useRef("");

  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
    }
  }, []);

  // ── VOICE UTILS ──
  const getVoice = () => {
    const voices = synthRef.current!.getVoices();
    return (
      voices.find(v => v.name === "Raveena") ||
      voices.find(v => v.name === "Neerja") ||
      voices.find(v => v.name === "Heera") ||
      voices.find(v => v.name === "Google Hindi") ||
      voices.find(v => v.lang === "hi-IN") ||
      voices.find(v => v.lang === "en-IN") ||
      voices.find(v => v.name === "Google UK English Female") ||
      voices.find(v => v.name === "Samantha") ||
      voices.find(v => v.lang.startsWith("en"))
    );
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, "code block").replace(/`([^`]+)`/g, "$1").replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\*([^*]+)\*/g, "$1").replace(/#+\s/g, "").substring(0, 600);
    const utterance = new SpeechSynthesisUtterance(clean);
    const doSpeak = () => {
      const v = getVoice();
      if (v) utterance.voice = v;
      utterance.lang = "hi-IN"; utterance.rate = 0.88; utterance.pitch = 1.35; utterance.volume = 0.8;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => { setIsSpeaking(false); onEnd?.(); };
      utterance.onerror = () => { setIsSpeaking(false); onEnd?.(); };
      synthRef.current!.speak(utterance);
    };
    synthRef.current.getVoices().length === 0 ? (synthRef.current.onvoiceschanged = doSpeak) : doSpeak();
  };

  const speakPromise = (text: string): Promise<void> => new Promise(resolve => speakText(text, resolve));

  const speak = useCallback((text: string) => {
    if (!voiceEnabled) return;
    speakText(text);
  }, [voiceEnabled]);

  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  // ── CHAT MIC ──
  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Chrome use karo!"); return; }
    if (isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch { }
      setIsListening(false); setLiveText(""); return;
    }
    isListeningRef.current = true; setIsListening(true); setLiveText("");
    const start = () => {
      if (!isListeningRef.current) return;
      const r = new SR();
      recognitionRef.current = r;
      r.continuous = false; r.interimResults = true; r.lang = "en-IN";
      r.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = 0; i < e.results.length; i++) { e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript); }
        setLiveText(interim || final);
        if (final) {
          const nv = inputRef.current ? inputRef.current + " " + final.trim() : final.trim();
          setInput(nv); inputRef.current = nv; setLiveText("");
          if (textareaRef.current) { textareaRef.current.style.height = "auto"; textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 150) + "px"; }
        }
      };
      r.onerror = (e: any) => { if (e.error === "not-allowed") { alert("Mic permission do!"); isListeningRef.current = false; setIsListening(false); return; } if (isListeningRef.current) setTimeout(start, 300); };
      r.onend = () => { isListeningRef.current ? setTimeout(start, 200) : (setIsListening(false), setLiveText("")); };
      try { r.start(); } catch { setTimeout(start, 300); }
    };
    start();
  };

  // ── CHAT SEND ──
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;
    if (isListeningRef.current) { isListeningRef.current = false; try { recognitionRef.current?.abort(); } catch { } setIsListening(false); setLiveText(""); }
    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput(""); inputRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const res = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...messages, { role: "user", content: text }], message: text, model }) });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "No reply received.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, model }]);
      if (voiceEnabled) speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Try again!", model }]);
    } finally { setLoading(false); }
  };

  // ── KITTU VOICE MODE ──
  const stopVoiceEverything = useCallback(() => {
    voiceActiveRef.current = false;
    try { recognitionRef.current?.abort(); } catch { }
    synthRef.current?.cancel();
    setVoiceStatus("idle");
    setVoiceTranscript("");
    voiceInputRef.current = "";
  }, []);

  const sendToKittu = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
    setVoiceStatus("thinking");
    setVoiceTranscript("");
    setVoiceAiText("Soch rahi hun...");

    const newHistory = [...voiceHistory, { role: "user", content: userText }];
    setVoiceHistory(newHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: KITTU_SYSTEM },
            ...newHistory
          ],
          message: userText,
          model,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "Kuch samajh nahi aaya!";
      setVoiceHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setVoiceAiText(reply.substring(0, 120) + (reply.length > 120 ? "..." : ""));
      setVoiceStatus("speaking");
      await speakPromise(reply);
      if (voiceActiveRef.current) { setVoiceAiText(""); startKittuListen(); }
    } catch {
      setVoiceAiText("Kuch error ho gaya!");
      setVoiceStatus("idle");
    }
  }, [voiceHistory, model]);

  const startKittuListen = useCallback(() => {
    if (!voiceActiveRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Chrome use karo!"); return; }
    setVoiceStatus("listening");
    setVoiceTranscript("");
    voiceInputRef.current = "";
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = false; r.interimResults = true; r.lang = "en-IN";
    r.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = 0; i < e.results.length; i++) { e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript); }
      setVoiceTranscript(interim || final);
      if (final) voiceInputRef.current = final.trim();
    };
    r.onend = () => { if (!voiceActiveRef.current) return; voiceInputRef.current.trim() ? sendToKittu(voiceInputRef.current.trim()) : setTimeout(startKittuListen, 500); };
    r.onerror = (e: any) => {
      if (e.error === "not-allowed") { alert("Mic permission do!"); stopVoiceEverything(); return; }
      if (voiceActiveRef.current) setTimeout(startKittuListen, 500);
    };
    try { r.start(); } catch { setTimeout(startKittuListen, 500); }
  }, [sendToKittu, stopVoiceEverything]);

  const toggleKittu = () => {
    if (voiceActiveRef.current) {
      stopVoiceEverything();
    } else {
      voiceActiveRef.current = true;
      startKittuListen();
    }
  };

  // Open Kittu — greet on first open
  const openKittu = async () => {
    setVoiceMode(true);
    setVoiceStatus("idle");
    setVoiceTranscript("");
    setVoiceAiText("");

    if (!kittuGreeted) {
      setKittuGreeted(true);
      setVoiceStatus("speaking");
      const greeting = "Hi! Main Kittu hoon, aapki AI assistant. Kaise help kar sakti hoon aapki?";
      setVoiceAiText(greeting);
      await speakPromise(greeting);
      setVoiceAiText("");
      setVoiceStatus("idle");
    }
  };

  const closeKittu = () => {
    stopVoiceEverything();
    setVoiceMode(false);
    setVoiceHistory([]);
    setKittuGreeted(false);
  };

  const currentModel = MODELS.find(m => m.value === model)!;

  const orbColors: Record<VoiceStatus, string> = {
    idle:      "radial-gradient(circle at 35% 35%, #1a0a2e, #2d1b69, #5b21b6)",
    listening: "radial-gradient(circle at 35% 35%, #2a0a3e, #5b21b6, #7c3aed, #a855f7)",
    thinking:  "radial-gradient(circle at 35% 35%, #1a0a2e, #3b1f6e, #6d28d9)",
    speaking:  "radial-gradient(circle at 35% 35%, #0d1b4a, #1e3a8a, #3b82f6, #93c5fd)",
  };
  const orbGlow: Record<VoiceStatus, string> = {
    idle:      "0 0 40px 10px rgba(124,58,237,0.2)",
    listening: "0 0 70px 25px rgba(168,85,247,0.5), 0 0 140px 50px rgba(124,58,237,0.25)",
    thinking:  "0 0 60px 20px rgba(109,40,217,0.4), 0 0 120px 40px rgba(109,40,217,0.2)",
    speaking:  "0 0 70px 25px rgba(59,130,246,0.5), 0 0 140px 50px rgba(37,99,235,0.25)",
  };
  const statusLabel: Record<VoiceStatus, string> = {
    idle:      "Tap karke baat karo Kittu se",
    listening: "Sun rahi hun...",
    thinking:  "Soch rahi hun...",
    speaking:  voiceAiText || "Bol rahi hun...",
  };

  return (
    <div style={{ display:"flex", height:"100dvh", flexDirection:"column", background:"#080808", color:"white", fontFamily:"'Inter',sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-thumb { background:#1e1e1e; border-radius:4px; }
        .md p { margin-bottom:10px; line-height:1.75; color:#ccc; font-size:15px; }
        .md p:last-child { margin-bottom:0; }
        .md strong { color:#fff; font-weight:600; }
        .md h1,.md h2,.md h3 { color:white; font-weight:700; margin:14px 0 8px; }
        .md h1{font-size:20px;} .md h2{font-size:17px;} .md h3{font-size:15px;}
        .md ul,.md ol { padding-left:20px; margin-bottom:10px; }
        .md li { margin-bottom:5px; line-height:1.7; color:#ccc; font-size:15px; }
        .md code { background:#1a1a1a; border:1px solid #2a2a2a; padding:2px 7px; border-radius:5px; font-size:13px; font-family:monospace; color:#e879f9; }
        .md pre { background:#0d0d0d; border:1px solid #1e1e1e; border-radius:10px; padding:16px; overflow-x:auto; margin:12px 0; }
        .md pre code { background:transparent; border:none; padding:0; color:#a8ff78; }
        .typing { display:flex; gap:5px; align-items:center; padding:4px 0; }
        .typing span { width:7px; height:7px; border-radius:50%; background:#333; animation:bounce 1.2s infinite; }
        .typing span:nth-child(2){animation-delay:0.2s;} .typing span:nth-child(3){animation-delay:0.4s;}
        @keyframes bounce { 0%,60%,100%{transform:translateY(0);background:#333;} 30%{transform:translateY(-7px);background:#666;} }
        .msg-in { animation:msgIn 0.25s ease both; }
        @keyframes msgIn { from{opacity:0;transform:translateY(6px);} to{opacity:1;transform:translateY(0);} }
        .tabs-scroll { display:flex; gap:4px; overflow-x:auto; scrollbar-width:none; -webkit-overflow-scrolling:touch; padding-bottom:10px; padding-top:4px; }
        .tabs-scroll::-webkit-scrollbar { display:none; }
        .model-tab { display:flex; flex-direction:column; align-items:center; gap:2px; padding:7px 12px; border-radius:10px; border:1px solid transparent; cursor:pointer; transition:all 0.2s; background:transparent; font-family:'Inter',sans-serif; flex-shrink:0; white-space:nowrap; }
        .model-tab:hover { background:rgba(255,255,255,0.04); }
        .model-tab.active { border-color:rgba(255,255,255,0.1); background:rgba(255,255,255,0.06); }
        .chat-ta { flex:1; background:transparent; border:none; outline:none; color:white; font-size:16px; font-family:'Inter',sans-serif; padding:14px 16px; resize:none; max-height:150px; line-height:1.6; }
        .chat-ta::placeholder { color:#333; }
        .icon-btn { width:40px; height:40px; border-radius:10px; border:1px solid transparent; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:16px; flex-shrink:0; transition:all 0.2s; background:#111; }
        .send-btn { width:42px; height:42px; border-radius:10px; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; transition:all 0.2s; }
        @keyframes micPulse { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0);} }
        .mic-active { animation:micPulse 1s infinite; background:rgba(239,68,68,0.15) !important; }
        @keyframes speakPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        .speaking-pulse { animation:speakPulse 0.8s infinite; }
        .suggestion { background:#0f0f0f; border:1px solid #1a1a1a; border-radius:8px; padding:8px 14px; font-size:13px; color:#555; cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; white-space:nowrap; }
        .suggestion:hover { border-color:#2a2a2a; color:#888; }
        .live-text { background:rgba(239,68,68,0.08); border:1px solid rgba(239,68,68,0.2); border-radius:8px; padding:8px 14px; margin:0 0 8px 0; color:#ef4444; font-size:13px; font-style:italic; text-align:center; }

        /* Kittu overlay */
        .kittu-overlay { position:fixed; inset:0; background:#000; z-index:100; display:flex; flex-direction:column; align-items:center; justify-content:space-between; padding:50px 20px 50px; animation:overlayIn 0.4s ease; }
        @keyframes overlayIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }
        @keyframes orbIdle { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
        @keyframes orbListen { 0%,100%{transform:scale(1)} 25%{transform:scale(1.1)} 75%{transform:scale(0.94)} }
        @keyframes orbThink { 0%{transform:rotate(0deg)} 100%{transform:rotate(360deg)} }
        @keyframes orbSpeak { 0%,100%{transform:scale(1)} 20%{transform:scale(1.12)} 40%{transform:scale(0.94)} 60%{transform:scale(1.08)} 80%{transform:scale(0.97)} }
        .orb-idle { animation:orbIdle 3s ease-in-out infinite; }
        .orb-listening { animation:orbListen 0.7s ease-in-out infinite; }
        .orb-thinking { animation:orbThink 2.5s linear infinite; }
        .orb-speaking { animation:orbSpeak 0.5s ease-in-out infinite; }
        @keyframes txtFade { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        .kittu-btn { width:56px; height:56px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:20px; transition:all 0.2s; border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.6); }
        .kittu-btn:hover { background:rgba(255,255,255,0.12); }

        @media (max-width:600px) {
          .model-tab { padding:6px 10px; }
          .model-label { display:none; }
          .msg-max { max-width:90% !important; }
          .avatar { width:26px !important; height:26px !important; font-size:11px !important; }
          .hint-text { display:none; }
        }
      `}</style>

      {/* ══ KITTU OVERLAY ══ */}
      {voiceMode && (
        <div className="kittu-overlay">

          {/* Top — Kittu branding */}
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:8 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"linear-gradient(135deg, #7c3aed, #a855f7)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, boxShadow:"0 0 20px rgba(168,85,247,0.4)" }}>
              🌸
            </div>
            <div style={{ fontSize:22, fontWeight:700, color:"white", letterSpacing:"-0.02em" }}>Kittu</div>
            <div style={{ fontSize:12, color:"rgba(255,255,255,0.3)" }}>Powered by {currentModel.provider}</div>
          </div>

          {/* Middle — Orb + text */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:40 }}>
            <div
              className={`orb-${voiceStatus}`}
              onClick={toggleKittu}
              style={{
                width: 210, height: 210, borderRadius:"50%", cursor:"pointer",
                background: orbColors[voiceStatus],
                boxShadow: orbGlow[voiceStatus],
                transition:"background 0.8s ease, box-shadow 0.8s ease",
                position:"relative",
              }}
            >
              {/* Inner shine */}
              <div style={{ position:"absolute", inset:"12%", borderRadius:"50%", background:"radial-gradient(circle at 38% 28%, rgba(255,255,255,0.18), transparent 65%)", pointerEvents:"none" }}/>
              <div style={{ position:"absolute", inset:"35%", borderRadius:"50%", background:"radial-gradient(circle at 60% 65%, rgba(168,85,247,0.3), transparent 60%)", pointerEvents:"none" }}/>
            </div>

            {/* Status text */}
            <div style={{ textAlign:"center", maxWidth:300, minHeight:60 }}>
              {voiceTranscript && voiceStatus==="listening" && (
                <div style={{ fontSize:16, color:"rgba(255,255,255,0.85)", marginBottom:10, animation:"txtFade 0.2s ease", lineHeight:1.6 }}>
                  "{voiceTranscript}"
                </div>
              )}
              <div style={{ fontSize:15, color:"rgba(255,255,255,0.4)", lineHeight:1.7, animation:"txtFade 0.3s ease" }} key={`${voiceStatus}-${voiceAiText.substring(0,20)}`}>
                {statusLabel[voiceStatus]}
              </div>
            </div>
          </div>

          {/* Bottom controls */}
          <div style={{ display:"flex", alignItems:"center", gap:20 }}>
            {/* New conversation */}
            <button className="kittu-btn" onClick={() => { setVoiceHistory([]); setVoiceAiText(""); stopVoiceEverything(); setVoiceStatus("idle"); }} title="Naya conversation">
              ↺
            </button>

            {/* Main tap button */}
            <button
              onClick={toggleKittu}
              style={{
                width:72, height:72, borderRadius:"50%", cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:28, transition:"all 0.3s",
                background: voiceActiveRef.current ? "rgba(239,68,68,0.2)" : "rgba(168,85,247,0.2)",
                border: voiceActiveRef.current ? "2px solid rgba(239,68,68,0.5)" : "2px solid rgba(168,85,247,0.5)",
                boxShadow: voiceActiveRef.current ? "0 0 20px rgba(239,68,68,0.3)" : "0 0 20px rgba(168,85,247,0.3)",
              }}
            >
              {voiceStatus==="idle" ? "🎙" : voiceStatus==="listening" ? "🎙" : voiceStatus==="thinking" ? "⏳" : "🔊"}
            </button>

            {/* Close */}
            <button className="kittu-btn" onClick={closeKittu} title="Band karo">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ══ HEADER ══ */}
      <header style={{ borderBottom:"1px solid rgba(255,255,255,0.06)", padding:"0 16px", background:"rgba(8,8,8,0.98)", backdropFilter:"blur(16px)", position:"sticky", top:0, zIndex:10, flexShrink:0 }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          <div style={{ height:48, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <a href="/" style={{ display:"flex", alignItems:"center", gap:8, textDecoration:"none" }}>
              <div style={{ width:24, height:24, background:"white", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <span style={{ fontSize:14, fontWeight:600, color:"white", letterSpacing:"-0.02em" }}>Universal AI</span>
            </a>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }} style={{ background:voiceEnabled?"rgba(168,139,250,0.15)":"#111", border:voiceEnabled?"1px solid rgba(168,139,250,0.3)":"1px solid #222", borderRadius:8, padding:"6px 10px", color:voiceEnabled?"#a78bfa":"#444", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:4, fontFamily:"Inter,sans-serif", transition:"all 0.2s" }}>
                <span>{voiceEnabled ? "🔊" : "🔇"}</span>
              </button>
            </div>
          </div>

          <div className="tabs-scroll">
            {MODELS.map(m => (
              <button key={m.value} onClick={() => setModel(m.value)} className={`model-tab ${model===m.value?"active":""}`} style={model===m.value?{borderColor:`${m.color}40`,background:`${m.color}10`}:{}}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <span style={{ fontSize:13 }}>{m.icon}</span>
                  <div style={{ textAlign:"left" }}>
                    <div style={{ fontSize:12, fontWeight:600, color:model===m.value?m.color:"#555", lineHeight:1.2 }}>{m.provider}</div>
                    <div className="model-label" style={{ fontSize:10, color:model===m.value?`${m.color}99`:"#333", lineHeight:1.2 }}>{m.label}</div>
                  </div>
                  <div style={{ fontSize:8, fontWeight:700, color:m.tag==="FREE"?"#4ade80":"#f97316", background:m.tag==="FREE"?"rgba(74,222,128,0.1)":"rgba(249,115,22,0.1)", padding:"2px 4px", borderRadius:3, marginLeft:2 }}>{m.tag}</div>
                </div>
                {model===m.value && <div style={{ width:"100%", height:2, background:m.color, borderRadius:2, marginTop:3 }}/>}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* ══ MESSAGES ══ */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ maxWidth:800, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>
          {messages.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:32, marginBottom:12, color:currentModel.color }}>✦</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#222", marginBottom:6 }}>Kya help karu aapki?</div>
              <div style={{ fontSize:13, color:"#333", marginBottom:24 }}>
                Using <span style={{ color:currentModel.color, fontWeight:600 }}>{currentModel.icon} {currentModel.provider}</span>
              </div>
              <div style={{ display:"flex", gap:8, justifyContent:"center", flexWrap:"wrap", maxWidth:560, margin:"0 auto" }}>
                {["Python script likho","Black holes explain karo","Business plan banao","Code debug karo"].map(s => (
                  <button key={s} className="suggestion" onClick={() => setInput(s)}>{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const msgModel = MODELS.find(m => m.value===msg.model) || currentModel;
            return (
              <div key={i} className="msg-in" style={{ display:"flex", justifyContent:msg.role==="user"?"flex-end":"flex-start", gap:8, alignItems:"flex-start" }}>
                {msg.role==="assistant" && <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:`${msgModel.color}15`, border:`1px solid ${msgModel.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, marginTop:2 }}>{msgModel.icon}</div>}
                <div className="msg-max" style={{ maxWidth:"82%", padding:msg.role==="user"?"10px 14px":"12px 16px", borderRadius:msg.role==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px", background:msg.role==="user"?"white":"#0d0d0d", color:msg.role==="user"?"#080808":"#ccc", border:msg.role==="assistant"?"1px solid #1a1a1a":"none", fontSize:15, lineHeight:1.75, fontWeight:msg.role==="user"?500:400, wordBreak:"break-word" }}>
                  {msg.role==="user" ? msg.content : <div className="md"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                  {msg.role==="assistant" && <button onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)} style={{ marginTop:8, background:"transparent", border:"none", color:"#333", fontSize:12, cursor:"pointer", padding:"2px 0", fontFamily:"Inter,sans-serif" }}>{isSpeaking ? "⏹ Roko" : "🔊 Sunao"}</button>}
                </div>
                {msg.role==="user" && <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:"#1a1a1a", border:"1px solid #222", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginTop:2, color:"#444", fontWeight:700 }}>U</div>}
              </div>
            );
          })}

          {loading && (
            <div className="msg-in" style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:`${currentModel.color}15`, border:`1px solid ${currentModel.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{currentModel.icon}</div>
              <div style={{ padding:"12px 16px", borderRadius:"4px 16px 16px 16px", background:"#0d0d0d", border:"1px solid #1a1a1a" }}><div className="typing"><span/><span/><span/></div></div>
            </div>
          )}
          <div ref={bottomRef}/>
        </div>
      </div>

      {/* ══ INPUT ══ */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"12px 16px", background:"rgba(8,8,8,0.98)", backdropFilter:"blur(16px)", flexShrink:0, paddingBottom:"max(12px, env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>
          {liveText && <div className="live-text">🎙 {liveText}</div>}
          <div style={{ background:"#0d0d0d", border:`1px solid ${isListening?"#ef4444":currentModel.color}30`, borderRadius:14, display:"flex", alignItems:"flex-end", transition:"border-color 0.2s" }}>
            <textarea ref={textareaRef} className="chat-ta" value={input} rows={1}
              onChange={e => { setInput(e.target.value); inputRef.current = e.target.value; e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }}
              onKeyDown={e => { if (e.key==="Enter" && !e.shiftKey && !loading) { e.preventDefault(); sendMessage(); } }}
              placeholder={isListening ? "Sun rahi hun... 🎙" : `${currentModel.provider} se pucho kuch bhi...`}
            />

            {/* Chat mic */}
            <button className={`icon-btn ${isListening?"mic-active":""}`} onClick={startListening} style={{ margin:"8px 4px 8px 0", color:isListening?"#ef4444":"#444", border:isListening?"1px solid rgba(239,68,68,0.3)":"1px solid transparent" }}>
              {isListening ? "⏹" : "🎙"}
            </button>

            {/* Kittu button */}
            <button
              onClick={openKittu}
              style={{ margin:"8px 4px 8px 0", width:40, height:40, borderRadius:10, border:"1px solid rgba(168,85,247,0.4)", background:"rgba(168,85,247,0.15)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0, transition:"all 0.2s" }}
              title="Kittu se baat karo 🌸"
            >
              🌸
            </button>

            {isSpeaking && <button className="icon-btn speaking-pulse" onClick={stopSpeaking} style={{ margin:"8px 4px 8px 0", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)" }}>🔊</button>}

            <button className="send-btn" onClick={sendMessage} disabled={loading||!input.trim()} style={{ margin:"8px 8px 8px 0", background:input.trim()&&!loading?currentModel.color:"#1a1a1a", color:input.trim()&&!loading?"white":"#333" }}>↑</button>
          </div>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6, padding:"0 4px" }}>
            <span className="hint-text" style={{ fontSize:11, color:"#222" }}>Enter to send · 🌸 Kittu voice mode</span>
            <span style={{ fontSize:11, color:currentModel.color, opacity:0.6 }}>{currentModel.icon} {currentModel.provider}</span>
          </div>
        </div>
      </div>
    </div>
  );
}