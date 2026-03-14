import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("CHAT API HIT");
  try {
    const body = await request.json();
    const messages = body.messages || [];
    const message = messages[messages.length - 1]?.content || body.message || "";
    const model = body.model || "gemini";

    // ==================== GROQ ====================
    if (model === "groq") {
      const GROQ_KEY = process.env.GROQ_API_KEY;
      if (!GROQ_KEY) {
        return NextResponse.json({ reply: "⚠️ Groq API key missing — .env mein add karo!" });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${GROQ_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "user", content: message }],
          max_tokens: 2048,
        }),
      });

      const data = await response.json();
      console.log("GROQ RESPONSE:", data);

      if (!response.ok) {
        return NextResponse.json({ reply: "❌ Groq error: " + (data?.error?.message || "Unknown error") });
      }

      const reply = data?.choices?.[0]?.message?.content || "No response from Groq";
      return NextResponse.json({ reply });
    }

    // ==================== DEEPSEEK ====================
    if (model === "deepseek") {
      const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
      if (!DEEPSEEK_KEY) {
        return NextResponse.json({ reply: "⚠️ DeepSeek API key missing!" });
      }

      const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${DEEPSEEK_KEY}`,
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: message }],
          max_tokens: 2048,
        }),
      });

      const data = await response.json();
      console.log("DEEPSEEK RESPONSE:", data);

      if (!response.ok) {
        return NextResponse.json({ reply: "❌ DeepSeek error: " + (data?.error?.message || "Unknown") });
      }

      const reply = data?.choices?.[0]?.message?.content || "No response from DeepSeek";
      return NextResponse.json({ reply });
    }

    // ==================== GEMINI ====================
    const GEMINI_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_KEY) {
      return NextResponse.json({ reply: "⚠️ Gemini API key missing!" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: message }] }]
        }),
      }
    );

    const text = await response.text();
    if (!text) return NextResponse.json({ reply: "No response from Gemini" });
    const data = JSON.parse(text);
    console.log("GEMINI RESPONSE:", data);

    if (!response.ok) {
      if (data?.error?.code === 429) {
        return NextResponse.json({
          reply: "⚠️ Gemini busy hai! **Groq** pe switch karo — bilkul free aur fast hai! ⚡"
        });
      }
      return NextResponse.json({ reply: "❌ Gemini API error" });
    }

    const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini";
    return NextResponse.json({ reply });

  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}