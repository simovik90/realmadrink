import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY not configured" },
      { status: 503 }
    );
  }

  let body: { texts?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const texts = body.texts;
  if (!Array.isArray(texts) || texts.length === 0) {
    return NextResponse.json(
      { error: "texts must be a non-empty array" },
      { status: 400 }
    );
  }

  const validTexts = texts.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  if (validTexts.length === 0) {
    return NextResponse.json({ translations: [] });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `Translate the following Italian texts to English. Return ONLY a JSON array of strings, one translation per line, in the same order. No other text or markdown.

Texts to translate:
${validTexts.map((t, i) => `${i + 1}. ${t}`).join("\n")}

JSON array:`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const raw = response.text?.trim() ?? "";
    let parsed: string[];
    try {
      const cleaned = raw.replace(/^```json\s*/i, "").replace(/\s*```$/i, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "Translation response parse error" },
        { status: 500 }
      );
    }

    if (!Array.isArray(parsed)) {
      return NextResponse.json(
        { error: "Translation response invalid format" },
        { status: 500 }
      );
    }

    const translations = validTexts.map((_, i) =>
      typeof parsed[i] === "string" ? String(parsed[i]).trim() : ""
    );

    return NextResponse.json({ translations });
  } catch (err) {
    console.error("Translate API error:", err);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
