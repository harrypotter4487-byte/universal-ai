"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

/* ── TYPES ── */
type Message    = { role: "user" | "assistant"; content: string; model?: string; };
type VoiceStatus = "idle" | "listening" | "thinking" | "speaking";

/* ── MODELS ── */
const MODELS = [
  { value: "groq",     provider: "Groq",     label: "Llama 3.3",     icon: "⚡", tag: "FREE" },
  { value: "gemini",   provider: "Gemini",   label: "Flash 2.5",     icon: "✦",  tag: "FREE" },
  { value: "deepseek", provider: "DeepSeek", label: "V3.2",          icon: "◎",  tag: "FREE" },
  { value: "nemotron", provider: "NVIDIA",   label: "Nemotron 120B", icon: "▣",  tag: "FREE" },
  { value: "gptoss",   provider: "OpenAI",   label: "GPT OSS 120B",  icon: "🤖", tag: "FREE" },
];

const SUGGESTIONS = [
  { icon: "💡", text: "Python script likho",         label: "Code"     },
  { icon: "🌌", text: "Black holes explain karo",    label: "Science"  },
  { icon: "📊", text: "Business plan banao",          label: "Business" },
  { icon: "🐛", text: "Code debug karo",              label: "Debug"    },
  { icon: "✍️", text: "Email likhne mein help karo", label: "Writing"  },
  { icon: "🎯", text: "Interview tips do",            label: "Career"   },
];

const KITTU_SYSTEM = "Your name is Kittu. You are a cute, friendly, and helpful AI voice assistant. Always reply in Hinglish — a natural mix of Hindi and English, just like Indian people talk. Be warm, friendly, and conversational. Keep responses concise for voice.";

