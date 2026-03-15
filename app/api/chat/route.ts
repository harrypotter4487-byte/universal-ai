import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("CHAT API HIT");

  try {
    const body = await request.json();
    const messages = body.messages || [];
    const message = messages[messages.length - 1]?.content || body.message || "";
    const model = body.model || "groq";

    console.log("MODEL:", model);

    // ==================== GROQ ====================
    if (model === "groq") {
      const GROQ_KEY = process.env.GROQ_API_KEY;
      if (!GROQ_KEY) {
        return NextResponse.json({ reply: "Groq API key missing" });
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${GROQ_KEY}`,
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
        return NextResponse.json({ reply: "Groq error: " + (data?.error?.message || "Unknown error") });
      }

      return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || "No response from Groq" });
    }

    // ==================== DEEPSEEK (via NVIDIA) ====================
    if (model === "deepseek") {
      const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
      if (!NVIDIA_KEY) {
        return NextResponse.json({ reply: "NVIDIA API key missing" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NVIDIA_KEY}`,
          },
          body: JSON.stringify({
            model: "deepseek-ai/deepseek-v3.2",
            messages: [
              { role: "system", content: "You are a helpful AI assistant." },
              { role: "user", content: message },
            ],
            max_tokens: 2048,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.log("DEEPSEEK RAW:", rawText);
          return NextResponse.json({ reply: "DeepSeek invalid response" });
        }

        console.log("DEEPSEEK RESPONSE:", data);

        if (!response.ok) {
          return NextResponse.json({ reply: "DeepSeek error: " + (data?.error?.message || data?.detail || "Unknown error") });
        }

        return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || "No response from DeepSeek" });

      } catch (err: unknown) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name === "AbortError") {
          return NextResponse.json({ reply: "DeepSeek timeout — thodi der baad try karo" });
        }
        throw err;
      }
    }

    // ==================== NVIDIA NEMOTRON ====================
    if (model === "nemotron") {
      const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
      if (!NVIDIA_KEY) {
        return NextResponse.json({ reply: "NVIDIA API key missing" });
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      try {
        const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NVIDIA_KEY}`,
          },
          body: JSON.stringify({
            model: "nvidia/nemotron-3-super-120b-a12b",
            messages: [
              { role: "system", content: "You are a helpful AI assistant." },
              { role: "user", content: message },
            ],
            max_tokens: 2048,
          }),
          signal: controller.signal,
        });
        clearTimeout(timeout);

        const rawText = await response.text();
        let data;
        try {
          data = JSON.parse(rawText);
        } catch {
          console.log("NEMOTRON RAW:", rawText);
          return NextResponse.json({ reply: "Nemotron invalid response" });
        }

        console.log("NEMOTRON RESPONSE:", data);

        if (!response.ok) {
          return NextResponse.json({ reply: "Nemotron error: " + (data?.error?.message || data?.detail || "Unknown error") });
        }

        return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || "No response from Nemotron" });

      } catch (err: unknown) {
        clearTimeout(timeout);
        if (err instanceof Error && err.name === "AbortError") {
          return NextResponse.json({ reply: "Nemotron timeout — thodi der baad try karo" });
        }
        throw err;
      }
    }

    // ==================== GPT-OSS-120B (via NVIDIA) ====================
if (model === "gptoss") {
  const NVIDIA_KEY = process.env.NVIDIA_API_KEY;
  if (!NVIDIA_KEY) {
    return NextResponse.json({ reply: "NVIDIA API key missing" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${NVIDIA_KEY}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [
          { role: "system", content: "You are a helpful AI assistant." },
          { role: "user", content: message },
        ],
        max_tokens: 2048,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    const rawText = await response.text();
    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      console.log("GPTOSS RAW:", rawText);
      return NextResponse.json({ reply: "GPT-OSS invalid response" });
    }

    console.log("GPTOSS RESPONSE:", data);

    if (!response.ok) {
      return NextResponse.json({ reply: "GPT-OSS error: " + (data?.error?.message || data?.detail || "Unknown error") });
    }

    return NextResponse.json({ reply: data?.choices?.[0]?.message?.content || "No response from GPT-OSS" });

  } catch (err: unknown) {
    clearTimeout(timeout);
    if (err instanceof Error && err.name === "AbortError") {
      return NextResponse.json({ reply: "GPT-OSS timeout — thodi der baad try karo" });
    }
    throw err;
  }
}

    // ==================== GEMINI ====================
    if (model === "gemini") {
      const GEMINI_KEY = process.env.GEMINI_API_KEY;
      if (!GEMINI_KEY) {
        return NextResponse.json({ reply: "Gemini API key missing" });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: message }] }],
          }),
        }
      );

      const rawText = await response.text();
      if (!rawText) return NextResponse.json({ reply: "No response from Gemini" });

      const data = JSON.parse(rawText);
      console.log("GEMINI RESPONSE:", data);

      if (!response.ok) {
        if (data?.error?.code === 429) {
          return NextResponse.json({ reply: "Gemini busy hai! Groq pe switch karo" });
        }
        return NextResponse.json({ reply: "Gemini API error" });
      }

      return NextResponse.json({
        reply: data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response from Gemini",
      });
    }

    // ==================== FALLBACK ====================
    return NextResponse.json({ reply: "Unknown model selected." });

  } catch (error) {
    console.error("ERROR:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}