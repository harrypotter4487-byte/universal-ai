"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage(){

const router = useRouter();

const [mode,setMode]=useState("signup")
const [first,setFirst]=useState("")
const [last,setLast]=useState("")
const [email,setEmail]=useState("")
const [password,setPassword]=useState("")
const [error,setError]=useState("")
const [msg,setMsg]=useState("")

/* CREATE ACCOUNT */
const signup=()=>{
  setError("")
  setMsg("")
  if(!email || !password){
    setError("Please fill all required fields")
    return
  }
  if(password.length < 6){
    setError("Password must be at least 6 characters")
    return
  }
  // Save user to localStorage
  localStorage.setItem("uai_user", JSON.stringify({email, password, first, last}))
  setMsg("Account created! Please login now.")
  setMode("login")
  setPassword("")
}

/* LOGIN */
const login=()=>{
  setError("")
  setMsg("")

  const stored = localStorage.getItem("uai_user")

  if(!stored){
    setError("No account found. Please create one first.")
    return
  }

  const user = JSON.parse(stored)

  if(user.email === email && user.password === password){
    localStorage.setItem("uai_session", JSON.stringify({email, loggedIn: true}))
    router.push("/chat")  // ✅ yahi fix hai
  } else {
    setError("Invalid email or password")
  }
}

return(
<div className="wrapper">
  <div className="card">

    {/* LEFT SIDE */}
    <div className="left">
      <div className="brand">Universal AI</div>
      <h1>Get Started with Us</h1>
      <p>Complete these easy steps to register your account.</p>
      <div className="steps">
        <div className={`step ${mode==="signup"?"active":""}`}>1 Sign up your account</div>
        <div className={`step ${mode==="login"?"active":""}`}>2 Login to your account</div>
        <div className="step">3 Start chatting with AI</div>
      </div>
    </div>

    {/* RIGHT SIDE */}
    <div className="right">
      <h2>{mode==="signup"?"Sign Up Account":"Sign In Account"}</h2>
      <p className="sub">
        {mode==="signup"
          ?"Enter your personal data to create your account."
          :"Enter your credentials to login."}
      </p>

      <div className="divider">Fill in your details</div>

      {mode==="signup" && (
        <div className="nameRow">
          <input placeholder="First Name" value={first} onChange={(e)=>setFirst(e.target.value)}/>
          <input placeholder="Last Name" value={last} onChange={(e)=>setLast(e.target.value)}/>
        </div>
      )}

      <input
        placeholder="Email"
        type="email"
        value={email}
        onChange={(e)=>setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e)=>setPassword(e.target.value)}
        onKeyDown={(e)=>e.key==="Enter"&&(mode==="signup"?signup():login())}
      />

      <button className="mainBtn" onClick={mode==="signup"?signup:login}>
        {mode==="signup"?"Sign Up →":"Login →"}
      </button>

      <div className="switch">
        {mode==="signup"?(
          <>Already have an account? <span onClick={()=>{setMode("login");setError("");setMsg("");}}>Log in</span></>
        ):(
          <>Don't have an account? <span onClick={()=>{setMode("signup");setError("");setMsg("");}}>Sign up</span></>
        )}
      </div>

      {error && <div className="error">⚠️ {error}</div>}
      {msg   && <div className="success">✅ {msg}</div>}
    </div>

  </div>

  <style jsx>{`
    .wrapper{
      min-height:100vh;
      background:#000;
      display:flex;
      align-items:center;
      justify-content:center;
      padding:40px;
    }
    .card{
      width:1200px;
      max-width:100%;
      height:auto;
      min-height:600px;
      display:flex;
      border-radius:20px;
      overflow:hidden;
      border:1px solid #1f1f1f;
    }
    .left{
      width:50%;
      padding:80px;
      display:flex;
      flex-direction:column;
      justify-content:center;
      color:white;
      background:linear-gradient(180deg,#b983ff 0%,#7c3aed 40%,#000 100%);
    }
    .brand{ margin-bottom:40px; font-size:14px; opacity:.9; font-weight:600; letter-spacing:0.05em; }
    .left h1{ font-size:36px; margin-bottom:10px; }
    .left p{ color:#d4d4d4; margin-bottom:40px; }
    .steps{ display:flex; flex-direction:column; gap:16px; }
    .step{
      padding:14px 18px;
      border-radius:12px;
      background:rgba(255,255,255,.15);
      opacity:.6;
      font-size:14px;
      transition: all 0.2s;
    }
    .step.active{
      background:white;
      color:black;
      opacity:1;
      font-weight:600;
    }
    .right{
      width:50%;
      padding:80px;
      background:#050505;
      color:white;
      display:flex;
      flex-direction:column;
    }
    .right h2{ font-size:24px; margin-bottom:6px; }
    .sub{ color:#9ca3af; margin-bottom:24px; font-size:14px; }
    .divider{ text-align:center; margin:0 0 18px; color:#666; font-size:13px; }
    input{
      height:46px;
      border-radius:10px;
      border:1px solid #2a2a2a;
      background:#0f0f0f;
      color:white;
      padding:0 14px;
      margin-bottom:14px;
      width:100%;
      font-size:14px;
      outline:none;
      transition: border-color 0.2s;
    }
    input:focus{ border-color:#7c3aed; }
    input::placeholder{ color:#555; }
    .nameRow{ display:flex; gap:10px; }
    .nameRow input{ width:50%; }
    .mainBtn{
      height:48px;
      border:none;
      border-radius:10px;
      background:linear-gradient(135deg,#7c3aed,#b983ff);
      color:white;
      font-weight:600;
      cursor:pointer;
      margin-top:6px;
      font-size:15px;
      transition: all 0.2s;
      letter-spacing:0.02em;
    }
    .mainBtn:hover{ opacity:0.9; transform:translateY(-1px); }
    .switch{ margin-top:14px; font-size:14px; color:#aaa; }
    .switch span{ color:#b983ff; cursor:pointer; font-weight:500; }
    .switch span:hover{ text-decoration:underline; }
    .error{ margin-top:12px; color:#ff6b6b; font-size:13px; padding:10px 14px; background:rgba(255,107,107,0.1); border-radius:8px; border:1px solid rgba(255,107,107,0.2); }
    .success{ margin-top:12px; color:#4ade80; font-size:13px; padding:10px 14px; background:rgba(74,222,128,0.1); border-radius:8px; border:1px solid rgba(74,222,128,0.2); }
    @media(max-width:900px){
      .card{ flex-direction:column; }
      .left,.right{ width:100%; padding:40px; }
    }
  `}</style>
</div>
)
}