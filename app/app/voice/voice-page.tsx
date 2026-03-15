"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";

type Status = "idle" | "listening" | "thinking" | "speaking";

const MODELS = [
  { value: "groq",     label: "Groq",     color: "#a78bfa" },
  { value: "gemini",   label: "Gemini",   color: "#34d399" },
  { value: "deepseek", label: "DeepSeek", color: "#60a5fa" },
  { value: "nemotron", label: "NVIDIA",   color: "#f472b6" },
  { value: "gptoss",   label: "GPT OSS",  color: "#10a37f" },
];

export default function VoicePage() {
  const [status, setStatus] = useState<Status>("idle");
  const [model, setModel] = useState("groq");
  const [transcript, setTranscript] = useState("");
  const [aiText, setAiText] = useState("");
  const [showModelPicker, setShowModelPicker] = useState(false);
  const [history, setHistory] = useState<{ role: string; content: string }[]>([]);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isActiveRef = useRef(false);
  const inputAccRef = useRef(""); // accumulated speech input

  const currentModel = MODELS.find(m => m.value === model)!;

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
    }
    return () => {
      stopEverything();
    };
  }, []);

  const stopEverything = () => {
    isActiveRef.current = false;
    try { recognitionRef.current?.abort(); } catch { /* ignore */ }
    synthRef.current?.cancel();
    setStatus("idle");
    setTranscript("");
    inputAccRef.current = "";
  };

  // ── SPEAK ──
  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!synthRef.current) { resolve(); return; }
      synthRef.current.cancel();

      const clean = text
        .replace(/```[\s\S]*?```/g, "code block")
        .replace(/`([^`]+)`/g, "$1")
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/#+\s/g, "")
        .substring(0, 600);

      const utterance = new SpeechSynthesisUtterance(clean);

      const doSpeak = () => {
        const voices = synthRef.current!.getVoices();
        const preferred =
          voices.find(v => v.name === "Raveena") ||
          voices.find(v => v.name === "Neerja") ||
          voices.find(v => v.name === "Heera") ||
          voices.find(v => v.name === "Google Hindi") ||
          voices.find(v => v.lang === "hi-IN") ||
          voices.find(v => v.lang === "en-IN") ||
          voices.find(v => v.name === "Google UK English Female") ||
          voices.find(v => v.name === "Samantha") ||
          voices.find(v => v.lang.startsWith("en"));

        if (preferred) utterance.voice = preferred;
        utterance.lang   = "hi-IN";
        utterance.rate   = 0.88;
        utterance.pitch  = 1.35;
        utterance.volume = 0.8;
        utterance.onend   = () => resolve();
        utterance.onerror = () => resolve();
        synthRef.current!.speak(utterance);
      };

      if (synthRef.current!.getVoices().length === 0) {
        synthRef.current!.onvoiceschanged = doSpeak;
      } else {
        doSpeak();
      }
    });
  }, []);

  // ── SEND TO AI ──
  const sendToAI = useCallback(async (userText: string) => {
    if (!userText.trim()) return;

    setStatus("thinking");
    setTranscript("");
    setAiText("Soch rahi hun...");

    const newHistory = [...history, { role: "user", content: userText }];
    setHistory(newHistory);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newHistory,
          message: userText,
          model,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "Kuch samajh nahi aaya!";

      setHistory(prev => [...prev, { role: "assistant", content: reply }]);
      setAiText(reply.substring(0, 120) + (reply.length > 120 ? "..." : ""));
      setStatus("speaking");

      await speak(reply);

      // After speaking — start listening again automatically
      if (isActiveRef.current) {
        setAiText("");
        startListeningCycle();
      }
    } catch {
      setAiText("Kuch galat ho gaya!");
      setStatus("idle");
    }
  }, [history, model, speak]);

  // ── LISTEN CYCLE ──
  const startListeningCycle = useCallback(() => {
    if (!isActiveRef.current) return;

    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Chrome use karo voice ke liye!");
      return;
    }

    setStatus("listening");
    setTranscript("");
    inputAccRef.current = "";

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-IN";

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setTranscript(interim || final);
      if (final) {
        inputAccRef.current = final.trim();
      }
    };

    recognition.onend = () => {
      if (!isActiveRef.current) return;
      if (inputAccRef.current.trim()) {
        sendToAI(inputAccRef.current.trim());
      } else {
        // Kuch nahi suna — dobara sun
        setTimeout(startListeningCycle, 500);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        alert("Mic permission do!");
        stopEverything();
        return;
      }
      if (isActiveRef.current) {
        setTimeout(startListeningCycle, 500);
      }
    };

    try {
      recognition.start();
    } catch {
      setTimeout(startListeningCycle, 500);
    }
  }, [sendToAI]);

  // ── START / STOP ──
  const toggleVoice = () => {
    if (isActiveRef.current) {
      stopEverything();
    } else {
      isActiveRef.current = true;
      startListeningCycle();
    }
  };

  // Orb colors based on status
  const orbColors: Record<Status, string[]> = {
    idle:      ["#1a1a2e", "#16213e", "#0f3460"],
    listening: ["#1a0a2e", "#2d1b69", "#5b21b6", "#7c3aed"],
    thinking:  [currentModel.color + "33", currentModel.color + "66", currentModel.color + "99"],
    speaking:  ["#0a1628", "#1e3a5f", "#2563eb", "#60a5fa"],
  };

  const orbGlow: Record<Status, string> = {
    idle:      "none",
    listening: "0 0 60px 20px rgba(124,58,237,0.3), 0 0 120px 40px rgba(124,58,237,0.15)",
    thinking:  `0 0 60px 20px ${currentModel.color}44, 0 0 120px 40px ${currentModel.color}22`,
    speaking:  "0 0 60px 20px rgba(37,99,235,0.4), 0 0 120px 40px rgba(37,99,235,0.2)",
  };

  const statusText: Record<Status, string> = {
    idle:      "Baat karne ke liye tap karo",
    listening: "Sun rahi hun...",
    thinking:  "Soch rahi hun...",
    speaking:  aiText || "Bol rahi hun...",
  };

  return (
    <div style={{ height:"100dvh", background:"#000", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"space-between", padding:"40px 20px 50px", fontFamily:"'Inter',sans-serif", overflow:"hidden", position:"relative" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        * { margin:0; padding:0; box-sizing:border-box; }

        @keyframes orbPulse {
          0%,100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes orbListening {
          0%,100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.08) rotate(1deg); }
          75% { transform: scale(0.96) rotate(-1deg); }
        }
        @keyframes orbThinking {
          0% { transform: scale(1) rotate(0deg); }
          100% { transform: scale(1) rotate(360deg); }
        }
        @keyframes orbSpeaking {
          0%,100% { transform: scale(1); }
          20% { transform: scale(1.1); }
          40% { transform: scale(0.95); }
          60% { transform: scale(1.07); }
          80% { transform: scale(0.98); }
        }
        @keyframes fadeIn { from{opacity:0;transform:translateY(8px);} to{opacity:1;transform:translateY(0);} }

        .orb-idle      { animation: orbPulse 3s ease-in-out infinite; }
        .orb-listening { animation: orbListening 0.8s ease-in-out infinite; }
        .orb-thinking  { animation: orbThinking 3s linear infinite; }
        .orb-speaking  { animation: orbSpeaking 0.6s ease-in-out infinite; }

        .model-chip { background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.12); border-radius:20px; padding:6px 14px; font-size:13px; color:rgba(255,255,255,0.7); cursor:pointer; transition:all 0.2s; font-family:'Inter',sans-serif; }
        .model-chip:hover { background:rgba(255,255,255,0.12); }

        .model-option { width:100%; padding:12px 16px; background:transparent; border:none; border-bottom:1px solid rgba(255,255,255,0.06); color:white; font-size:14px; cursor:pointer; text-align:left; font-family:'Inter',sans-serif; transition:background 0.2s; display:flex; align-items:center; gap:10px; }
        .model-option:hover { background:rgba(255,255,255,0.06); }
        .model-option:last-child { border-bottom:none; }

        .main-btn { width:72px; height:72px; border-radius:50%; border:none; cursor:pointer; display:flex; align-items:center; justify-content:center; font-size:28px; transition:all 0.3s; position:relative; }
        .main-btn::after { content:''; position:absolute; inset:-4px; border-radius:50%; border:2px solid rgba(255,255,255,0.15); }

        .status-text { font-size:15px; color:rgba(255,255,255,0.5); text-align:center; min-height:44px; max-width:280px; line-height:1.5; animation:fadeIn 0.3s ease both; }
        .transcript-text { font-size:17px; color:rgba(255,255,255,0.85); text-align:center; max-width:300px; line-height:1.6; font-weight:400; animation:fadeIn 0.2s ease both; min-height:28px; }

        .back-btn { position:absolute; top:20px; left:20px; background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.1); border-radius:10px; padding:8px 14px; color:rgba(255,255,255,0.6); font-size:13px; cursor:pointer; font-family:'Inter',sans-serif; text-decoration:none; }
      `}</style>

      {/* Back button */}
      <a href="/chat" className="back-btn">← Chat</a>

      {/* Top — Model picker */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, marginTop:20 }}>
        <div style={{ fontSize:13, color:"rgba(255,255,255,0.3)", marginBottom:4 }}>Universal AI Voice</div>
        <button className="model-chip" onClick={() => setShowModelPicker(!showModelPicker)}>
          <span style={{ color:currentModel.color }}>●</span> {currentModel.label} ▾
        </button>

        {/* Model picker dropdown */}
        {showModelPicker && (
          <div style={{ background:"#111", border:"1px solid rgba(255,255,255,0.1)", borderRadius:14, overflow:"hidden", width:220, marginTop:4, zIndex:10 }}>
            {MODELS.map(m => (
              <button key={m.value} className="model-option" onClick={() => { setModel(m.value); setShowModelPicker(false); }}>
                <span style={{ width:8, height:8, borderRadius:"50%", background:m.color, display:"inline-block" }}/>
                {m.label}
                {model===m.value && <span style={{ marginLeft:"auto", color:m.color, fontSize:12 }}>✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Center — Orb */}
      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:40, flex:1, justifyContent:"center" }}>
        <div
          className={`orb-${status}`}
          onClick={toggleVoice}
          style={{
            width: 220,
            height: 220,
            borderRadius: "50%",
            cursor: "pointer",
            boxShadow: orbGlow[status],
            position: "relative",
            background: `radial-gradient(circle at 35% 35%, ${orbColors[status].join(", ")})`,
            transition: "background 0.8s ease, box-shadow 0.8s ease",
          }}
        >
          {/* Inner glow layers */}
          <div style={{ position:"absolute", inset:"15%", borderRadius:"50%", background:`radial-gradient(circle at 40% 30%, rgba(255,255,255,0.15), transparent 70%)`, pointerEvents:"none" }}/>
          <div style={{ position:"absolute", inset:"30%", borderRadius:"50%", background:`radial-gradient(circle at 60% 70%, ${orbColors[status][orbColors[status].length-1]}44, transparent 60%)`, pointerEvents:"none" }}/>
        </div>

        {/* Transcript / AI text */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:10 }}>
          {transcript && status==="listening" && (
            <div className="transcript-text">"{transcript}"</div>
          )}
          <div className="status-text" key={statusText[status]}>
            {statusText[status]}
          </div>
        </div>
      </div>

      {/* Bottom — Controls */}
      <div style={{ display:"flex", alignItems:"center", gap:24 }}>

        {/* Stop/Clear history */}
        {isActiveRef.current && (
          <button
            onClick={() => { stopEverything(); setHistory([]); setAiText(""); }}
            style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", fontSize:18, cursor:"pointer" }}
          >
            ✕
          </button>
        )}

        {/* Main button */}
        <button
          className="main-btn"
          onClick={toggleVoice}
          style={{
            background: isActiveRef.current
              ? "rgba(239,68,68,0.2)"
              : status === "idle"
              ? "rgba(255,255,255,0.12)"
              : currentModel.color + "33",
            border: isActiveRef.current
              ? "2px solid rgba(239,68,68,0.5)"
              : `2px solid ${currentModel.color}66`,
          }}
        >
          {status === "idle" ? "🎙" : status === "listening" ? "🎙" : status === "thinking" ? "⏳" : "🔊"}
        </button>

        {/* Mute / new chat */}
        <button
          onClick={() => { setHistory([]); setAiText(""); }}
          style={{ width:48, height:48, borderRadius:"50%", background:"rgba(255,255,255,0.08)", border:"1px solid rgba(255,255,255,0.15)", color:"rgba(255,255,255,0.6)", fontSize:16, cursor:"pointer" }}
          title="New conversation"
        >
          ↺
        </button>
      </div>
    </div>
  );
}