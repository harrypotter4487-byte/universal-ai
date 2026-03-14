"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {

const [tab, setTab] = useState<"login" | "signup">("login");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [showPass, setShowPass] = useState(false);

const handleSubmit = async () => {

if (!email || !password) return;

setLoading(true);

if (tab === "login") {

const { error } = await supabase.auth.signInWithPassword({
email,
password,
});

if (error) {
alert(error.message);
setLoading(false);
return;
}

} else {

const { error } = await supabase.auth.signUp({
email,
password,
options:{
data:{ name }
}
});

if (error) {
alert(error.message);
setLoading(false);
return;
}

}

setLoading(false);
window.location.href="/chat";

};

const handleGoogle = async () => {

const { error } = await supabase.auth.signInWithOAuth({
provider:"google",
options:{
redirectTo:`${window.location.origin}/chat`
}
});

if(error){
alert(error.message);
}

};

return (

<div className="auth-wrapper">

<div style={{width:"100%",maxWidth:420}}>

{/* HEADER */}

<div className="fade-up" style={{textAlign:"center",marginBottom:30}}>

<h1 style={{
fontSize:24,
fontWeight:700
}}>

{tab==="login" ? "Welcome back" : "Create account"}

</h1>

</div>


{/* CARD */}

<div className="auth-card fade-up-2">


{/* TABS */}

<div className="tabs">

<button
className={`tab-btn ${tab==="login" ? "active":""}`}
onClick={()=>setTab("login")}
>

Sign In

</button>

<button
className={`tab-btn ${tab==="signup" ? "active":""}`}
onClick={()=>setTab("signup")}
>

Sign Up

</button>

</div>



{/* GOOGLE LOGIN */}

<div style={{display:"flex",gap:8,marginBottom:20}}>

<button className="social-btn" onClick={handleGoogle}>
Continue with Google
</button>

</div>



{/* DIVIDER */}

<div className="divider" style={{marginBottom:20}}>

<div className="divider-line"/>

<span style={{fontSize:12,color:"#666"}}>
or continue with email
</span>

<div className="divider-line"/>

</div>



{/* FORM */}

<div style={{display:"flex",flexDirection:"column",gap:12}}>


{tab==="signup" && (

<div className="input-wrap">

<input
className="field"
type="text"
placeholder="Full Name"
value={name}
onChange={(e)=>setName(e.target.value)}
/>

</div>

)}



<div className="input-wrap">

<input
className="field"
type="email"
placeholder="Email"
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

</div>



<div className="input-wrap">

<input
className="field"
type={showPass ? "text":"password"}
placeholder="Password"
value={password}
onChange={(e)=>setPassword(e.target.value)}
/>

<button
onClick={()=>setShowPass(!showPass)}
style={{
padding:"0 14px",
background:"transparent",
border:"none",
color:"#777",
cursor:"pointer"
}}
>

{showPass ? "Hide":"Show"}

</button>

</div>



<button
className="submit-btn"
onClick={handleSubmit}
disabled={loading || !email || !password}
>

{loading
? "Loading..."
: tab==="login"
? "Sign In →"
: "Create Account →"}

</button>


</div>

</div>

</div>

</div>

);

}