/* ── PARTICLE ORB ── */
function ParticleOrb({ status }: { status: VoiceStatus }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef   = useRef<number>(0);
  const ptRef     = useRef<any[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const W = canvas.width = 240; const H = canvas.height = 240;
    const cx = W / 2, cy = H / 2, R = 86;
    ptRef.current = Array.from({ length: 240 }, () => ({
      theta: Math.random() * Math.PI * 2,
      phi:   Math.acos(2 * Math.random() - 1),
      r:     R + (Math.random() - 0.5) * 8,
      size:  Math.random() * 1.3 + 0.3,
      speed: (Math.random() - 0.5) * 0.003,
      pulse: Math.random() * Math.PI * 2,
      ps:    Math.random() * 0.04 + 0.01,
    }));
    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      t += 0.008;
      const jitter = status === "listening" ? 6 : status === "speaking" ? 4 : status === "thinking" ? 2 : 0;
      const scale  = status === "listening" ? 1.08 : status === "speaking" ? 1.05 : 1.0;
      ptRef.current.forEach(p => {
        p.theta += p.speed + (status === "thinking" ? 0.009 : status === "listening" ? 0.004 : 0.002);
        p.pulse += p.ps;
        const wobble = jitter > 0 ? Math.sin(p.pulse * 2.3) * jitter : 0;
        const r = (p.r + wobble) * scale;
        const x = cx + r * Math.sin(p.phi) * Math.cos(p.theta + t);
        const y = cy + r * Math.sin(p.phi) * Math.sin(p.theta + t) * 0.4 + r * Math.cos(p.phi) * 0.6;
        const z = Math.sin(p.phi) * Math.cos(p.theta + t);
        const depth = (z + 1) / 2;
        const alpha = depth * 0.85 + 0.05;
        const size  = p.size * (depth * 0.8 + 0.3);
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
      animRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [status]);

  return <canvas ref={canvasRef} width={240} height={240} style={{ cursor: "pointer" }} />;
}

/* ══════════════════════════════════════════════════════ */
export default function ChatPage() {
  const [mounted,         setMounted]         = useState(false);
  const [messages,        setMessages]        = useState<Message[]>([]);
  const [input,           setInput]           = useState("");
  const [loading,         setLoading]         = useState(false);
  const [model,           setModel]           = useState("groq");
  const [showModelPicker, setShowModelPicker] = useState(false);

  /* voice — text mode */
  const [isListening,  setIsListening]  = useState(false);
  const [isSpeaking,   setIsSpeaking]   = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [liveText,     setLiveText]     = useState("");

  /* Kittu voice mode */
  const [voiceMode,       setVoiceMode]       = useState(false);
  const [voiceStatus,     setVoiceStatus]     = useState<VoiceStatus>("idle");
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceAiText,     setVoiceAiText]     = useState("");
  const [voiceHistory,    setVoiceHistory]    = useState<{ role: string; content: string }[]>([]);
  const [kittuGreeted,    setKittuGreeted]    = useState(false);

  const bottomRef      = useRef<HTMLDivElement | null>(null);
  const textareaRef    = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef       = useRef<SpeechSynthesis | null>(null);
  const pickerRef      = useRef<HTMLDivElement>(null);

  const isListeningRef  = useRef(false);
  const inputRef        = useRef("");
  const voiceActiveRef  = useRef(false);
  const voiceInputRef   = useRef("");

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { inputRef.current = input; }, [input]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
    }
  }, []);
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node))
        setShowModelPicker(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* ── auto resize textarea ── */
  const resizeTA = () => {
    const ta = textareaRef.current; if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 160) + "px";
  };

  /* ── TTS helpers ── */
  const getVoice = () => {
    const v = synthRef.current!.getVoices();
    return (
      v.find(x => x.name === "Raveena") ||
      v.find(x => x.name === "Neerja")  ||
      v.find(x => x.lang === "hi-IN")   ||
      v.find(x => x.lang === "en-IN")   ||
      v.find(x => x.lang.startsWith("en"))
    );
  };

  const speakText = (text: string, onEnd?: () => void) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/```[\s\S]*?```/g, "code block").replace(/[`*#]/g, "").substring(0, 600);
    const u = new SpeechSynthesisUtterance(clean);
    const go = () => {
      const v = getVoice(); if (v) u.voice = v;
      u.lang = "hi-IN"; u.rate = 0.88; u.pitch = 1.35; u.volume = 0.8;
      u.onstart = () => setIsSpeaking(true);
      u.onend   = () => { setIsSpeaking(false); onEnd?.(); };
      u.onerror = () => { setIsSpeaking(false); onEnd?.(); };
      synthRef.current!.speak(u);
    };
    synthRef.current.getVoices().length === 0
      ? (synthRef.current.onvoiceschanged = go) : go();
  };

  const speakPromise = (text: string): Promise<void> => new Promise(r => speakText(text, r));
  const speak = useCallback((text: string) => { if (!voiceEnabled) return; speakText(text); }, [voiceEnabled]);
  const stopSpeaking = () => { synthRef.current?.cancel(); setIsSpeaking(false); };

  /* ── mic input ── */
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
      const r = new SR(); recognitionRef.current = r;
      r.continuous = false; r.interimResults = true; r.lang = "en-IN";
      r.onresult = (e: any) => {
        let interim = "", final = "";
        for (let i = 0; i < e.results.length; i++)
          e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript);
        setLiveText(interim || final);
        if (final) {
          const nv = inputRef.current ? inputRef.current + " " + final.trim() : final.trim();
          setInput(nv); inputRef.current = nv; setLiveText("");
          setTimeout(resizeTA, 0);
        }
      };
      r.onerror = (e: any) => {
        if (e.error === "not-allowed") { alert("Mic permission do!"); isListeningRef.current = false; setIsListening(false); return; }
        if (isListeningRef.current) setTimeout(start, 300);
      };
      r.onend = () => isListeningRef.current ? setTimeout(start, 200) : (setIsListening(false), setLiveText(""));
      try { r.start(); } catch { setTimeout(start, 300); }
    };
    start();
  };

  /* ── send message ── */
  const sendMessage = async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || loading) return;
    if (isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch { }
      setIsListening(false); setLiveText("");
    }
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); inputRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          message: text,
          model,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "No reply received.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, model }]);
      if (voiceEnabled) speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again.", model }]);
    }
    setLoading(false);
  };

  /* ── Kittu voice mode ── */
  const stopVoiceEverything = useCallback(() => {
    voiceActiveRef.current = false;
    try { recognitionRef.current?.abort(); } catch { }
    synthRef.current?.cancel();
    setVoiceStatus("idle"); setVoiceTranscript(""); voiceInputRef.current = "";
  }, []);

  const startKittuListen = useCallback(() => {
    if (!voiceActiveRef.current) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    setVoiceStatus("listening"); setVoiceTranscript(""); voiceInputRef.current = "";
    const r = new SR(); recognitionRef.current = r;
    r.continuous = false; r.interimResults = true; r.lang = "en-IN";
    r.onresult = (e: any) => {
      let interim = "", final = "";
      for (let i = 0; i < e.results.length; i++)
        e.results[i].isFinal ? (final += e.results[i][0].transcript) : (interim += e.results[i][0].transcript);
      setVoiceTranscript(interim || final);
      if (final) voiceInputRef.current = final.trim();
    };
    r.onend = () => {
      if (!voiceActiveRef.current) return;
      voiceInputRef.current.trim() ? sendToKittu(voiceInputRef.current.trim()) : setTimeout(startKittuListen, 500);
    };
    r.onerror = (e: any) => {
      if (e.error === "not-allowed") { alert("Mic permission do!"); stopVoiceEverything(); return; }
      if (voiceActiveRef.current) setTimeout(startKittuListen, 500);
    };
    try { r.start(); } catch { setTimeout(startKittuListen, 500); }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopVoiceEverything]);

  const sendToKittu = useCallback(async (userText: string) => {
    if (!userText.trim()) return;
    setVoiceStatus("thinking"); setVoiceTranscript(""); setVoiceAiText("Soch rahi hun...");
    const newHistory = [...voiceHistory, { role: "user", content: userText }];
    setVoiceHistory(newHistory);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: KITTU_SYSTEM }, ...newHistory],
          message: userText, model,
        }),
      });
      const data  = await res.json();
      const reply = data.reply || data.response || data.message || "Kuch samajh nahi aaya!";
      setVoiceHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setVoiceAiText(reply.substring(0, 100) + (reply.length > 100 ? "..." : ""));
      setVoiceStatus("speaking");
      await speakPromise(reply);
      if (voiceActiveRef.current) { setVoiceAiText(""); startKittuListen(); }
    } catch { setVoiceAiText("Error!"); setVoiceStatus("idle"); }
  }, [voiceHistory, model, startKittuListen]);

  const toggleKittu = () => {
    voiceActiveRef.current ? stopVoiceEverything() : (voiceActiveRef.current = true, startKittuListen());
  };

  const openKittu = async () => {
    setVoiceMode(true); setVoiceStatus("idle"); setVoiceTranscript(""); setVoiceAiText("");
    if (!kittuGreeted) {
      setKittuGreeted(true); setVoiceStatus("speaking");
      const g = "Hi! Main Kittu hoon, aapki AI assistant. Kaise help kar sakti hoon?";
      setVoiceAiText(g); await speakPromise(g); setVoiceAiText(""); setVoiceStatus("idle");
    }
  };

  const closeKittu = () => { stopVoiceEverything(); setVoiceMode(false); setVoiceHistory([]); setKittuGreeted(false); };

  const currentModel = MODELS.find(m => m.value === model)!;
  const statusLabel: Record<VoiceStatus, string> = {
    idle:     "Tap karke baat karo Kittu se",
    listening:"Sun rahi hun...",
    thinking: "Soch rahi hun...",
    speaking: voiceAiText || "Bol rahi hun...",
  };

  if (!mounted) return null;

  return (
    <div style={{ display:"flex", height:"100dvh", flexDirection:"column", background:"#000", color:"#fff", fontFamily:"'DM Sans',-apple-system,sans-serif", overflow:"hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=JetBrains+Mono:wght@400;500;700&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        ::-webkit-scrollbar{width:3px;}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.08);border-radius:2px;}

        /* markdown */
        .md p{margin-bottom:10px;line-height:1.82;color:rgba(255,255,255,0.68);font-size:0.88rem;}
        .md p:last-child{margin-bottom:0;}
        .md strong{color:#fff;font-weight:600;}
        .md h1,.md h2,.md h3{color:#fff;font-weight:600;margin:14px 0 6px;letter-spacing:-0.02em;}
        .md h1{font-size:1.1rem;}.md h2{font-size:0.98rem;}.md h3{font-size:0.9rem;}
        .md ul,.md ol{padding-left:20px;margin-bottom:10px;}
        .md li{margin-bottom:5px;line-height:1.75;color:rgba(255,255,255,0.62);font-size:0.86rem;}
        .md code{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);padding:1px 6px;border-radius:5px;font-size:0.76rem;font-family:'JetBrains Mono',monospace;color:rgba(255,255,255,0.75);}
        .md pre{background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:16px;overflow-x:auto;margin:12px 0;}
        .md pre code{background:transparent;border:none;padding:0;color:rgba(255,255,255,0.6);font-size:0.78rem;}

        /* animations */
        @keyframes fadeUp  {from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msgIn   {from{opacity:0;transform:translateY(8px) scale(0.99)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes pulse   {0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes bounce  {0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}
        @keyframes spin    {to{transform:rotate(360deg)}}
        @keyframes fadeIn  {from{opacity:0}to{opacity:1}}
        @keyframes txtFade {from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
        @keyframes micPulse{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4);}50%{box-shadow:0 0 0 8px rgba(239,68,68,0);}}

        /* ── NOISE BG ── */
        .noise-bg{
          position:fixed;inset:0;pointer-events:none;z-index:0;opacity:0.022;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .radial-top{
          position:fixed;top:-150px;left:50%;transform:translateX(-50%);
          width:800px;height:500px;pointer-events:none;z-index:0;
          background:radial-gradient(ellipse at 50% 0%,rgba(255,255,255,0.055) 0%,transparent 65%);
        }

        /* ── TOPBAR ── */
        .topbar{
          position:relative;z-index:50;height:52px;flex-shrink:0;
          display:flex;align-items:center;justify-content:space-between;
          padding:0 18px;
          background:rgba(0,0,0,0.75);
          backdrop-filter:blur(24px) saturate(180%);
          -webkit-backdrop-filter:blur(24px) saturate(180%);
          border-bottom:1px solid rgba(255,255,255,0.07);
        }
        .tb-logo{display:flex;align-items:center;gap:8px;font-size:0.88rem;font-weight:600;color:#fff;letter-spacing:-0.02em;text-decoration:none;}
        .tb-logo-icon{width:28px;height:28px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;}
        .tb-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:6px;}
        .tb-model-pill{
          display:flex;align-items:center;gap:6px;
          padding:5px 12px;border-radius:99px;
          background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
          font-size:0.75rem;font-weight:500;color:rgba(255,255,255,0.6);
          cursor:pointer;transition:all 0.18s;
        }
        .tb-model-pill:hover{background:rgba(255,255,255,0.1);color:#fff;}
        .tb-dot{width:6px;height:6px;border-radius:50%;background:#fff;animation:pulse 2.5s infinite;flex-shrink:0;}
        .tb-right{display:flex;align-items:center;gap:7px;}
        .tb-btn{
          display:flex;align-items:center;gap:5px;
          padding:5px 11px;border-radius:8px;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);
          font-size:0.74rem;font-weight:500;color:rgba(255,255,255,0.45);
          cursor:pointer;transition:all 0.18s;font-family:inherit;
        }
        .tb-btn:hover{background:rgba(255,255,255,0.09);color:#fff;}
        .tb-btn.active{background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.8);border-color:rgba(255,255,255,0.16);}

        /* model dropdown */
        .model-drop{
          position:absolute;top:58px;left:50%;transform:translateX(-50%);
          z-index:200;min-width:260px;
          background:rgba(8,8,8,0.95);
          border:1px solid rgba(255,255,255,0.1);border-radius:14px;overflow:hidden;
          backdrop-filter:blur(40px);
          box-shadow:0 20px 60px rgba(0,0,0,0.85),inset 0 1px 0 rgba(255,255,255,0.07);
          animation:fadeIn 0.16s ease both;
        }
        .model-drop-title{padding:10px 14px 8px;font-size:0.58rem;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace;border-bottom:1px solid rgba(255,255,255,0.05);}
        .model-opt{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background 0.14s;border:none;background:transparent;width:100%;text-align:left;font-family:inherit;}
        .model-opt:hover{background:rgba(255,255,255,0.05);}
        .model-opt.on{background:rgba(255,255,255,0.07);}
        .model-opt-icon{width:30px;height:30px;border-radius:8px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
        .model-opt-name{font-size:0.82rem;font-weight:600;color:#fff;}
        .model-opt-sub{font-size:0.64rem;color:rgba(255,255,255,0.28);font-family:'JetBrains Mono',monospace;}
        .model-opt-badge{margin-left:auto;padding:2px 7px;border-radius:99px;font-size:0.56rem;font-weight:700;letter-spacing:0.06em;background:rgba(74,222,128,0.1);color:#4ade80;border:1px solid rgba(74,222,128,0.2);white-space:nowrap;font-family:'JetBrains Mono',monospace;}
        .model-opt-check{color:#fff;font-size:12px;margin-left:4px;}

        /* ── MESSAGES AREA ── */
        .msgs{flex:1;overflow-y:auto;position:relative;z-index:1;}
        .msgs-inner{max-width:720px;margin:0 auto;padding:28px 20px 16px;display:flex;flex-direction:column;gap:18px;}

        /* empty state */
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:calc(100dvh - 200px);padding:40px 20px;animation:fadeUp 0.55s ease both;}
        .empty-icon{width:52px;height:52px;border-radius:14px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:18px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.1);}
        .empty-h{font-size:clamp(1.55rem,4vw,2.3rem);font-weight:700;letter-spacing:-0.04em;color:#fff;margin-bottom:8px;}
        .empty-sub{display:flex;align-items:center;gap:6px;font-size:0.84rem;color:rgba(255,255,255,0.28);margin-bottom:32px;}
        .sub-dot{width:5px;height:5px;border-radius:50%;background:#fff;opacity:0.4;animation:pulse 2s infinite;flex-shrink:0;}

        /* suggestion cards */
        .suggs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:620px;}
        .sug{
          display:flex;flex-direction:column;align-items:flex-start;gap:3px;
          padding:13px 15px;
          background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:12px;
          cursor:pointer;transition:all 0.2s cubic-bezier(.16,1,.3,1);
          text-align:left;position:relative;overflow:hidden;font-family:inherit;
        }
        .sug::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(255,255,255,0.1),transparent);}
        .sug:hover{background:rgba(255,255,255,0.06);border-color:rgba(255,255,255,0.13);transform:translateY(-2px);box-shadow:0 8px 24px rgba(0,0,0,0.4);}
        .sug-icon{font-size:15px;margin-bottom:1px;}
        .sug-cat{font-size:0.58rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:rgba(255,255,255,0.2);font-family:'JetBrains Mono',monospace;}
        .sug-text{font-size:0.78rem;font-weight:500;color:rgba(255,255,255,0.55);line-height:1.3;letter-spacing:-0.01em;}

        /* messages */
        .msg-row{animation:msgIn 0.28s ease both;}
        .msg-u{
          align-self:flex-end;max-width:76%;
          padding:10px 14px;
          background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.11);
          border-radius:16px 16px 4px 16px;
          font-size:0.87rem;color:rgba(255,255,255,0.88);line-height:1.65;letter-spacing:-0.01em;
          backdrop-filter:blur(10px);box-shadow:inset 0 1px 0 rgba(255,255,255,0.08);
        }
        .msg-a-wrap{display:flex;flex-direction:column;gap:5px;}
        .msg-a-head{display:flex;align-items:center;gap:7px;padding:0 2px;}
        .msg-a-av{width:22px;height:22px;border-radius:7px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;font-size:10px;flex-shrink:0;}
        .msg-a-name{font-size:0.68rem;font-weight:600;color:rgba(255,255,255,0.32);letter-spacing:-0.01em;}
        .msg-a-body{
          padding:12px 15px;
          background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);
          border-radius:4px 16px 16px 16px;
          backdrop-filter:blur(12px);box-shadow:inset 0 1px 0 rgba(255,255,255,0.04);
        }
        .speak-btn{margin-top:8px;background:transparent;border:1px solid rgba(255,255,255,0.08);border-radius:6px;color:rgba(255,255,255,0.25);font-size:0.7rem;cursor:pointer;padding:3px 9px;font-family:inherit;transition:all 0.15s;}
        .speak-btn:hover{color:rgba(255,255,255,0.55);border-color:rgba(255,255,255,0.16);}

        /* typing */
        .typing-wrap{display:flex;flex-direction:column;gap:5px;animation:msgIn 0.2s ease both;}
        .typing-bubble{display:flex;gap:5px;align-items:center;padding:12px 15px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:4px 16px 16px 16px;backdrop-filter:blur(12px);width:fit-content;}
        .typing-bubble span{width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,0.28);animation:bounce 1.2s ease-in-out infinite;}
        .typing-bubble span:nth-child(2){animation-delay:0.16s;}
        .typing-bubble span:nth-child(3){animation-delay:0.32s;}

        /* ── INPUT ZONE ── */
        .input-zone{position:relative;z-index:10;flex-shrink:0;padding:10px 18px 18px;}
        .input-glass{
          max-width:720px;margin:0 auto;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.11);border-radius:18px;
          backdrop-filter:blur(32px) saturate(1.6);-webkit-backdrop-filter:blur(32px) saturate(1.6);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.1),0 8px 32px rgba(0,0,0,0.5);
          overflow:hidden;transition:border-color 0.2s,box-shadow 0.2s;
        }
        .input-glass:focus-within{
          border-color:rgba(255,255,255,0.2);
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.14),0 8px 40px rgba(0,0,0,0.6),0 0 0 1px rgba(255,255,255,0.04);
        }
        .input-ta{
          width:100%;min-height:50px;max-height:160px;
          padding:14px 16px 6px;
          background:transparent;border:none;outline:none;
          color:#fff;font-size:0.9rem;line-height:1.6;
          resize:none;letter-spacing:-0.01em;font-family:'DM Sans',sans-serif;
        }
        .input-ta::placeholder{color:rgba(255,255,255,0.18);}
        .input-foot{display:flex;align-items:center;justify-content:space-between;padding:6px 10px 10px;}

        /* model pill inside input */
        .inp-model{
          display:flex;align-items:center;gap:5px;
          padding:4px 10px;border-radius:99px;
          background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);
          font-size:0.7rem;font-weight:600;color:rgba(255,255,255,0.45);
          cursor:pointer;transition:all 0.18s;letter-spacing:-0.005em;
        }
        .inp-model:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.75);border-color:rgba(255,255,255,0.15);}
        .inp-dot{width:5px;height:5px;border-radius:50%;background:#fff;opacity:0.45;animation:pulse 2.5s infinite;flex-shrink:0;}

        .inp-right{display:flex;align-items:center;gap:5px;}
        .act-btn{width:30px;height:30px;border-radius:9px;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-size:13px;color:rgba(255,255,255,0.32);transition:all 0.18s;cursor:pointer;}
        .act-btn:hover{background:rgba(255,255,255,0.09);color:rgba(255,255,255,0.65);border-color:rgba(255,255,255,0.14);}
        .act-btn.on{background:rgba(239,68,68,0.12);border-color:rgba(239,68,68,0.3);color:#ef4444;animation:micPulse 1s infinite;}

        .send-btn{width:34px;height:34px;border-radius:10px;background:#fff;color:#000;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;transition:all 0.2s cubic-bezier(.16,1,.3,1);box-shadow:0 0 14px rgba(255,255,255,0.1);}
        .send-btn:hover{transform:scale(1.08);box-shadow:0 0 24px rgba(255,255,255,0.2);}
        .send-btn:disabled{opacity:0.22;cursor:not-allowed;transform:none;box-shadow:none;}
        .send-spin{width:15px;height:15px;border-radius:50%;border:2px solid rgba(0,0,0,0.2);border-top-color:#000;animation:spin 0.7s linear infinite;}

        /* live text */
        .live-txt{background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.18);border-radius:8px;padding:6px 12px;margin-bottom:6px;color:#ef4444;font-size:0.75rem;font-style:italic;max-width:720px;margin-left:auto;margin-right:auto;}

        .inp-hint{text-align:center;margin-top:6px;font-size:0.6rem;color:rgba(255,255,255,0.12);font-family:'JetBrains Mono',monospace;letter-spacing:0.04em;}

        /* ── KITTU OVERLAY ── */
        .kittu{position:fixed;inset:0;background:#000;z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:48px 20px 52px;animation:fadeIn 0.25s ease;}
        .kittu-name{font-size:1.4rem;font-weight:700;color:#fff;letter-spacing:-0.03em;}
        .kittu-sub{font-size:0.75rem;color:rgba(255,255,255,0.25);margin-top:2px;}
        .kittu-status{font-size:0.84rem;color:rgba(255,255,255,0.35);line-height:1.7;animation:txtFade 0.3s ease;text-align:center;max-width:280px;}
        .kittu-transcript{font-size:0.95rem;color:rgba(255,255,255,0.8);line-height:1.6;margin-bottom:8px;font-style:italic;}
        .kittu-ctrl{width:50px;height:50px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;transition:all 0.2s;border:1px solid rgba(255,255,255,0.1);background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.5);font-family:inherit;}
        .kittu-ctrl:hover{background:rgba(255,255,255,0.1);color:#fff;}
        .kittu-mic{width:64px;height:64px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:24px;transition:all 0.25s;border:2px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.08);font-family:inherit;}
        .kittu-mic:hover{background:rgba(255,255,255,0.14);}
        .kittu-mic.active{background:rgba(255,255,255,0.12);border-color:rgba(255,255,255,0.4);box-shadow:0 0 30px rgba(255,255,255,0.1);}

        /* responsive */
        @media(max-width:640px){
          .suggs{grid-template-columns:repeat(2,1fr);}
          .tb-center{display:none;}
        }
        @media(max-width:400px){
          .suggs{grid-template-columns:1fr;}
        }
      `}</style>

      {/* ── BACKGROUND ── */}
      <div className="noise-bg" />
      <div className="radial-top" />

      {/* ════ KITTU OVERLAY ════ */}
      {voiceMode && (
        <div className="kittu">
          {/* top: branding */}
          <div style={{ textAlign:"center", display:"flex", flexDirection:"column", alignItems:"center", gap:6 }}>
            <div style={{ width:44, height:44, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.14)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22 }}>🌸</div>
            <div className="kittu-name">Kittu</div>
            <div className="kittu-sub">Powered by {currentModel.provider}</div>
          </div>

          {/* center: orb + status */}
          <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:20 }}>
            <div onClick={toggleKittu}><ParticleOrb status={voiceStatus} /></div>
            <div style={{ textAlign:"center", minHeight:56 }}>
              {voiceTranscript && voiceStatus === "listening" && (
                <div className="kittu-transcript">"{voiceTranscript}"</div>
              )}
              <div className="kittu-status" key={voiceStatus}>{statusLabel[voiceStatus]}</div>
            </div>
          </div>

          {/* bottom: controls */}
          <div style={{ display:"flex", alignItems:"center", gap:24 }}>
            <button className="kittu-ctrl" onClick={() => { setVoiceHistory([]); setVoiceAiText(""); stopVoiceEverything(); setVoiceStatus("idle"); }}>↺</button>
            <button
              className={`kittu-mic ${voiceActiveRef.current ? "active" : ""}`}
              onClick={toggleKittu}
            >
              {voiceStatus === "idle" ? "🎙" : voiceStatus === "listening" ? "🎙" : voiceStatus === "thinking" ? "⏳" : "🔊"}
            </button>
            <button className="kittu-ctrl" onClick={closeKittu}>✕</button>
          </div>
        </div>
      )}

      {/* ════ TOPBAR ════ */}
      <header className="topbar">
        <a href="/" className="tb-logo">
          <div className="tb-logo-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5" strokeLinecap="round">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
          Universal AI
        </a>

        {/* center model pill */}
        <div className="tb-center" ref={pickerRef}>
          <button className="tb-model-pill" onClick={() => setShowModelPicker(v => !v)}>
            <div className="tb-dot" />
            {currentModel.icon} {currentModel.provider} {currentModel.label}
            <span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.25)" }}>▾</span>
          </button>

          {showModelPicker && (
            <div className="model-drop">
              <div className="model-drop-title">Model chunna</div>
              {MODELS.map(m => (
                <button key={m.value} className={`model-opt ${model === m.value ? "on" : ""}`}
                  onClick={() => { setModel(m.value); setShowModelPicker(false); }}>
                  <div className="model-opt-icon">{m.icon}</div>
                  <div>
                    <div className="model-opt-name">{m.provider}</div>
                    <div className="model-opt-sub">{m.label}</div>
                  </div>
                  <div className="model-opt-badge">{m.tag}</div>
                  {model === m.value && <span className="model-opt-check">✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tb-right">
          <button
            className={`tb-btn ${voiceEnabled ? "active" : ""}`}
            onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }}
            title="Voice replies"
          >
            {voiceEnabled ? "🔊" : "🔇"}
          </button>
          {messages.length > 0 && (
            <button className="tb-btn" onClick={() => setMessages([])}>+ New</button>
          )}
        </div>
      </header>

      {/* ════ MESSAGES ════ */}
      <div className="msgs">
        {messages.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">✦</div>
            <h1 className="empty-h">Kya dhundh rahe ho aaj?</h1>
            <p className="empty-sub">
              <span className="sub-dot" />
              {currentModel.icon} {currentModel.provider} {currentModel.label} ready hai
            </p>
            <div className="suggs">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="sug" style={{ animationDelay:`${i*0.05}s` }}
                  onClick={() => sendMessage(s.text)}>
                  <span className="sug-icon">{s.icon}</span>
                  <span className="sug-cat">{s.label}</span>
                  <span className="sug-text">{s.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="msgs-inner">
            {messages.map((msg, i) => {
              const msgModel = MODELS.find(m => m.value === msg.model) ?? currentModel;
              return (
                <div key={i} className="msg-row">
                  {msg.role === "user" ? (
                    <div style={{ display:"flex", justifyContent:"flex-end" }}>
                      <div className="msg-u">{msg.content}</div>
                    </div>
                  ) : (
                    <div className="msg-a-wrap">
                      <div className="msg-a-head">
                        <div className="msg-a-av">{msgModel.icon}</div>
                        <span className="msg-a-name">{msgModel.provider}</span>
                      </div>
                      <div className="msg-a-body">
                        <div className="md"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                        <button className="speak-btn"
                          onClick={() => isSpeaking ? stopSpeaking() : speakText(msg.content)}>
                          {isSpeaking ? "⏹ Stop" : "🔊 Sunao"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && (
              <div className="typing-wrap">
                <div className="msg-a-head">
                  <div className="msg-a-av">{currentModel.icon}</div>
                  <span className="msg-a-name">{currentModel.provider}</span>
                </div>
                <div className="typing-bubble"><span/><span/><span/></div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ════ INPUT ZONE ════ */}
      <div className="input-zone">
        {liveText && (
          <div className="live-txt">🎙 {liveText}</div>
        )}

        <div className="input-glass">
          <textarea
            ref={textareaRef}
            className="input-ta"
            placeholder="Kuch bhi pucho..."
            value={input}
            rows={1}
            onChange={e => {
              setInput(e.target.value);
              inputRef.current = e.target.value;
              resizeTA();
            }}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            }}
          />

          <div className="input-foot">
            {/* left: model pill */}
            <button className="inp-model" onClick={() => setShowModelPicker(v => !v)}>
              <span>{currentModel.icon}</span>
              <div className="inp-dot" />
              {currentModel.provider}
              <span style={{ fontSize:"0.58rem", color:"rgba(255,255,255,0.2)" }}>▾</span>
            </button>

            <div className="inp-right">
              {/* Kittu button */}
              <button className="act-btn" style={{ color:"rgba(255,255,255,0.45)", fontSize:15 }}
                title="Kittu voice assistant" onClick={openKittu}>
                🌸
              </button>
              {/* Mic button */}
              <button className={`act-btn ${isListening ? "on" : ""}`}
                title="Voice input" onClick={startListening}>
                {isListening ? "⏹" : "🎙"}
              </button>
              {/* Send */}
              <button className="send-btn"
                onClick={() => sendMessage()}
                disabled={!input.trim() || loading}>
                {loading ? <div className="send-spin" /> : "↑"}
              </button>
            </div>
          </div>
        </div>

        <p className="inp-hint">Enter to send · Shift+Enter new line · 🌸 Kittu voice mode</p>
      </div>
    </div>
  );
}