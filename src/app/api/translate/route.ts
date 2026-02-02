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
    const textsJson = JSON.stringify(validTexts);
    const prompt = `Translate these Italian texts to English. Return ONLY a valid JSON array of strings, same order, same length. Example: ["translation1","translation2"]

Input (JSON array): ${textsJson}

Output (JSON array only, no markdown):`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });

    const raw = (response.text ?? "").trim();
    if (!raw) {
      return NextResponse.json(
        { error: "Empty translation response" },
        { status: 500 }
      );
    }

    let parsed: unknown;
    try {
      const cleaned = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/i, "")
        .trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Translate parse error, raw:", raw.slice(0, 200));
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
      typeof parsed[i] === "string" ? String(parsed[i]).trim() : validTexts[i] ?? ""
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
