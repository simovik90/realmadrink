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

  const BATCH_SIZE = 5;
  const models = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
  const allTranslations: string[] = [];

  for (let i = 0; i < validTexts.length; i += BATCH_SIZE) {
    const batch = validTexts.slice(i, i + BATCH_SIZE);
    const textsJson = JSON.stringify(batch);
    const prompt = `Translate these Italian texts to English. Return ONLY a valid JSON array of strings, same order, same length. Example: ["translation1","translation2"]

Input (JSON array): ${textsJson}

Output (JSON array only, no markdown):`;

    let lastError: unknown;
    let batchSuccess = false;

    for (const model of models) {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        let raw = (response.text ?? "").trim();
        if (!raw && response.candidates?.[0]?.content?.parts) {
          raw = response.candidates[0].content.parts
            .map((p: { text?: string }) => p?.text ?? "")
            .join("")
            .trim();
        }
        if (!raw) {
          lastError = new Error(`Model ${model}: empty response`);
          continue;
        }

        let parsed: unknown;
        try {
          const cleaned = raw
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```\s*$/i, "")
            .trim();
          parsed = JSON.parse(cleaned);
        } catch {
          lastError = new Error(`Model ${model}: parse error`);
          continue;
        }

        if (!Array.isArray(parsed)) {
          lastError = new Error(`Model ${model}: invalid format`);
          continue;
        }

        const batchTranslations = batch.map((orig, j) =>
          typeof parsed[j] === "string" ? String(parsed[j]).trim() : orig
        );
        allTranslations.push(...batchTranslations);
        batchSuccess = true;
        break;
      } catch (err) {
        lastError = err;
      }
    }

    if (!batchSuccess) {
      const message = lastError instanceof Error ? lastError.message : String(lastError);
      console.error("Translate API error (batch failed):", lastError);
      return NextResponse.json(
        { error: "Translation failed", detail: message },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ translations: allTranslations });
}
