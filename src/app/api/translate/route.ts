import { NextResponse } from "next/server";

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

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
    // Pass texts as numbered lines instead of JSON to avoid escaping issues
    const numberedLines = batch.map((t, idx) => `${idx + 1}. ${t}`).join("\n");
    const prompt = `Translate these Italian texts to English. Return a JSON array of strings in the same order. One translation per line, same count.

Italian texts:
${numberedLines}

Respond with ONLY a valid JSON array, e.g. ["translation1","translation2"]`;

    let lastError: unknown;
    let batchSuccess = false;

    for (const model of models) {
      try {
        const url = `${GEMINI_BASE}/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
        const payload = {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3 },
        };

        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const bodyText = await res.text();
        let data: {
          error?: { message?: string; code?: number };
          candidates?: Array<{
            content?: { parts?: Array<{ text?: string }> };
          }>;
        };
        try {
          data = JSON.parse(bodyText) as typeof data;
        } catch {
          lastError = new Error(`Gemini ${model}: invalid response ${bodyText.slice(0, 150)}`);
          continue;
        }

        if (!res.ok) {
          const msg = data.error?.message ?? JSON.stringify(data).slice(0, 300);
          lastError = new Error(`Gemini ${model} ${res.status}: ${msg}`);
          continue;
        }

        if (data.error?.message) {
          lastError = new Error(`Gemini ${model}: ${data.error.message}`);
          continue;
        }

        const parts = data.candidates?.[0]?.content?.parts ?? [];
        let raw = parts.map((p) => p.text ?? "").join("").trim();
        if (!raw) {
          const fb = (data as { promptFeedback?: { blockReason?: string } }).promptFeedback;
          lastError = new Error(
            `Model ${model}: empty response${fb?.blockReason ? ` (blocked: ${fb.blockReason})` : ""}`
          );
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
          lastError = new Error(`Model ${model}: parse error - ${raw.slice(0, 100)}`);
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
