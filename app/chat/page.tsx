"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";

type Message = {
  role: "user" | "assistant";
  content: string;
  model?: string;
};

const MODELS = [
  { value: "groq",     provider: "Groq",     label: "Llama 3.3",    icon: "⚡", color: "#a78bfa", tag: "FREE" },
  { value: "gemini",   provider: "Gemini",   label: "Flash 1.5",    icon: "✦",  color: "#34d399", tag: "FREE" },
  { value: "deepseek", provider: "DeepSeek", label: "V3.2",         icon: "🔮", color: "#60a5fa", tag: "FREE" },
  { value: "nemotron", provider: "NVIDIA",   label: "Nemotron 120B",icon: "🟢", color: "#f472b6", tag: "FREE" },
  { value: "gptoss",   provider: "OpenAI",   label: "GPT OSS 120B", icon: "🤖", color: "#10a37f", tag: "FREE" },
];

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [model, setModel] = useState("groq");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [liveText, setLiveText] = useState("");

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const isListeningRef = useRef(false);
  const inputRef = useRef("");

  useEffect(() => { inputRef.current = input; }, [input]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
    }
  }, []);

  // ── SPEAK ──
  const speak = useCallback((text: string) => {
    if (!synthRef.current || !voiceEnabled) return;
    synthRef.current.cancel();

    const clean = text
      .replace(/```[\s\S]*?```/g, "code block")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/#+\s/g, "")
      .substring(0, 500);

    const utterance = new SpeechSynthesisUtterance(clean);

    const setVoice = () => {
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
      utterance.volume = 0.75;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      synthRef.current!.speak(utterance);
    };

    if (synthRef.current.getVoices().length === 0) {
      synthRef.current.onvoiceschanged = setVoice;
    } else {
      setVoice();
    }
  }, [voiceEnabled]);

  const stopSpeaking = () => {
    synthRef.current?.cancel();
    setIsSpeaking(false);
  };

  // ── MIC ──
  const startListening = () => {
    const SpeechRecognitionAPI =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionAPI) {
      alert("Chrome browser use karo!");
      return;
    }

    if (isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      setIsListening(false);
      setLiveText("");
      return;
    }

    isListeningRef.current = true;
    setIsListening(true);
    setLiveText("");

    const startRecognition = () => {
      if (!isListeningRef.current) return;

      const recognition = new SpeechRecognitionAPI();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onresult = (event: any) => {
        let interimText = "";
        let finalText = "";
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalText += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        setLiveText(interimText || finalText);

        if (finalText) {
          const newValue = inputRef.current
            ? inputRef.current + " " + finalText.trim()
            : finalText.trim();
          setInput(newValue);
          inputRef.current = newValue;
          setLiveText("");

          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height =
              Math.min(textareaRef.current.scrollHeight, 150) + "px";
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === "not-allowed") {
          alert("Mic permission do browser settings mein!");
          isListeningRef.current = false;
          setIsListening(false);
          return;
        }
        if (isListeningRef.current) {
          setTimeout(startRecognition, 300);
        }
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          setTimeout(startRecognition, 200);
        } else {
          setIsListening(false);
          setLiveText("");
        }
      };

      try {
        recognition.start();
      } catch {
        setTimeout(startRecognition, 300);
      }
    };

    startRecognition();
  };

  // ── SEND ──
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (isListeningRef.current) {
      isListeningRef.current = false;
      try { recognitionRef.current?.abort(); } catch { /* ignore */ }
      setIsListening(false);
      setLiveText("");
    }

    setMessages(prev => [...prev, { role: "user", content: text }]);
    setInput("");
    inputRef.current = "";
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: text }],
          message: text,
          model,
        }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.message || "No reply received.";
      setMessages(prev => [...prev, { role: "assistant", content: reply, model }]);
      if (voiceEnabled) speak(reply);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Try again!", model }]);
    } finally {
      setLoading(false);
    }
  };

  const currentModel = MODELS.find(m => m.value === model)!;

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
        @media (max-width:600px) {
          .model-tab { padding:6px 10px; }
          .model-label { display:none; }
          .msg-max { max-width:90% !important; }
          .avatar { width:26px !important; height:26px !important; font-size:11px !important; }
          .hint-text { display:none; }
        }
      `}</style>

      {/* HEADER */}
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
            <button
              onClick={() => { setVoiceEnabled(!voiceEnabled); stopSpeaking(); }}
              style={{ background:voiceEnabled?"rgba(168,139,250,0.15)":"#111", border:voiceEnabled?"1px solid rgba(168,139,250,0.3)":"1px solid #222", borderRadius:8, padding:"6px 12px", color:voiceEnabled?"#a78bfa":"#444", fontSize:12, fontWeight:600, cursor:"pointer", display:"flex", alignItems:"center", gap:5, fontFamily:"Inter,sans-serif", transition:"all 0.2s" }}
            >
              <span style={{ fontSize:14 }}>{voiceEnabled ? "🔊" : "🔇"}</span>
              <span>{voiceEnabled ? "Voice On" : "Voice Off"}</span>
            </button>
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

      {/* MESSAGES */}
      <div style={{ flex:1, overflowY:"auto", padding:"20px 16px" }}>
        <div style={{ maxWidth:800, margin:"0 auto", display:"flex", flexDirection:"column", gap:16 }}>

          {messages.length === 0 && (
            <div style={{ textAlign:"center", padding:"40px 0" }}>
              <div style={{ fontSize:32, marginBottom:12, color:currentModel.color }}>✦</div>
              <div style={{ fontSize:18, fontWeight:700, color:"#222", marginBottom:6 }}>Kya help karu aapki?</div>
              <div style={{ fontSize:13, color:"#333", marginBottom:8 }}>
                Using <span style={{ color:currentModel.color, fontWeight:600 }}>{currentModel.icon} {currentModel.provider}</span>
              </div>
              <div style={{ fontSize:12, color:"#222", marginBottom:24 }}>
                {voiceEnabled ? "🎙 Mic se bolo, main jawab bhi doongi" : "🔇 Upar se Voice On karo"}
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
                {msg.role==="assistant" && (
                  <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:`${msgModel.color}15`, border:`1px solid ${msgModel.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, marginTop:2 }}>{msgModel.icon}</div>
                )}
                <div className="msg-max" style={{ maxWidth:"82%", padding:msg.role==="user"?"10px 14px":"12px 16px", borderRadius:msg.role==="user"?"16px 16px 4px 16px":"4px 16px 16px 16px", background:msg.role==="user"?"white":"#0d0d0d", color:msg.role==="user"?"#080808":"#ccc", border:msg.role==="assistant"?"1px solid #1a1a1a":"none", fontSize:15, lineHeight:1.75, fontWeight:msg.role==="user"?500:400, wordBreak:"break-word" }}>
                  {msg.role==="user" ? msg.content : <div className="md"><ReactMarkdown>{msg.content}</ReactMarkdown></div>}
                  {msg.role==="assistant" && (
                    <button onClick={() => isSpeaking ? stopSpeaking() : speak(msg.content)} style={{ marginTop:8, background:"transparent", border:"none", color:"#333", fontSize:12, cursor:"pointer", padding:"2px 0", fontFamily:"Inter,sans-serif" }}>
                      {isSpeaking ? "⏹ Roko" : "🔊 Sunao"}
                    </button>
                  )}
                </div>
                {msg.role==="user" && (
                  <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:"#1a1a1a", border:"1px solid #222", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, flexShrink:0, marginTop:2, color:"#444", fontWeight:700 }}>U</div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="msg-in" style={{ display:"flex", gap:8, alignItems:"flex-start" }}>
              <div className="avatar" style={{ width:30, height:30, borderRadius:8, background:`${currentModel.color}15`, border:`1px solid ${currentModel.color}30`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0 }}>{currentModel.icon}</div>
              <div style={{ padding:"12px 16px", borderRadius:"4px 16px 16px 16px", background:"#0d0d0d", border:"1px solid #1a1a1a" }}>
                <div className="typing"><span/><span/><span/></div>
              </div>
            </div>
          )}

          <div ref={bottomRef}/>
        </div>
      </div>

      {/* INPUT */}
      <div style={{ borderTop:"1px solid rgba(255,255,255,0.06)", padding:"12px 16px", background:"rgba(8,8,8,0.98)", backdropFilter:"blur(16px)", flexShrink:0, paddingBottom:"max(12px, env(safe-area-inset-bottom))" }}>
        <div style={{ maxWidth:800, margin:"0 auto" }}>

          {liveText && <div className="live-text">🎙 {liveText}</div>}

          <div style={{ background:"#0d0d0d", border:`1px solid ${isListening?"#ef4444":currentModel.color}30`, borderRadius:14, display:"flex", alignItems:"flex-end", transition:"border-color 0.2s" }}>
            <textarea
              ref={textareaRef}
              className="chat-ta"
              value={input}
              rows={1}
              onChange={e => {
                setInput(e.target.value);
                inputRef.current = e.target.value;
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
              }}
              onKeyDown={e => {
                if (e.key==="Enter" && !e.shiftKey && !loading) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={isListening ? "Sun rahi hun... 🎙" : `${currentModel.provider} se pucho kuch bhi...`}
            />

            <button className={`icon-btn ${isListening?"mic-active":""}`} onClick={startListening} style={{ margin:"8px 4px 8px 0", color:isListening?"#ef4444":"#444", border:isListening?"1px solid rgba(239,68,68,0.3)":"1px solid transparent" }}>
              {isListening ? "⏹" : "🎙"}
            </button>

            {isSpeaking && (
              <button className="icon-btn speaking-pulse" onClick={stopSpeaking} style={{ margin:"8px 4px 8px 0", color:"#a78bfa", border:"1px solid rgba(167,139,250,0.3)" }}>🔊</button>
            )}

            <button className="send-btn" onClick={sendMessage} disabled={loading||!input.trim()} style={{ margin:"8px 8px 8px 0", background:input.trim()&&!loading?currentModel.color:"#1a1a1a", color:input.trim()&&!loading?"white":"#333" }}>
              ↑
            </button>
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:6, padding:"0 4px" }}>
            <span className="hint-text" style={{ fontSize:11, color:"#222" }}>Enter to send · Shift+Enter new line</span>
            <span style={{ fontSize:11, color:currentModel.color, opacity:0.6 }}>{currentModel.icon} {currentModel.provider}</span>
          </div>
        </div>
      </div>
    </div>
  );
}