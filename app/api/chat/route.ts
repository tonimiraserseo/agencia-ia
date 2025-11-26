import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// ---------- OPENAI ----------
async function callOpenAI(message: string, agent: string) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) throw new Error("OPENAI_API_KEY no configurada");

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: "gpt-4.1-mini",
      messages: [
        { role: "system", content: `Eres un experto en ${agent}. Responde de forma profesional.` },
        { role: "user", content: message }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "Sin respuesta de OpenAI";
}


// ---------- GEMINI ----------
async function callGemini(message: string, agent: string) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `Actúa como experto en ${agent}. ${message}` }
            ]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(err);
  }

  const data = await response.json();

  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sin respuesta de Gemini"
  );
}


// ---------- ROUTE PRINCIPAL ----------
export async function POST(req: NextRequest) {
  try {
    const { message, provider, agent } = await req.json();

    if (!message || !provider) {
      return NextResponse.json(
        { reply: "Datos incompletos" },
        { status: 400 }
      );
    }

    let reply = "";

    if (provider === "openai") {
      reply = await callOpenAI(message, agent);
    }

    if (provider === "gemini") {
      reply = await callGemini(message, agent);
    }

    return NextResponse.json({ reply });

  } catch (error) {
    console.error("ERROR API IA:", error);
    return NextResponse.json(
      { reply: "Error en servidor IA" },
      { status: 500 }
    );
  }
}
