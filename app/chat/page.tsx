"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Msg = { role:"user"|"assistant"; content:string; model?:string; files?:UFile[]; shapes?:Shape[]; };
type UFile = { name:string; type:string; size:number; dataUrl:string; text?:string; };
type Shape = { id:string; type:"rect"|"circle"|"text"|"line"; x:number; y:number; w?:number; h?:number; r?:number; text?:string; color:string; fill?:string; fontSize?:number; bold?:boolean; };
type VS = "idle"|"listening"|"thinking"|"speaking";
type ChatSession = { id:string; title:string; messages:Msg[]; model:string; createdAt:number; };

const MODELS = [
  { v:"groq",     p:"Groq",     l:"Llama 3.3",     i:"⚡", tag:"FREE" },
  { v:"gemini",   p:"Gemini",   l:"Flash 2.5",     i:"✦",  tag:"FREE" },
  { v:"deepseek", p:"DeepSeek", l:"V3.2",           i:"◎",  tag:"FREE" },
  { v:"nemotron", p:"NVIDIA",   l:"Nemotron 120B",  i:"▣",  tag:"FREE" },
  { v:"gptoss",   p:"OpenAI",   l:"GPT OSS 120B",   i:"🤖", tag:"FREE" },
];

const SUGG = [
  { icon:"💡", text:"Python script likho",          cat:"Code"    },
  { icon:"🔭", text:"Black holes explain karo",     cat:"Science" },
  { icon:"📊", text:"Excel sheet banao",            cat:"Excel"   },
  { icon:"🐛", text:"Code debug karo",              cat:"Debug"   },
  { icon:"✉️", text:"Email likhne mein help karo", cat:"Writing" },
  { icon:"🖼",  text:"Is image ko analyze karo",    cat:"Image"   },
];

const CANVAS_KW = ["canvas","whiteboard","white canvas","diagram banao","draw karo","sketch"];
const isCanvas  = (t:string) => CANVAS_KW.some(k=>t.toLowerCase().includes(k));

