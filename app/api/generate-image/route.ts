import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      "https://ai.api.nvidia.com/v1/genai/stabilityai/stable-diffusion-xl",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.NVIDIA_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text_prompts: [
            {
              text: prompt
            }
          ],
          cfg_scale: 7,
          height: 1024,
          width: 1024,
          samples: 1,
          steps: 30
        })
      }
    );

    const data = await response.json();

    console.log("NVIDIA RESPONSE:", data);

    const image = data?.artifacts?.[0]?.base64;

    if (!image) {
      return NextResponse.json({
        error: "Image generation failed"
      });
    }

    return NextResponse.json({
      image: `data:image/png;base64,${image}`
    });

  } catch (error) {
    console.error("ERROR:", error);

    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}