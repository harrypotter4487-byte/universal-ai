'use client';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let mouse = { x: -9999, y: -9999 };
    let animId: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener('resize', resize);
    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener('mousemove', onMove);
    const particles = Array.from({ length: 80 }, () => {
      const x = Math.random() * window.innerWidth;
      const y = Math.random() * window.innerHeight;
      return { x, y, ox: x, oy: y, vx: 0, vy: 0, size: Math.random() * 1.5 + 0.5, alpha: Math.random() * 0.25 + 0.05 };
    });
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) { const a = Math.atan2(dy, dx), f = (120 - dist) / 120 * 5; p.vx += Math.cos(a) * f; p.vy += Math.sin(a) * f; }
        p.vx += (p.ox - p.x) * 0.03; p.vy += (p.oy - p.y) * 0.03;
        p.vx *= 0.85; p.vy *= 0.85; p.x += p.vx; p.y += p.vy;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${p.alpha})`; ctx.fill();
      });
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); window.removeEventListener('mousemove', onMove); };
  }, []);

  const features = [
    {
      num: '1.0', title: 'Smart Conversations',
      desc: 'Chat with Groq Llama 3.3, Gemini Flash, and DeepSeek. Switch models anytime — each with unique strengths.',
      link: '/chat', linkLabel: 'Start chatting →',
      mockup: (
        <div style={{ background:'#0a0a0a', borderRadius:12, border:'1px solid #1e1e1e', overflow:'hidden' }}>
          <div style={{ background:'#111', padding:'10px 16px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff5f57' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#febc2e' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#28c840' }}/>
            <span style={{ marginLeft:8, fontSize:11, color:'#333', fontFamily:'monospace' }}>Chat — Groq Llama 3.3</span>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { role:'user', msg:'Explain black holes simply' },
              { role:'ai', msg:'A black hole is where gravity is so strong nothing escapes — not even light! They form when massive stars collapse. 🌌' },
              { role:'user', msg:'How big can they get?' },
              { role:'ai', msg:'Supermassive ones can be billions of times our Sun\'s mass! M87\'s black hole is 6.5 billion solar masses. 🔭' },
            ].map((m, i) => (
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', gap:8 }}>
                {m.role==='ai' && <div style={{ width:20, height:20, borderRadius:6, background:'#1a1a1a', border:'1px solid #2a2a2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, flexShrink:0, color:'#f97316' }}>✦</div>}
                <div style={{ background:m.role==='user'?'white':'#141414', color:m.role==='user'?'#000':'#888', padding:'7px 11px', borderRadius:m.role==='user'?'10px 10px 2px 10px':'2px 10px 10px 10px', fontSize:12, maxWidth:'78%', lineHeight:1.5, border:m.role==='ai'?'1px solid #1e1e1e':'none' }}>{m.msg}</div>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      num: '2.0', title: 'Image Generation',
      desc: 'Turn any text description into stunning visuals using SDXL. Photorealistic, artistic, abstract — any style.',
      link: '/images', linkLabel: 'Generate images →',
      mockup: (
        <div style={{ background:'#0a0a0a', borderRadius:12, border:'1px solid #1e1e1e', overflow:'hidden' }}>
          <div style={{ background:'#111', padding:'10px 16px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff5f57' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#febc2e' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#28c840' }}/>
            <span style={{ marginLeft:8, fontSize:11, color:'#333', fontFamily:'monospace' }}>Image Generator — SDXL</span>
          </div>
          <div style={{ padding:16 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:12 }}>
              {['🌄','🤖','🌊','🏙️'].map((e, i) => (
                <div key={i} style={{ aspectRatio:'1', background:'#141414', border:'1px solid #1e1e1e', borderRadius:8, display:'flex', alignItems:'center', justifyContent:'center', fontSize:28 }}>{e}</div>
              ))}
            </div>
            <div style={{ background:'#141414', border:'1px solid #1e1e1e', borderRadius:8, padding:'8px 12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, color:'#333' }}>A serene mountain at sunset...</span>
              <div style={{ background:'white', color:'#000', fontSize:11, padding:'4px 10px', borderRadius:6, fontWeight:600 }}>✦ Generate</div>
            </div>
          </div>
        </div>
      )
    },
    {
      num: '3.0', title: 'Multi-Model AI',
      desc: 'Access Groq Llama 3.3, Gemini 1.5 Flash, and DeepSeek — all in one place. Switch instantly.',
      link: '/chat', linkLabel: 'Try all models →',
      mockup: (
        <div style={{ background:'#0a0a0a', borderRadius:12, border:'1px solid #1e1e1e', overflow:'hidden' }}>
          <div style={{ background:'#111', padding:'10px 16px', borderBottom:'1px solid #1a1a1a', display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#ff5f57' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#febc2e' }}/>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#28c840' }}/>
            <span style={{ marginLeft:8, fontSize:11, color:'#333', fontFamily:'monospace' }}>Model Selection</span>
          </div>
          <div style={{ padding:16, display:'flex', flexDirection:'column', gap:8 }}>
            {[
              { name:'Groq Llama 3.3', by:'Meta × Groq', tag:'FREE · Fastest', color:'#f97316', active:true },
              { name:'Gemini 1.5 Flash', by:'Google', tag:'FREE · Smart', color:'#4285f4', active:false },
              { name:'DeepSeek Chat', by:'DeepSeek', tag:'Cheap · Capable', color:'#7c6fff', active:false },
            ].map((m, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:m.active?'#141414':'transparent', borderRadius:8, border:m.active?'1px solid #2a2a2a':'1px solid transparent' }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${m.color}20`, border:`1px solid ${m.color}30`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:m.color, fontWeight:700 }}>{m.name[0]}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, color:m.active?'#fff':'#555', fontWeight:500 }}>{m.name}</div>
                  <div style={{ fontSize:11, color:'#333' }}>{m.by}</div>
                </div>
                <div style={{ fontSize:10, color:m.color, background:`${m.color}10`, padding:'2px 8px', borderRadius:100, border:`1px solid ${m.color}20` }}>{m.tag}</div>
                {m.active && <div style={{ width:6, height:6, borderRadius:'50%', background:m.color }}/>}
              </div>
            ))}
          </div>
        </div>
      )
    },
  ];

  return (
    <div style={{ background:'#080808', minHeight:'100vh', fontFamily:"'Inter', sans-serif", color:'#e2e2e2' }}>
      <canvas ref={canvasRef} style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none' }}/>

      {/* Grid */}
      <div style={{ position:'fixed', inset:0, zIndex:0, pointerEvents:'none', backgroundImage:'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)', backgroundSize:'60px 60px' }}/>

      {/* NAV */}
      <nav style={{ position:'fixed', top:0, left:0, right:0, zIndex:100, height:52, background:'rgba(8,8,8,0.92)', borderBottom:'1px solid rgba(255,255,255,0.06)', backdropFilter:'blur(16px)', display:'flex', alignItems:'center' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'0 32px', width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <Link href="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none' }}>
            <div style={{ width:24, height:24, background:'white', borderRadius:7, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#080808" strokeWidth="2.5" strokeLinecap="round">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
              </svg>
            </div>
            <span style={{ fontSize:14, fontWeight:600, color:'white', letterSpacing:'-0.02em' }}>Universal AI</span>
          </Link>
          <div style={{ display:'flex', gap:24 }}>
            {[['/', 'Home'],['/chat','Chat'],['/images','Images'],['/settings','Settings']].map(([h, l]) => (
              <Link key={h} href={h} style={{ fontSize:13, color:'#555', textDecoration:'none' }}>{l}</Link>
            ))}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <Link href="/login" style={{ fontSize:13, color:'#555', textDecoration:'none' }}>Log in</Link>
            <Link href="/login" style={{ fontSize:13, fontWeight:600, padding:'7px 18px', borderRadius:8, background:'white', color:'#080808', textDecoration:'none' }}>Get started →</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ position:'relative', zIndex:10, maxWidth:1200, margin:'0 auto', padding:'140px 32px 80px' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:100, padding:'5px 14px 5px 8px', fontSize:12, color:'#555', marginBottom:36 }}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px rgba(74,222,128,0.7)' }}/>
          Groq · Gemini · DeepSeek — All in one place
        </div>

        <h1 style={{ fontSize:'clamp(3rem,5.5vw,5.2rem)', fontWeight:700, lineHeight:1.06, letterSpacing:'-0.04em', color:'white', maxWidth:900, marginBottom:24 }}>
          The AI assistant<br/>built for everyone.<br/>
          <span style={{ color:'#222' }}>Designed for the AI era.</span>
        </h1>

        <p style={{ fontSize:17, color:'#555', lineHeight:1.7, maxWidth:500, marginBottom:48 }}>
          Chat with the world's best AI models. Generate stunning images. Get intelligent answers instantly.
        </p>

        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:80 }}>
          <Link href="/chat" style={{ padding:'11px 28px', borderRadius:9, background:'white', color:'#080808', fontSize:14, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>💬 Start Chatting</Link>
          <Link href="/images" style={{ padding:'11px 28px', borderRadius:9, background:'transparent', border:'1px solid rgba(255,255,255,0.1)', color:'#888', fontSize:14, fontWeight:500, textDecoration:'none', display:'flex', alignItems:'center', gap:8 }}>🎨 Generate Images</Link>
        </div>

        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', marginBottom:80 }}/>
        <div style={{ fontSize:11, fontWeight:600, color:'#333', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:60 }}>What you can do</div>

        {features.map((f, i) => (
          <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:80, alignItems:'center', padding:'60px 0', borderTop:'1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ order:i%2===0?0:1 }}>
              <div style={{ fontSize:12, color:'#333', fontWeight:500, letterSpacing:'0.05em', marginBottom:20, fontFamily:'monospace' }}>{f.num}</div>
              <h2 style={{ fontSize:'clamp(1.8rem,3vw,2.8rem)', fontWeight:700, color:'white', letterSpacing:'-0.03em', lineHeight:1.15, marginBottom:20 }}>{f.title}</h2>
              <p style={{ fontSize:15, color:'#555', lineHeight:1.7, marginBottom:28, maxWidth:400 }}>{f.desc}</p>
              <Link href={f.link} style={{ fontSize:13, color:'#888', textDecoration:'none', display:'flex', alignItems:'center', gap:6, fontWeight:500 }}>{f.linkLabel}</Link>
            </div>
            <div style={{ order:i%2===0?1:0, boxShadow:'0 32px 64px rgba(0,0,0,0.5)', borderRadius:12 }}>{f.mockup}</div>
          </div>
        ))}

        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:16, overflow:'hidden', marginTop:40 }}>
          {[{ num:'3+', label:'AI Models' },{ num:'Free', label:'Groq & Gemini' },{ num:'∞', label:'Conversations' }].map(s => (
            <div key={s.label} style={{ background:'#080808', padding:'40px 32px' }}>
              <div style={{ fontSize:'3rem', fontWeight:800, color:'white', letterSpacing:'-0.04em', marginBottom:8 }}>{s.num}</div>
              <div style={{ fontSize:14, color:'#444' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div style={{ textAlign:'center', padding:'100px 0 60px' }}>
          <h2 style={{ fontSize:'clamp(2.5rem,5vw,4rem)', fontWeight:700, color:'white', letterSpacing:'-0.04em', marginBottom:16 }}>Start building today.</h2>
          <p style={{ fontSize:16, color:'#555', marginBottom:40 }}>Free to use. No credit card required.</p>
          <Link href="/login" style={{ padding:'13px 32px', borderRadius:9, background:'white', color:'#080808', fontSize:14, fontWeight:600, textDecoration:'none', display:'inline-flex', alignItems:'center', gap:8 }}>
            Get started free →
          </Link>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ position:'relative', zIndex:10, borderTop:'1px solid rgba(255,255,255,0.05)', padding:'28px 32px' }}>
        <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <span style={{ fontSize:12, color:'#333' }}>© 2025 Universal AI</span>
          <div style={{ display:'flex', gap:24 }}>
            {['Privacy','Terms','Contact'].map(l => (
              <a key={l} href="#" style={{ fontSize:12, color:'#333', textDecoration:'none' }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}