function extractCSV(t:string){ const m=t.match(/```csv\n([\s\S]+?)```/); return m?m[1]:null; }
function extractShapes(t:string):Shape[]|null{ const m=t.match(/```canvas\n?([\s\S]+?)```/); if(!m) return null; try{ return JSON.parse(m[1]); }catch{ return null; } }
function csvHtml(csv:string){ const rows=csv.trim().split("\n").map(r=>r.split(",").map(c=>c.trim().replace(/^"|"$/g,""))); if(!rows.length) return ""; return `<table class="ctbl"><thead><tr>${rows[0].map(h=>`<th>${h}</th>`).join("")}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(c=>`<td>${c}</td>`).join("")}</tr>`).join("")}</tbody></table>`; }
function dlCSV(csv:string){ const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"})); a.download="export.csv"; a.click(); }
function fmtB(b:number){ return b<1024?b+"B":b<1048576?(b/1024).toFixed(1)+"KB":(b/1048576).toFixed(1)+"MB"; }
function fIcon(t:string){ if(t.startsWith("image/"))return"🖼"; if(t.includes("pdf"))return"📄"; if(t.includes("sheet")||t.includes("csv"))return"📊"; if(t.includes("word"))return"📝"; return"📎"; }
function genId(){ return Math.random().toString(36).slice(2)+Date.now().toString(36); }
function groupSessions(sessions:ChatSession[]){ const now=Date.now(); const day=86400000; const today:ChatSession[]=[]; const yesterday:ChatSession[]=[]; const week:ChatSession[]=[]; const older:ChatSession[]=[]; sessions.forEach(s=>{ const d=now-s.createdAt; if(d<day) today.push(s); else if(d<2*day) yesterday.push(s); else if(d<7*day) week.push(s); else older.push(s); }); return {today,yesterday,week,older}; }
async function toDataUrl(f:File):Promise<string>{ return new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(rd.result as string);rd.readAsDataURL(f);}); }
async function toText(f:File):Promise<string>{ return new Promise(r=>{const rd=new FileReader();rd.onload=()=>r(rd.result as string||"");rd.onerror=()=>r("");rd.readAsText(f);}); }
async function procFile(f:File):Promise<UFile>{ const dataUrl=await toDataUrl(f); const text=f.type.startsWith("image/")? "":(await toText(f)).slice(0,8000); return {name:f.name,type:f.type,size:f.size,dataUrl,text}; }

function MiniCanvas({shapes,onClose}:{shapes:Shape[];onClose:()=>void}){
  const ref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{ const c=ref.current; if(!c) return; const ctx=c.getContext("2d")!; ctx.fillStyle="#fff"; ctx.fillRect(0,0,c.width,c.height); ctx.strokeStyle="rgba(0,0,0,0.05)"; ctx.lineWidth=1; for(let x=0;x<c.width;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,c.height);ctx.stroke();} for(let y=0;y<c.height;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(c.width,y);ctx.stroke();} shapes.forEach(s=>{ ctx.strokeStyle=s.color||"#1d4ed8"; ctx.fillStyle=s.fill||"transparent"; ctx.lineWidth=2; if(s.type==="rect"){if(s.fill&&s.fill!=="transparent"){ctx.fillStyle=s.fill;ctx.fillRect(s.x,s.y,s.w!,s.h!);}ctx.strokeRect(s.x,s.y,s.w!,s.h!);} else if(s.type==="circle"){ctx.beginPath();ctx.arc(s.x,s.y,s.r!,0,Math.PI*2);if(s.fill&&s.fill!=="transparent")ctx.fill();ctx.stroke();} else if(s.type==="text"){ctx.font=`${s.bold?"bold ":""}${s.fontSize||15}px 'Inter',sans-serif`;ctx.fillStyle=s.color||"#111";ctx.fillText(s.text!,s.x,s.y);} else if(s.type==="line"){ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.w!,s.h!);ctx.stroke();} }); },[shapes]);
  return(<div style={{border:"1px solid #3a3a3a",borderRadius:12,overflow:"hidden",marginTop:12}}><div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"8px 14px",background:"#2a2a2a",borderBottom:"1px solid #3a3a3a"}}><span style={{fontSize:"0.7rem",fontWeight:700,color:"#888",letterSpacing:"0.06em"}}>🎨 CANVAS</span><div style={{display:"flex",gap:8}}><button onClick={()=>{const c=ref.current;if(!c)return;const a=document.createElement("a");a.href=c.toDataURL();a.download="canvas.png";a.click();}} style={{padding:"3px 10px",borderRadius:6,border:"none",background:"#e5e7eb",color:"#111",fontSize:"0.68rem",fontWeight:700,cursor:"pointer"}}>↓ Save</button><button onClick={onClose} style={{padding:"3px 10px",borderRadius:6,border:"1px solid #3a3a3a",background:"transparent",color:"#888",fontSize:"0.68rem",cursor:"pointer"}}>✕</button></div></div><div style={{overflow:"auto",padding:16,background:"#1e1e1e"}}><canvas ref={ref} width={900} height={480} style={{display:"block",maxWidth:"100%",borderRadius:8,boxShadow:"0 2px 16px rgba(0,0,0,0.4)"}}/></div></div>);
}

export default function ChatPage(){
  const router = useRouter();
  const [authReady,  setAuthReady]  = useState(false);
  const [userName,   setUserName]   = useState("User");
  const [userEmail,  setUserEmail]  = useState("");
  const [msgs,       setMsgs]       = useState<Msg[]>([]);
  const [input,      setInput]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [model,      setModel]      = useState("groq");
  const [showPick,   setShowPick]   = useState(false);
  const [files,      setFiles]      = useState<UFile[]>([]);
  const [dragging,   setDragging]   = useState(false);
  const [closedC,    setClosedC]    = useState<Set<number>>(new Set());
  const [listening,  setListening]  = useState(false);
  const [speaking,   setSpeaking]   = useState(false);
  const [voiceOn,    setVoiceOn]    = useState(false);
  const [liveText,   setLiveText]   = useState("");
  const [kittuMode,  setKittuMode]  = useState(false);
  const [vs,         setVs]         = useState<VS>("idle");
  const [vTranscript,setVTranscript]= useState("");
  const [vAiText,    setVAiText]    = useState("");
  const [vHistory,   setVHistory]   = useState<{role:string;content:string}[]>([]);
  const [kGreeted,   setKGreeted]   = useState(false);
  const [sidebarOpen,setSidebarOpen]= useState(false);
  const [sessions,   setSessions]   = useState<ChatSession[]>([]);
  const [activeId,   setActiveId]   = useState<string|null>(null);
  const [searchQ,    setSearchQ]    = useState("");
  const [showProfile,setShowProfile]= useState(false);

  const botRef    = useRef<HTMLDivElement>(null);
  const taRef     = useRef<HTMLTextAreaElement>(null);
  const fileRef   = useRef<HTMLInputElement>(null);
  const recRef    = useRef<any>(null);
  const audioRef  = useRef<HTMLAudioElement|null>(null); // ← ElevenLabs audio
  const pickRef   = useRef<HTMLDivElement>(null);
  const lisRef    = useRef(false);
  const inpRef    = useRef("");
  const vActiveRef= useRef(false);
  const vInpRef   = useRef("");
  const profileRef= useRef<HTMLDivElement>(null);

  useEffect(()=>{ const session=localStorage.getItem("uai_session"); if(!session){router.push("/login");return;} try{const data=JSON.parse(session);setUserEmail(data.email||"");setUserName(data.email?.split("@")[0]||"User");}catch{} setAuthReady(true); try{const saved=localStorage.getItem("uai_sessions");if(saved)setSessions(JSON.parse(saved));}catch{} },[]);
  useEffect(()=>{ if(!authReady) return; try{localStorage.setItem("uai_sessions",JSON.stringify(sessions));}catch{} },[sessions,authReady]);

  const saveCurrentSession=useCallback((currentMsgs:Msg[],currentModel:string,currentId:string|null)=>{ if(currentMsgs.length===0) return null; const title=currentMsgs.find(m=>m.role==="user")?.content.slice(0,50)||"New chat"; const id=currentId||genId(); setSessions(prev=>{const exists=prev.find(s=>s.id===id);if(exists) return prev.map(s=>s.id===id?{...s,messages:currentMsgs,model:currentModel,title}:s);return [{id,title,messages:currentMsgs,model:currentModel,createdAt:Date.now()},...prev];}); return id; },[]);

  const handleLogout=()=>{localStorage.removeItem("uai_session");router.push("/login");};

  useEffect(()=>{inpRef.current=input;},[input]);
  useEffect(()=>{botRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,loading]);
  useEffect(()=>{ const fn=(e:MouseEvent)=>{ if(pickRef.current&&!pickRef.current.contains(e.target as Node))setShowPick(false); if(profileRef.current&&!profileRef.current.contains(e.target as Node))setShowProfile(false); }; document.addEventListener("mousedown",fn); return()=>document.removeEventListener("mousedown",fn); },[]);
  useEffect(()=>{ const fn=(e:MouseEvent)=>{const sb=document.getElementById("sidebar");if(sidebarOpen&&sb&&!sb.contains(e.target as Node)){const tog=document.getElementById("sidebar-toggle");if(tog&&tog.contains(e.target as Node))return;setSidebarOpen(false);}};document.addEventListener("mousedown",fn);return()=>document.removeEventListener("mousedown",fn); },[sidebarOpen]);

  const rTA=()=>{const ta=taRef.current;if(!ta)return;ta.style.height="auto";ta.style.height=Math.min(ta.scrollHeight,160)+"px";};
  const addFiles=async(fl:FileList|File[])=>{const p=await Promise.all(Array.from(fl).map(procFile));setFiles(prev=>[...prev,...p]);};
  const onFI=(e:React.ChangeEvent<HTMLInputElement>)=>{if(e.target.files)addFiles(e.target.files);e.target.value="";};
  const onDrop=(e:React.DragEvent)=>{e.preventDefault();setDragging(false);if(e.dataTransfer.files)addFiles(e.dataTransfer.files);};
  const rmFile=(i:number)=>setFiles(prev=>prev.filter((_,j)=>j!==i));

  const startNewChat=useCallback(()=>{if(msgs.length>0){saveCurrentSession(msgs,model,activeId);}setMsgs([]);setInput("");setFiles([]);setActiveId(null);setClosedC(new Set());if(taRef.current)taRef.current.style.height="auto";if(window.innerWidth<768)setSidebarOpen(false);},[msgs,model,activeId,saveCurrentSession]);
  const loadSession=(session:ChatSession)=>{if(msgs.length>0&&activeId!==session.id)saveCurrentSession(msgs,model,activeId);setMsgs(session.messages);setModel(session.model);setActiveId(session.id);setClosedC(new Set());if(window.innerWidth<768)setSidebarOpen(false);};
  const deleteSession=(id:string,e:React.MouseEvent)=>{e.stopPropagation();setSessions(prev=>prev.filter(s=>s.id!==id));if(activeId===id){setMsgs([]);setActiveId(null);}};

  const send=async(ov?:string)=>{ const text=(ov??input).trim(); if((!text&&files.length===0)||loading) return; const imgFiles=files.filter(f=>f.type.startsWith("image/")); const otherFiles=files.filter(f=>!f.type.startsWith("image/")); const wc=isCanvas(text); let ctx=""; if(otherFiles.length>0) ctx="\n\n[Files attached]\n"+otherFiles.map(f=>`${f.name}:\n${(f.text||"").slice(0,5000)}`).join("\n\n"); if(imgFiles.length>0&&!wc) ctx+="\n\nAnalyze the attached image thoroughly."; const um:Msg={role:"user",content:text,files:files.length>0?[...files]:undefined}; const newMsgs=[...msgs,um]; setMsgs(newMsgs); setInput(""); inpRef.current=""; setFiles([]); if(taRef.current) taRef.current.style.height="auto"; setLoading(true); try{ const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:text+ctx,model,wantsCanvas:wc,images:imgFiles.map(f=>f.dataUrl)})}); const data=await res.json(); const reply=data.reply||"No reply received."; const shapes=wc?extractShapes(reply)||undefined:undefined; const finalMsgs=[...newMsgs,{role:"assistant" as const,content:reply,model,shapes}]; setMsgs(finalMsgs); const savedId=saveCurrentSession(finalMsgs,model,activeId); if(savedId&&!activeId) setActiveId(savedId); if(voiceOn) spk(reply); }catch{setMsgs(prev=>[...prev,{role:"assistant",content:"Network error. Try again.",model}]);} setLoading(false); };

  // ── ElevenLabs real voice ──────────────────────────────────────
  const spk = (text: string, cb?: () => void) => {
    if (!text.trim()) { cb?.(); return; }
    // Stop any currently playing audio
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/[*#_~>\[\]]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .slice(0, 500);
    setSpeaking(true);
    fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: clean }),
    }).then(async (res) => {
      if (!res.ok) throw new Error("TTS failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; cb?.(); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); audioRef.current = null; cb?.(); };
      audio.play();
    }).catch(() => { setSpeaking(false); cb?.(); });
  };

  const spkP = (t: string): Promise<void> => new Promise(r => spk(t, r));
  const speak = useCallback((t: string) => { if (!voiceOn) return; spk(t); }, [voiceOn]);
  const stopSpk = () => { if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; } setSpeaking(false); };
  // ──────────────────────────────────────────────────────────────

  const startMic=()=>{ const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition; if(!SR){alert("Chrome use karo!");return;} if(lisRef.current){lisRef.current=false;try{recRef.current?.abort();}catch{}setListening(false);setLiveText("");return;} lisRef.current=true;setListening(true);setLiveText(""); const go=()=>{ if(!lisRef.current) return; const r=new SR();recRef.current=r;r.continuous=false;r.interimResults=true;r.lang="en-IN"; r.onresult=(e:any)=>{let i="",f="";for(let j=0;j<e.results.length;j++) e.results[j].isFinal?(f+=e.results[j][0].transcript):(i+=e.results[j][0].transcript);setLiveText(i||f);if(f){const nv=inpRef.current?inpRef.current+" "+f.trim():f.trim();setInput(nv);inpRef.current=nv;setLiveText("");setTimeout(rTA,0);}}; r.onerror=(e:any)=>{if(e.error==="not-allowed"){alert("Mic permission do!");lisRef.current=false;setListening(false);return;}if(lisRef.current)setTimeout(go,300);}; r.onend=()=>lisRef.current?setTimeout(go,200):(setListening(false),setLiveText("")); try{r.start();}catch{setTimeout(go,300);} }; go(); };

  const stopAll=useCallback(()=>{vActiveRef.current=false;try{recRef.current?.abort();}catch{}if(audioRef.current){audioRef.current.pause();audioRef.current=null;}setVs("idle");setVTranscript("");vInpRef.current="";},[]);
  const kListen=useCallback(()=>{ if(!vActiveRef.current) return; const SR=(window as any).SpeechRecognition||(window as any).webkitSpeechRecognition;if(!SR)return; setVs("listening");setVTranscript("");vInpRef.current=""; const r=new SR();recRef.current=r;r.continuous=false;r.interimResults=true;r.lang="en-IN"; r.onresult=(e:any)=>{let i="",f="";for(let j=0;j<e.results.length;j++) e.results[j].isFinal?(f+=e.results[j][0].transcript):(i+=e.results[j][0].transcript);setVTranscript(i||f);if(f)vInpRef.current=f.trim();}; r.onend=()=>{if(!vActiveRef.current)return;vInpRef.current.trim()?kSend(vInpRef.current.trim()):setTimeout(kListen,500);}; r.onerror=(e:any)=>{if(e.error==="not-allowed"){alert("Mic permission!");stopAll();return;}if(vActiveRef.current)setTimeout(kListen,500);}; try{r.start();}catch{setTimeout(kListen,500);} },[stopAll]);
  const kSend=useCallback(async(t:string)=>{ if(!t.trim())return; setVs("thinking");setVTranscript("");setVAiText("Soch rahi hun..."); const nh=[...vHistory,{role:"user",content:t}];setVHistory(nh); try{ const res=await fetch("/api/chat",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:"You are Kittu, a warm friendly Hinglish AI. Be natural, short replies.\n\n"+t,model,wantsCanvas:false})}); const d=await res.json();const rep=d.reply||"Kuch samajh nahi aaya!"; setVHistory(p=>[...p,{role:"assistant",content:rep}]); setVAiText(rep.slice(0,120)+(rep.length>120?"...":""));setVs("speaking"); await spkP(rep); if(vActiveRef.current){setVAiText("");kListen();} }catch{setVAiText("Error!");setVs("idle");} },[vHistory,model,kListen]);
  const togKittu=()=>{vActiveRef.current?stopAll():(vActiveRef.current=true,kListen());};
  const openKittu=async()=>{ setKittuMode(true);setVs("idle");setVTranscript("");setVAiText(""); if(!kGreeted){setKGreeted(true);setVs("speaking");const g="Hi! Main Kittu hoon. Kaise help karun?";setVAiText(g);await spkP(g);setVAiText("");setVs("idle");} };
  const closeKittu=()=>{stopAll();setKittuMode(false);setVHistory([]);setKGreeted(false);};

  const cur=MODELS.find(m=>m.v===model)!;
  const vsLabel:Record<VS,string>={idle:"Tap to talk",listening:"Listening...",thinking:"Thinking...",speaking:vAiText||"Speaking..."};
  const filtered=sessions.filter(s=>s.title.toLowerCase().includes(searchQ.toLowerCase()));
  const grouped=groupSessions(filtered);
  const userInitial=userName?.[0]?.toUpperCase()||"U";

  if(!authReady) return(<div style={{height:"100dvh",background:"#1c1c1e",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Inter,sans-serif"}}><div style={{textAlign:"center"}}><div style={{fontSize:28,marginBottom:12}}>✦</div><div style={{color:"#636366",fontSize:"0.85rem"}}>Loading...</div></div></div>);

  return(
    <div style={{display:"flex",height:"100dvh",background:"#1c1c1e",color:"#e5e5e5",fontFamily:"'Inter',-apple-system,BlinkMacSystemFont,sans-serif",overflow:"hidden",position:"relative"}} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={onDrop}>
      <style dangerouslySetInnerHTML={{__html:`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        *,*::before,*::after{margin:0;padding:0;box-sizing:border-box;}
        ::-webkit-scrollbar{width:4px;} ::-webkit-scrollbar-thumb{background:#3a3a3a;border-radius:4px;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
        @keyframes msgIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-4px)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes dragP{0%,100%{border-color:#4b5563}50%{border-color:#9ca3af}}
        .sidebar{width:260px;height:100dvh;background:#161618;border-right:1px solid #2c2c2e;display:flex;flex-direction:column;flex-shrink:0;overflow:hidden;position:relative;z-index:60;}
        .sidebar-inner{width:260px;height:100%;display:flex;flex-direction:column;overflow:hidden;}
        .sidebar-overlay{display:none;}
        @media(max-width:767px){
          .sidebar{position:fixed;top:0;left:0;bottom:0;z-index:200;transform:translateX(-100%);transition:transform 0.25s cubic-bezier(0.4,0,0.2,1);width:260px !important;}
          .sidebar.open-mobile{transform:translateX(0);}
          .sidebar-overlay{display:block;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:199;backdrop-filter:blur(2px);}
          .nav-center{display:none !important;}
        }
        .sb-top{padding:12px 10px 8px;flex-shrink:0;}
        .sb-logo{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;margin-bottom:4px;}
        .sb-logo-av{width:28px;height:28px;border-radius:8px;background:#2c2c2e;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
        .sb-logo-name{font-size:0.88rem;font-weight:600;color:#e5e5e5;letter-spacing:-0.02em;}
        .sb-logo-plan{font-size:0.65rem;color:#636366;}
        .sb-new{display:flex;align-items:center;gap:8px;width:100%;padding:9px 12px;border-radius:10px;background:transparent;border:none;color:#aeaeb2;font-size:0.84rem;font-weight:500;cursor:pointer;transition:all 0.15s;font-family:inherit;text-align:left;}
        .sb-new:hover{background:#242426;color:#e5e5e5;}
        .sb-new-icon{width:22px;height:22px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0;}
        .sb-search{margin:4px 10px 8px;position:relative;}
        .sb-search input{width:100%;padding:7px 12px 7px 32px;background:#242426;border:1px solid #2c2c2e;border-radius:9px;color:#e5e5e5;font-size:0.8rem;font-family:inherit;outline:none;}
        .sb-search input::placeholder{color:#48484a;}
        .sb-search-icon{position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#48484a;font-size:13px;pointer-events:none;}
        .sb-list{flex:1;overflow-y:auto;padding:0 6px;}
        .sb-group-label{padding:8px 10px 4px;font-size:0.65rem;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;color:#48484a;}
        .sb-item{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:9px;cursor:pointer;transition:all 0.15s;margin-bottom:1px;border:1px solid transparent;}
        .sb-item:hover{background:#242426;}
        .sb-item.active{background:#2c2c2e;border-color:#3a3a3c;}
        .sb-item-title{font-size:0.82rem;color:#aeaeb2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;}
        .sb-item.active .sb-item-title{color:#e5e5e5;}
        .sb-del{background:none;border:none;color:#636366;cursor:pointer;padding:2px 6px;border-radius:5px;font-size:12px;opacity:0;transition:all 0.15s;font-family:inherit;flex-shrink:0;}
        .sb-item:hover .sb-del{opacity:1;}
        .sb-del:hover{color:#ff453a;background:rgba(255,69,58,0.1);}
        .sb-empty{padding:20px 14px;text-align:center;}
        .sb-empty-icon{font-size:24px;margin-bottom:8px;}
        .sb-empty-text{font-size:0.78rem;color:#48484a;line-height:1.6;}
        .sb-bottom{flex-shrink:0;padding:8px 10px;border-top:1px solid #2c2c2e;position:relative;}
        .sb-profile{display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:10px;cursor:pointer;transition:all 0.15s;border:1px solid transparent;}
        .sb-profile:hover{background:#242426;border-color:#2c2c2e;}
        .profile-menu{position:absolute;bottom:60px;left:10px;right:10px;background:#242426;border:1px solid #3a3a3c;border-radius:14px;overflow:hidden;box-shadow:0 -8px 32px rgba(0,0,0,0.5);animation:fadeIn 0.15s ease;z-index:100;}
        .pm-user{padding:14px 14px 12px;border-bottom:1px solid #2c2c2e;}
        .pm-name{font-size:0.88rem;font-weight:600;color:#e5e5e5;}
        .pm-handle{font-size:0.72rem;color:#636366;margin-top:2px;}
        .pm-item{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background 0.1s;font-size:0.83rem;color:#aeaeb2;border:none;background:transparent;width:100%;text-align:left;font-family:inherit;}
        .pm-item:hover{background:#2c2c2e;color:#e5e5e5;}
        .pm-item.danger{color:#ff453a;}
        .pm-item.danger:hover{background:rgba(255,69,58,0.1);}
        .pm-sep{border:none;border-top:1px solid #2c2c2e;margin:0;}
        .main{flex:1;display:flex;flex-direction:column;min-width:0;overflow:hidden;}
        .nav{height:54px;flex-shrink:0;display:flex;align-items:center;justify-content:space-between;padding:0 16px;background:#242426;border-bottom:1px solid #3a3a3c;position:relative;z-index:50;}
        .nav-left{display:flex;align-items:center;gap:10px;}
        .nav-toggle{width:34px;height:34px;border-radius:9px;background:transparent;border:1px solid transparent;display:flex;align-items:center;justify-content:center;font-size:15px;color:#8e8e93;cursor:pointer;transition:all 0.15s;flex-shrink:0;}
        .nav-toggle:hover{background:#2c2c2e;border-color:#3a3a3c;color:#e5e5e5;}
        .nav-logo{display:flex;align-items:center;gap:7px;font-size:0.88rem;font-weight:600;color:#e5e5e5;text-decoration:none;letter-spacing:-0.02em;}
        .nav-logo-dot{width:6px;height:6px;border-radius:50%;background:#e5e5e5;animation:pulse 3s infinite;}
        .nav-center{position:absolute;left:50%;transform:translateX(-50%);display:flex;align-items:center;}
        .nav-pill{display:flex;align-items:center;gap:6px;padding:6px 14px;border-radius:99px;background:#2c2c2e;border:1px solid #3a3a3c;font-size:0.78rem;font-weight:500;color:#c7c7cc;cursor:pointer;transition:all 0.15s;font-family:inherit;}
        .nav-pill:hover{background:#38383a;color:#e5e5e5;}
        .nav-dot{width:6px;height:6px;border-radius:50%;background:#30d158;flex-shrink:0;}
        .nav-right{display:flex;align-items:center;gap:6px;}
        .nav-btn{display:flex;align-items:center;gap:4px;padding:6px 11px;border-radius:8px;background:#2c2c2e;border:1px solid #3a3a3c;font-size:0.74rem;font-weight:500;color:#8e8e93;cursor:pointer;transition:all 0.15s;font-family:inherit;}
        .nav-btn:hover{background:#38383a;color:#e5e5e5;}
        .nav-btn.on{background:#e5e5e5;color:#1c1c1e;border-color:#e5e5e5;}
        .picker-wrap{position:relative;}
        .picker{position:absolute;bottom:calc(100% + 8px);left:0;z-index:400;min-width:260px;background:#2c2c2e;border:1px solid #3a3a3c;border-radius:14px;overflow:hidden;box-shadow:0 -16px 48px rgba(0,0,0,0.7);animation:fadeIn 0.15s ease;}
        .picker-title{padding:10px 14px 8px;font-size:0.6rem;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:#636366;border-bottom:1px solid #3a3a3c;}
        .picker-opt{display:flex;align-items:center;gap:10px;padding:10px 14px;cursor:pointer;transition:background 0.1s;border:none;background:transparent;width:100%;text-align:left;font-family:inherit;}
        .picker-opt:hover{background:#38383a;}
        .picker-opt.on{background:#3a3a3c;}
        .picker-icon{width:32px;height:32px;border-radius:8px;background:#38383a;border:1px solid #48484a;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;}
        .picker-name{font-size:0.84rem;font-weight:600;color:#e5e5e5;}
        .picker-sub{font-size:0.65rem;color:#636366;font-family:'JetBrains Mono',monospace;}
        .picker-badge{margin-left:auto;padding:2px 8px;border-radius:99px;font-size:0.6rem;font-weight:700;background:rgba(48,209,88,0.15);color:#30d158;border:1px solid rgba(48,209,88,0.3);}
        .msgs{flex:1;overflow-y:auto;background:#1c1c1e;}
        .msgs-inner{max-width:760px;margin:0 auto;padding:32px 20px 24px;display:flex;flex-direction:column;gap:28px;}
        .empty{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;min-height:calc(100dvh - 200px);padding:40px 20px;animation:fadeUp 0.5s ease both;}
        .empty-icon{width:52px;height:52px;border-radius:14px;background:#2c2c2e;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;font-size:20px;margin-bottom:18px;}
        .empty-h{font-size:clamp(1.4rem,4vw,2rem);font-weight:700;letter-spacing:-0.03em;color:#e5e5e5;margin-bottom:8px;}
        .empty-sub{font-size:0.86rem;color:#636366;margin-bottom:28px;display:flex;align-items:center;gap:7px;}
        .sub-dot{width:6px;height:6px;border-radius:50%;background:#30d158;flex-shrink:0;animation:pulse 2s infinite;}
        .suggs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:580px;}
        .sug{display:flex;flex-direction:column;align-items:flex-start;gap:3px;padding:12px 13px;background:#242426;border:1px solid #3a3a3c;border-radius:11px;cursor:pointer;transition:all 0.18s;text-align:left;font-family:inherit;}
        .sug:hover{background:#2c2c2e;border-color:#48484a;transform:translateY(-2px);box-shadow:0 4px 16px rgba(0,0,0,0.3);}
        .sug-icon{font-size:15px;margin-bottom:2px;}
        .sug-cat{font-size:0.58rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#636366;}
        .sug-txt{font-size:0.78rem;font-weight:500;color:#aeaeb2;line-height:1.3;}
        .drop-hint{display:flex;align-items:center;gap:8px;padding:8px 14px;border-radius:10px;border:1px dashed #3a3a3c;background:#242426;margin-top:14px;font-size:0.73rem;color:#636366;}
        .drag-ov{position:fixed;inset:0;z-index:500;background:rgba(28,28,30,0.92);backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;pointer-events:none;}
        .drag-box{border:2px dashed #636366;border-radius:20px;padding:48px 64px;text-align:center;animation:dragP 1.5s infinite;background:#242426;}
        .msg-row{animation:msgIn 0.22s ease both;}
        .msg-u{align-self:flex-end;max-width:72%;padding:11px 15px;background:#3a3a3c;color:#e5e5e5;border-radius:18px 18px 4px 18px;font-size:0.92rem;line-height:1.65;}
        .msg-a-wrap{display:flex;flex-direction:column;gap:6px;}
        .msg-a-head{display:flex;align-items:center;gap:8px;}
        .msg-a-av{width:24px;height:24px;border-radius:7px;background:#2c2c2e;border:1px solid #3a3a3c;display:flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;}
        .msg-a-name{font-size:0.72rem;font-weight:600;color:#636366;}
        .md-body{font-size:0.94rem;line-height:1.88;color:#d1d1d6;}
        .md-body p{margin:0 0 14px;color:#c7c7cc;font-size:0.93rem;line-height:1.82;}
        .md-body p:last-child{margin-bottom:0;}
        .md-body h1,.md-body h2{font-size:1rem;font-weight:700;color:#e5e5e5;margin:20px 0 8px;}
        .md-body h3{font-size:0.92rem;font-weight:600;color:#d1d1d6;margin:16px 0 6px;}
        .md-body strong{color:#e5e5e5;font-weight:600;}
        .md-body ul,.md-body ol{padding-left:20px;margin:8px 0 14px;display:flex;flex-direction:column;gap:6px;}
        .md-body li{color:#c7c7cc;font-size:0.92rem;line-height:1.72;}
        .md-body code{background:#2c2c2e;border:1px solid #48484a;padding:2px 6px;border-radius:5px;font-size:0.8rem;font-family:'JetBrains Mono',monospace;color:#aeaeb2;}
        .md-body pre{background:#141414;border:1px solid #3a3a3c;border-radius:10px;padding:16px 18px;overflow-x:auto;margin:12px 0;}
        .md-body pre code{background:transparent;border:none;padding:0;color:#c7c7cc;font-size:0.8rem;}
        .md-body blockquote{border-left:3px solid #3a3a3c;padding:8px 14px;margin:10px 0;background:#242426;border-radius:0 8px 8px 0;color:#8e8e93;font-style:italic;}
        .md-body table{width:100%;border-collapse:collapse;margin:12px 0;font-size:0.84rem;}
        .md-body th{background:#2c2c2e;color:#e5e5e5;padding:8px 14px;text-align:left;border:1px solid #3a3a3c;font-weight:600;}
        .md-body td{padding:7px 14px;border:1px solid #3a3a3c;color:#aeaeb2;}
        .ctbl{width:100%;border-collapse:collapse;font-size:0.83rem;margin:12px 0;}
        .ctbl th{background:#2c2c2e;color:#e5e5e5;padding:8px 14px;text-align:left;border:1px solid #3a3a3c;font-weight:600;}
        .ctbl td{padding:7px 14px;border:1px solid #3a3a3c;color:#aeaeb2;}
        .fchip{display:inline-flex;align-items:center;gap:6px;padding:4px 10px;border-radius:8px;background:#2c2c2e;border:1px solid #3a3a3c;font-size:0.72rem;color:#aeaeb2;margin:3px 3px 3px 0;}
        .img-prev{max-width:240px;max-height:170px;border-radius:10px;border:1px solid #3a3a3c;margin-bottom:4px;object-fit:cover;display:block;}
        .acts{display:flex;gap:5px;margin-top:10px;flex-wrap:wrap;}
        .act{display:flex;align-items:center;gap:4px;padding:4px 9px;border-radius:7px;border:1px solid #3a3a3c;background:#242426;font-size:0.67rem;color:#636366;cursor:pointer;transition:all 0.15s;font-family:inherit;}
        .act:hover{background:#2c2c2e;color:#aeaeb2;}
        .typing-wrap{display:flex;flex-direction:column;gap:6px;animation:msgIn 0.2s ease both;}
        .typing-bub{display:flex;gap:5px;align-items:center;padding:12px 16px;background:#242426;border:1px solid #3a3a3c;border-radius:5px 16px 16px 16px;width:fit-content;}
        .typing-bub span{width:6px;height:6px;border-radius:50%;background:#636366;animation:bounce 1.2s ease-in-out infinite;}
        .typing-bub span:nth-child(2){animation-delay:0.15s;}.typing-bub span:nth-child(3){animation-delay:0.3s;}
        .input-zone{flex-shrink:0;padding:10px 16px 16px;background:#1c1c1e;border-top:1px solid #3a3a3c;}
        .pf-list{max-width:760px;margin:0 auto 8px;display:flex;gap:6px;flex-wrap:wrap;}
        .pf{display:flex;align-items:center;gap:6px;padding:5px 10px;border-radius:9px;background:#2c2c2e;border:1px solid #3a3a3c;font-size:0.72rem;color:#aeaeb2;}
        .pf-img{width:30px;height:30px;border-radius:6px;object-fit:cover;border:1px solid #3a3a3c;}
        .pf-rm{background:none;border:none;color:#636366;cursor:pointer;font-size:12px;padding:0 0 0 2px;font-family:inherit;}
        .pf-rm:hover{color:#ff453a;}
        .live{background:rgba(255,69,58,0.1);border:1px solid rgba(255,69,58,0.3);border-radius:8px;padding:6px 12px;margin-bottom:6px;color:#ff453a;font-size:0.75rem;font-style:italic;max-width:760px;margin-left:auto;margin-right:auto;}
        .input-box{max-width:760px;margin:0 auto;background:#2c2c2e;border:1px solid #3a3a3c;border-radius:16px;box-shadow:0 2px 12px rgba(0,0,0,0.25);overflow:visible;transition:border-color 0.2s;}
        .input-box:focus-within{border-color:#636366;}
        .input-ta{display:block;width:100%;min-height:52px;max-height:160px;padding:14px 18px 8px;background:transparent;border:none;outline:none;color:#e5e5e5;font-size:0.93rem;line-height:1.6;resize:none;font-family:'Inter',sans-serif;border-radius:16px 16px 0 0;}
        .input-ta::placeholder{color:#48484a;}
        .input-foot{display:flex;align-items:center;justify-content:space-between;padding:7px 12px 10px;}
        .inp-model{display:flex;align-items:center;gap:6px;padding:6px 12px;border-radius:99px;background:#38383a;border:1px solid #48484a;font-size:0.78rem;font-weight:600;color:#e5e5e5;cursor:pointer;transition:all 0.15s;font-family:inherit;white-space:nowrap;}
        .inp-model:hover{background:#48484a;border-color:#636366;}
        .inp-dot{width:7px;height:7px;border-radius:50%;background:#30d158;flex-shrink:0;}
        .inp-right{display:flex;align-items:center;gap:5px;}
        .abt{width:32px;height:32px;border-radius:9px;background:#38383a;border:1px solid #48484a;display:flex;align-items:center;justify-content:center;font-size:14px;color:#8e8e93;transition:all 0.15s;cursor:pointer;}
        .abt:hover{background:#48484a;color:#e5e5e5;}
        .abt.on{background:rgba(255,69,58,0.15);border-color:rgba(255,69,58,0.4);color:#ff453a;}
        .send{width:36px;height:36px;border-radius:10px;background:#e5e5e5;color:#1c1c1e;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex-shrink:0;cursor:pointer;transition:all 0.18s;border:none;}
        .send:hover{background:#fff;transform:scale(1.05);}
        .send:disabled{opacity:0.25;cursor:not-allowed;transform:none;}
        .send-spin{width:14px;height:14px;border-radius:50%;border:2px solid rgba(28,28,30,0.3);border-top-color:#1c1c1e;animation:spin 0.7s linear infinite;}
        .hint{text-align:center;margin-top:7px;font-size:0.6rem;color:#48484a;letter-spacing:0.04em;}
        .kittu{position:fixed;inset:0;background:#1c1c1e;z-index:300;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding:48px 20px 52px;animation:fadeIn 0.25s ease;}
        .k-name{font-size:1.4rem;font-weight:700;color:#e5e5e5;letter-spacing:-0.03em;}
        .k-sub{font-size:0.75rem;color:#636366;margin-top:2px;}
        .k-status{font-size:0.86rem;color:#8e8e93;line-height:1.7;text-align:center;max-width:280px;}
        .k-transcript{font-size:0.95rem;color:#c7c7cc;line-height:1.6;margin-bottom:8px;font-style:italic;}
        .k-ctrl{width:50px;height:50px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid #3a3a3c;background:#2c2c2e;color:#8e8e93;transition:all 0.2s;font-family:inherit;}
        .k-ctrl:hover{background:#38383a;color:#e5e5e5;}
        .k-mic{width:64px;height:64px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:26px;border:2px solid #3a3a3c;background:#2c2c2e;transition:all 0.25s;font-family:inherit;}
        .k-mic.active{border-color:#e5e5e5;box-shadow:0 0 24px rgba(229,229,229,0.1);background:#38383a;}
        @media(max-width:640px){.suggs{grid-template-columns:repeat(2,1fr);}}
        @media(max-width:400px){.suggs{grid-template-columns:1fr;}}
      `}}/>

      <input ref={fileRef} type="file" multiple accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.jpg,.jpeg,.png,.gif,.webp,.txt" style={{display:"none"}} onChange={onFI}/>
      {sidebarOpen&&<div className="sidebar-overlay" onClick={()=>setSidebarOpen(false)}/>}
      {dragging&&(<div className="drag-ov"><div className="drag-box"><div style={{fontSize:"3rem",marginBottom:12}}>📂</div><div style={{fontSize:"1.1rem",fontWeight:700,color:"#e5e5e5"}}>Drop files here</div><div style={{fontSize:"0.82rem",color:"#636366",marginTop:6}}>PDF, Excel, Word, Images supported</div></div></div>)}

      {kittuMode&&(
        <div className="kittu">
          <div style={{textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"#2c2c2e",border:"1px solid #3a3a3c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>🌸</div>
            <div className="k-name">Kittu</div>
            <div className="k-sub">Powered by {cur.p}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
            <div style={{width:180,height:180,borderRadius:"50%",border:"2px solid #3a3a3c",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"4rem",cursor:"pointer",background:"#242426"}} onClick={togKittu}>{vs==="listening"?"🎙":vs==="thinking"?"⏳":vs==="speaking"?"🔊":"🌸"}</div>
            <div style={{textAlign:"center",minHeight:52}}>{vTranscript&&vs==="listening"&&<div className="k-transcript">"{vTranscript}"</div>}<div className="k-status">{vsLabel[vs]}</div></div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:24}}>
            <button className="k-ctrl" onClick={()=>{setVHistory([]);setVAiText("");stopAll();setVs("idle");}}>↺</button>
            <button className={`k-mic ${vActiveRef.current?"active":""}`} onClick={togKittu}>{vs==="idle"?"🎙":vs==="listening"?"🎙":vs==="thinking"?"⏳":"🔊"}</button>
            <button className="k-ctrl" onClick={closeKittu}>✕</button>
          </div>
        </div>
      )}

      <aside id="sidebar" className={`sidebar ${sidebarOpen?"open-mobile":""}`}>
        <div className="sidebar-inner">
          <div className="sb-top">
            <div className="sb-logo"><div className="sb-logo-av">✦</div><div><div className="sb-logo-name">Universal AI</div><div className="sb-logo-plan">Free plan</div></div></div>
            <button className="sb-new" onClick={startNewChat}><div className="sb-new-icon">✏️</div>New chat</button>
            <div className="sb-search"><span className="sb-search-icon">🔍</span><input placeholder="Search chats..." value={searchQ} onChange={e=>setSearchQ(e.target.value)}/></div>
          </div>
          <div className="sb-list">
            {sessions.length===0?(<div className="sb-empty"><div className="sb-empty-icon">💬</div><div className="sb-empty-text">Abhi koi chat nahi hai.<br/>Kuch pucho, history yahan save hogi!</div></div>)
            :filtered.length===0?(<div className="sb-empty"><div className="sb-empty-text">"{searchQ}" nahi mila.</div></div>)
            :(<>
              {grouped.today.length>0&&<><div className="sb-group-label">Today</div>{grouped.today.map(s=>(<div key={s.id} className={`sb-item ${activeId===s.id?"active":""}`} onClick={()=>loadSession(s)}><span className="sb-item-title">{s.title}</span><button className="sb-del" onClick={e=>deleteSession(s.id,e)}>🗑</button></div>))}</>}
              {grouped.yesterday.length>0&&<><div className="sb-group-label">Yesterday</div>{grouped.yesterday.map(s=>(<div key={s.id} className={`sb-item ${activeId===s.id?"active":""}`} onClick={()=>loadSession(s)}><span className="sb-item-title">{s.title}</span><button className="sb-del" onClick={e=>deleteSession(s.id,e)}>🗑</button></div>))}</>}
              {grouped.week.length>0&&<><div className="sb-group-label">Last 7 days</div>{grouped.week.map(s=>(<div key={s.id} className={`sb-item ${activeId===s.id?"active":""}`} onClick={()=>loadSession(s)}><span className="sb-item-title">{s.title}</span><button className="sb-del" onClick={e=>deleteSession(s.id,e)}>🗑</button></div>))}</>}
              {grouped.older.length>0&&<><div className="sb-group-label">Older</div>{grouped.older.map(s=>(<div key={s.id} className={`sb-item ${activeId===s.id?"active":""}`} onClick={()=>loadSession(s)}><span className="sb-item-title">{s.title}</span><button className="sb-del" onClick={e=>deleteSession(s.id,e)}>🗑</button></div>))}</>}
            </>)}
          </div>
          <div className="sb-bottom" ref={profileRef}>
            {showProfile&&(<div className="profile-menu"><div className="pm-user"><div style={{width:34,height:34,borderRadius:"50%",background:"linear-gradient(135deg,#ff9500,#ff453a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",marginBottom:8}}>{userInitial}</div><div className="pm-name">{userName}</div><div className="pm-handle">{userEmail}</div></div><hr className="pm-sep"/><button className="pm-item danger" onClick={handleLogout}>→ Log out</button></div>)}
            <div className="sb-profile" onClick={()=>setShowProfile(!showProfile)}>
              <div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#ff9500,#ff453a)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:700,color:"#fff",flexShrink:0}}>{userInitial}</div>
              <div style={{flex:1,minWidth:0}}><div style={{fontSize:"0.82rem",fontWeight:500,color:"#e5e5e5",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{userName}</div><div style={{fontSize:"0.68rem",color:"#636366"}}>Free</div></div>
              <span style={{marginLeft:"auto",color:"#636366",fontSize:12}}>{showProfile?"▼":"▲"}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="main">
        <header className="nav">
          <div className="nav-left">
            <button id="sidebar-toggle" className="nav-toggle" onClick={()=>setSidebarOpen(!sidebarOpen)}>{sidebarOpen?"✕":"☰"}</button>
            <a href="/" className="nav-logo"><div className="nav-logo-dot"/>Universal AI</a>
          </div>
          <div className="nav-center">
            <button className="nav-pill" onClick={()=>setShowPick(v=>!v)}>
              <div className="nav-dot"/>{cur.i} {cur.p} · {cur.l}
              <span style={{fontSize:"0.6rem",color:"#636366"}}>▾</span>
            </button>
          </div>
          <div className="nav-right">
            <button className={`nav-btn ${voiceOn?"on":""}`} onClick={()=>{setVoiceOn(!voiceOn);stopSpk();}}>{voiceOn?"🔊":"🔇"} <span>Voice</span></button>
            <button className="nav-btn" onClick={()=>fileRef.current?.click()}>📎 <span>Attach</span></button>
          </div>
        </header>

        <div className="msgs">
          {msgs.length===0?(
            <div className="empty">
              <div className="empty-icon">✦</div>
              <h1 className="empty-h">Kya dhundh rahe ho aaj?</h1>
              <p className="empty-sub"><span className="sub-dot"/>{cur.i} {cur.p} ready hai</p>
              <div className="suggs">{SUGG.map((s,i)=>(<button key={i} className="sug" onClick={()=>send(s.text)}><span className="sug-icon">{s.icon}</span><span className="sug-cat">{s.cat}</span><span className="sug-txt">{s.text}</span></button>))}</div>
              <div className="drop-hint">📂 File ya image drop karo · "canvas" bol ke diagram banao</div>
            </div>
          ):(
            <div className="msgs-inner">
              {msgs.map((m,i)=>{
                const mm=MODELS.find(x=>x.v===m.model)??cur;
                const csv=m.role==="assistant"?extractCSV(m.content):null;
                const clean=m.content.replace(/```csv[\s\S]*?```/g,"").replace(/```canvas[\s\S]*?```/g,"").trim();
                return(<div key={i} className="msg-row">
                  {m.role==="user"?(
                    <div style={{display:"flex",justifyContent:"flex-end"}}>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6,maxWidth:"72%"}}>
                        {m.files&&m.files.length>0&&(<div>{m.files.map((f,fi)=>f.type.startsWith("image/")?<img key={fi} src={f.dataUrl} alt={f.name} className="img-prev"/>:<div key={fi} className="fchip">{fIcon(f.type)} {f.name} <span style={{color:"#636366"}}>({fmtB(f.size)})</span></div>)}</div>)}
                        {clean&&<div className="msg-u">{clean}</div>}
                      </div>
                    </div>
                  ):(
                    <div className="msg-a-wrap">
                      <div className="msg-a-head"><div className="msg-a-av">{mm.i}</div><span className="msg-a-name">{mm.p}</span></div>
                      <div className="md-body"><ReactMarkdown remarkPlugins={[remarkGfm]}>{clean}</ReactMarkdown>{csv&&<div style={{marginTop:10}} dangerouslySetInnerHTML={{__html:csvHtml(csv)}}/>}{m.shapes&&!closedC.has(i)&&(<MiniCanvas shapes={m.shapes} onClose={()=>setClosedC(p=>new Set(Array.from(p).concat(i)))}/>)}</div>
                      <div className="acts">
                        <button className="act" onClick={()=>speaking?stopSpk():spk(m.content)}>{speaking?"⏹ Stop":"🔊 Read"}</button>
                        {csv&&<button className="act" onClick={()=>dlCSV(csv)}>📥 Excel</button>}
                        <button className="act" onClick={()=>navigator.clipboard.writeText(m.content)}>📋 Copy</button>
                      </div>
                    </div>
                  )}
                </div>);
              })}
              {loading&&(<div className="typing-wrap"><div className="msg-a-head"><div className="msg-a-av">{cur.i}</div><span className="msg-a-name">{cur.p}</span></div><div className="typing-bub"><span/><span/><span/></div></div>)}
              <div ref={botRef}/>
            </div>
          )}
        </div>

        <div className="input-zone">
          {files.length>0&&(<div className="pf-list">{files.map((f,i)=>(<div key={i} className="pf">{f.type.startsWith("image/")?<img src={f.dataUrl} alt={f.name} className="pf-img"/>:<span style={{fontSize:16}}>{fIcon(f.type)}</span>}<span style={{fontWeight:500}}>{f.name}</span><span style={{color:"#636366",fontSize:"0.65rem"}}>({fmtB(f.size)})</span><button className="pf-rm" onClick={()=>rmFile(i)}>✕</button></div>))}</div>)}
          {liveText&&<div className="live">🎙 {liveText}</div>}
          <div className="input-box">
            <textarea ref={taRef} className="input-ta"
              placeholder={files.length>0?"File ke baare mein pucho...":"Message Universal AI..."}
              value={input} rows={1}
              onChange={e=>{setInput(e.target.value);inpRef.current=e.target.value;rTA();}}
              onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();send();}}}
            />
            <div className="input-foot">
              <div className="picker-wrap" ref={pickRef}>
                <button className="inp-model" onClick={()=>setShowPick(v=>!v)}>
                  <div className="inp-dot"/>{cur.i}&nbsp;{cur.p}
                  <span style={{fontSize:"0.65rem",color:"#8e8e93",marginLeft:2}}>▾</span>
                </button>
                {showPick&&(
                  <div className="picker">
                    <div className="picker-title">Choose model</div>
                    {MODELS.map(m=>(
                      <button key={m.v} className={`picker-opt ${model===m.v?"on":""}`} onClick={()=>{setModel(m.v);setShowPick(false);}}>
                        <div className="picker-icon">{m.i}</div>
                        <div><div className="picker-name">{m.p}</div><div className="picker-sub">{m.l}</div></div>
                        <div className="picker-badge">{m.tag}</div>
                        {model===m.v&&<span style={{color:"#30d158",fontSize:14,marginLeft:4}}>✓</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="inp-right">
                <button className="abt" onClick={()=>fileRef.current?.click()} title="Attach">📎</button>
                <button className="abt" onClick={openKittu} title="Kittu">🌸</button>
                <button className={`abt ${listening?"on":""}`} onClick={startMic} title="Voice">{listening?"⏹":"🎙"}</button>
                <button className="send" onClick={()=>send()} disabled={(!input.trim()&&files.length===0)||loading}>
                  {loading?<div className="send-spin"/>:"↑"}
                </button>
              </div>
            </div>
          </div>
          <p className="hint">Enter to send · Shift+Enter for new line</p>
        </div>
      </div>
    </div>
  );
}