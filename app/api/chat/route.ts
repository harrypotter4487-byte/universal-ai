import { NextRequest, NextResponse } from "next/server";

const SYSTEM = `You are a helpful AI assistant. Keep replies short, friendly, and conversational — exactly like ChatGPT.
- ALWAYS start your reply with a relevant emoji (e.g. 😊 👋 😄 🤔 💡 etc). Never skip this.
- Keep it short. If the answer is simple, reply in 1-3 sentences max.
- No long essays. No section headings. No unnecessary formatting.
- Use bullet points only when listing 3+ things.
- Be warm, smart, and to the point.`;

const CANVAS_SYSTEM = `You generate canvas drawing instructions as JSON.
When user asks to draw/diagram/canvas, respond with:
\`\`\`canvas
[{"id":"1","type":"rect","x":100,"y":80,"w":250,"h":60,"color":"#2563eb","fill":"#eff6ff"},{"id":"2","type":"text","x":120,"y":118,"text":"Title Here","color":"#1e3a8a","fontSize":18,"bold":true}]
\`\`\`
Canvas: 1100x650px white background. Use professional colors.
Types: rect(x,y,w,h), circle(x,y,r), text(x,y,text,fontSize,bold), line(x,y,w=endX,h=endY)`;

export async function POST(req: NextRequest) {
  try {
    const body        = await req.json();
    const model       = body.model       || "groq";
    const wantsCanvas = body.wantsCanvas || false;
    const message     = body.message     || body.messages?.[body.messages.length - 1]?.content || "";
    const images: string[] = body.images || [];
    const systemMsg   = wantsCanvas ? CANVAS_SYSTEM : SYSTEM;

    const vision = (text: string, imgs: string[]) =>
      imgs.length === 0 ? text : [
        { type: "text", text },
        ...imgs.map(url => ({ type: "image_url", image_url: { url, detail: "high" } })),
      ];

    // ── GROQ ──
    if (model === "groq") {
      const key = process.env.GROQ_API_KEY;
      if (!key) return NextResponse.json({ reply: "Groq API key missing" });
      const useVision = images.length > 0;
      const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: useVision ? "meta-llama/llama-4-scout-17b-16e-instruct" : "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: systemMsg }, { role: "user", content: vision(message, images) }],
          max_tokens: 1024,
        }),
      });
      const d = await r.json();
      if (!r.ok) return NextResponse.json({ reply: "Groq error: " + (d?.error?.message || "Unknown") });
      return NextResponse.json({ reply: d?.choices?.[0]?.message?.content || "No response" });
    }

    // ── GEMINI ──
    if (model === "gemini") {
      const key = process.env.GEMINI_API_KEY;
      if (!key) return NextResponse.json({ reply: "Gemini API key missing!" });
      const parts: object[] = [{ text: message }];
      images.forEach(d => {
        const [m, b] = d.split(",");
        parts.push({ inlineData: { mimeType: m.match(/:(.*?);/)?.[1] || "image/jpeg", data: b } });
      });
      try {
        const r = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`,
          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ systemInstruction: { parts: [{ text: systemMsg }] }, contents: [{ parts }] }) }
        );
        const raw = await r.text(); if (!raw) return NextResponse.json({ reply: "Empty response" });
        const d   = JSON.parse(raw);
        if (d?.error?.code === 429) return NextResponse.json({ reply: "Rate limit! Groq try karo." });
        if (d?.error) return NextResponse.json({ reply: "Gemini error: " + d.error.message });
        return NextResponse.json({ reply: d?.candidates?.[0]?.content?.parts?.[0]?.text || "No response" });
      } catch { return NextResponse.json({ reply: "Gemini connection error!" }); }
    }

    // ── NVIDIA models helper ──
    const nvidiaCall = async (mdl: string, nm: string) => {
      const key = process.env.NVIDIA_API_KEY;
      if (!key) return NextResponse.json({ reply: "NVIDIA API key missing" });
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 30000);
      try {
        const r = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
          body: JSON.stringify({ model: mdl, messages: [{ role: "system", content: systemMsg }, { role: "user", content: message }], max_tokens: 1024 }),
          signal: ctrl.signal,
        });
        clearTimeout(t);
        const d = JSON.parse(await r.text());
        if (!r.ok) return NextResponse.json({ reply: `${nm} error: ` + (d?.error?.message || "Unknown") });
        return NextResponse.json({ reply: d?.choices?.[0]?.message?.content || "No response" });
      } catch (e: unknown) {
        clearTimeout(t);
        if (e instanceof Error && e.name === "AbortError") return NextResponse.json({ reply: `${nm} timeout` });
        throw e;
      }
    };

    if (model === "deepseek") return nvidiaCall("deepseek-ai/deepseek-v3.2",          "DeepSeek");
    if (model === "nemotron") return nvidiaCall("nvidia/nemotron-3-super-120b-a12b",   "Nemotron");
    if (model === "gptoss")   return nvidiaCall("openai/gpt-oss-120b",                 "GPT-OSS");

    return NextResponse.json({ reply: "Unknown model." });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}