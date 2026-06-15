export const runtime = "nodejs";

type Attributes = {
  rednessLevel: number; // 0-10
  scalingLevel: number; // 0-10
  textureScore: number; // 0-10
  colorVariationPct: number; // 0-100
  sizeEstimateMm: number;
};

type AnalyzeResponse = {
  description: string;
  label: "Clear" | "Mild" | "Moderate" | "Concerning";
  severityScore: number; // 0-100
  attributes: Attributes;
  concernFlags: string[];
  recommendations: string;
  disclaimer: string;
};

const DISCLAIMER =
  "This is an informational observation, not a medical diagnosis. Varyn cannot diagnose conditions. For any concern, consult a qualified clinician.";

const JSON_INSTRUCTIONS = `
You are a careful, non-diagnostic skin-observation assistant for a personal symptom-tracking journal.
You look at a single photo of a skin area and write an objective, plain-language description so a person
can track how the area changes over time and share it with their doctor. You DO NOT diagnose conditions.

Return STRICT JSON with these exact keys and nothing else:
{
  "description": string,              // 2-4 sentence plain-language description of what is visible (color, shape, border, surface, surrounding skin)
  "label": "Clear" | "Mild" | "Moderate" | "Concerning",
  "severityScore": number,            // 0-100 overall visual prominence/severity, NOT a diagnosis
  "attributes": {
    "rednessLevel": number,           // 0-10
    "scalingLevel": number,           // 0-10 (flaking/scaling)
    "textureScore": number,           // 0-10 (higher = more raised/irregular surface)
    "colorVariationPct": number,      // 0-100 (how much color varies within the area)
    "sizeEstimateMm": number          // rough longest dimension in mm (estimate if no reference)
  },
  "concernFlags": string[],           // short phrases for things a clinician may want to see: e.g. "Irregular/asymmetric border", "Multiple colors", "Larger than 6mm", "Raised or bleeding surface", "Rapidly changing". Empty array if none.
  "recommendations": string,          // brief, general self-care / monitoring guidance (no prescriptions, no diagnosis)
  "disclaimer": string                // restate that this is informational, not medical advice
}

Rules:
- Be objective and descriptive. Never state or imply a specific diagnosis or disease name.
- Use the user's notes for context but base visual claims on the image.
- Keep numbers realistic and within range.
- Use "Concerning" only when several warning signs are visible; encourage seeing a clinician in that case.
- Output ONLY the JSON. No markdown fences, no extra prose.
`;

function offlineFallback(prompt?: string, imageBase64?: string): AnalyzeResponse {
  // Deterministic pseudo-values seeded by the input so a given image is stable across runs.
  const seedStr = `${prompt || ""}|${imageBase64 ? imageBase64.slice(0, 256) : ""}`;
  const seed = seedStr
    .split("")
    .reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 123456789);
  const rnd = (min: number, max: number, k: number) => {
    const x = Math.sin(seed + k) * 10000;
    const f = x - Math.floor(x);
    return Math.round((min + f * (max - min)) * 10) / 10;
  };

  const attributes: Attributes = {
    rednessLevel: Math.min(10, rnd(0, 8, 2)),
    scalingLevel: Math.min(10, rnd(0, 7, 3)),
    textureScore: Math.min(10, rnd(0, 8, 4)),
    colorVariationPct: Math.min(100, rnd(2, 45, 5)),
    sizeEstimateMm: Math.max(1, Math.round(rnd(2, 18, 6))),
  };
  const severityScore = Math.min(
    100,
    Math.round(
      attributes.rednessLevel * 4 +
        attributes.scalingLevel * 3 +
        attributes.colorVariationPct * 0.3
    )
  );
  const label: AnalyzeResponse["label"] =
    severityScore < 20
      ? "Clear"
      : severityScore < 45
      ? "Mild"
      : severityScore < 70
      ? "Moderate"
      : "Concerning";

  const concernFlags: string[] = [];
  if (attributes.colorVariationPct > 35) concernFlags.push("Multiple colors / uneven pigment");
  if (attributes.sizeEstimateMm > 6) concernFlags.push("Larger than 6mm");
  if (attributes.textureScore > 6) concernFlags.push("Raised or irregular surface");

  const recommendations =
    label === "Concerning"
      ? "Several visible warning signs. Keep the area clean, avoid scratching, photograph it again in a few days, and arrange a dermatology evaluation."
      : label === "Moderate"
      ? "Monitor the area, keep it moisturized, avoid irritants, and re-scan in a week to watch for change."
      : "Looks unremarkable. Maintain normal skincare and sun protection, and re-scan if you notice change.";

  const description =
    "Offline preview: this is a simulated description generated without a Gemini key. " +
    `The area shows redness around ${attributes.rednessLevel}/10 and color variation near ${attributes.colorVariationPct}%, ` +
    `roughly ${attributes.sizeEstimateMm}mm across. Add a Gemini API key for a real image-based description.`;

  return {
    description,
    label,
    severityScore,
    attributes,
    concernFlags,
    recommendations,
    disclaimer: DISCLAIMER,
  };
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
}

function normalize(parsed: any): AnalyzeResponse {
  const a = parsed?.attributes ?? {};
  const attributes: Attributes = {
    rednessLevel: clamp(a.rednessLevel ?? 0, 0, 10),
    scalingLevel: clamp(a.scalingLevel ?? 0, 0, 10),
    textureScore: clamp(a.textureScore ?? 0, 0, 10),
    colorVariationPct: clamp(a.colorVariationPct ?? 0, 0, 100),
    sizeEstimateMm: clamp(a.sizeEstimateMm ?? 0, 0, 500),
  };
  const severityScore = clamp(parsed?.severityScore ?? 0, 0, 100);
  const validLabels = ["Clear", "Mild", "Moderate", "Concerning"];
  const label: AnalyzeResponse["label"] = validLabels.includes(parsed?.label)
    ? parsed.label
    : severityScore < 20
    ? "Clear"
    : severityScore < 45
    ? "Mild"
    : severityScore < 70
    ? "Moderate"
    : "Concerning";
  const concernFlags = Array.isArray(parsed?.concernFlags)
    ? parsed.concernFlags.filter((x: any) => typeof x === "string").slice(0, 8)
    : [];
  return {
    description:
      typeof parsed?.description === "string" && parsed.description.trim()
        ? parsed.description.trim()
        : "No description was returned.",
    label,
    severityScore,
    attributes,
    concernFlags,
    recommendations:
      typeof parsed?.recommendations === "string" ? parsed.recommendations : "",
    disclaimer:
      typeof parsed?.disclaimer === "string" && parsed.disclaimer.trim()
        ? parsed.disclaimer
        : DISCLAIMER,
  };
}

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, prompt } = await req.json();
    if (!imageBase64) return new Response("Missing imageBase64", { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!apiKey) {
      return new Response(JSON.stringify(offlineFallback(prompt, imageBase64)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelId
    )}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const body = {
      contents: [
        { role: "user", parts: [{ text: JSON_INSTRUCTIONS }] },
        {
          role: "user",
          parts: [
            { text: prompt ? `User notes: ${String(prompt)}` : "User notes: (none)" },
            { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        response_mime_type: "application/json",
      },
    } as any;

    try {
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        return new Response(JSON.stringify(offlineFallback(prompt, imageBase64)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (typeof text === "string" && text.trim()) {
        const parsed = JSON.parse(text);
        return new Response(JSON.stringify(normalize(parsed)), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch {
      // fall through to fallback
    }

    return new Response(JSON.stringify(offlineFallback(prompt, imageBase64)), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(e?.message || "Error", { status: 500 });
  }
}
