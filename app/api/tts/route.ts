import { NextRequest, NextResponse } from "next/server";

const VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel - free plan

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: "No text" }, { status: 400 });

    const key = process.env.ELEVENLABS_API_KEY;
    if (!key) return NextResponse.json({ error: "ElevenLabs key missing" }, { status: 500 });

    const clean = text
      .replace(/```[\s\S]*?```/g, "")
      .replace(/`[^`]*`/g, "")
      .replace(/[*#_~>\[\]]/g, "")
      .replace(/https?:\/\/\S+/g, "")
      .trim()
      .slice(0, 500);

    if (!clean) return NextResponse.json({ error: "Empty text" }, { status: 400 });

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": key,
          "Content-Type": "application/json",
          "Accept": "audio/mpeg",
        },
        body: JSON.stringify({
          text: clean,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.8,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("ElevenLabs error:", err);
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const audioBuffer = await res.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    console.error("TTS error:", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}