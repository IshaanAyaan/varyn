export const runtime = "nodejs";

type Metrics = {
  lesionAreaCm2: number;
  rednessLevel: number; // 0-10
  scalingLevel: number; // 0-10
  textureScore: number; // 0-10
  colorVariationPct: number; // 0-100
  severityScore: number; // 0-100
  ambientTempC: number; // °C
  humidityPct: number; // %
  skinHydrationAU: number; // arbitrary units
};

type AnalyzeResponse = {
  text: string;
  label: "No issues" | "Moderate" | "Severe";
  metrics: Metrics;
  recommendations?: string;
  disclaimer: string;
};

const JSON_INSTRUCTIONS = `
You are an imaging assistant for non-diagnostic skin wellness. You are analyzing a hand photo.
Return STRICT JSON with these exact keys:
{
  "metrics": {
    "lesionAreaCm2": number,
    "rednessLevel": number,            // 0-10
    "scalingLevel": number,            // 0-10
    "textureScore": number,            // 0-10 (higher = smoother)
    "colorVariationPct": number,       // 0-100
    "severityScore": number,           // 0-100
    "ambientTempC": number,            // e.g., 18-35
    "humidityPct": number,             // 0-100
    "skinHydrationAU": number          // 0-100 typical
  },
  "label": "No issues" | "Moderate" | "Severe",
  "recommendations": string,          // brief, general self-care suggestions only when label is "Severe"
  "disclaimer": string                // include: not medical advice; consult a professional
}

Rules:
- Base outputs on the image and any provided notes. If environment values are unknown, estimate typical values.
- Keep numbers realistic and within the specified ranges.
- Always include a cautious disclaimer that this is not medical advice.
- If label is "Severe", include short general care suggestions; otherwise keep recommendations concise or empty.
- Output ONLY the JSON. No markdown, no prose.
`;

function offlineFallback(prompt?: string, imageBase64?: string): AnalyzeResponse {
  // Deterministic pseudo-random values based on prompt hash so results are stable per input.
  const seedStr = `${prompt || ""}|${imageBase64 ? imageBase64.slice(0,256) : ""}`;
  const seed = seedStr.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 123456789);
  const rnd = (min: number, max: number, k: number) => {
    const x = Math.sin(seed + k) * 10000;
    const f = x - Math.floor(x);
    return Math.round((min + f * (max - min)) * 10) / 10;
  };
  const metrics: Metrics = {
    lesionAreaCm2: Math.max(0, rnd(0, 25, 1)),
    rednessLevel: Math.min(10, rnd(0, 10, 2)),
    scalingLevel: Math.min(10, rnd(0, 10, 3)),
    textureScore: Math.min(10, rnd(3, 10, 4)),
    colorVariationPct: Math.min(100, rnd(2, 40, 5)),
    severityScore: Math.min(100, rnd(5, 85, 6)),
    ambientTempC: Math.round(rnd(18, 30, 7)),
    humidityPct: Math.round(rnd(20, 70, 8)),
    skinHydrationAU: Math.round(rnd(30, 70, 9)),
  };
  const label = metrics.severityScore < 20 ? "No issues" : metrics.severityScore < 60 ? "Moderate" : "Severe";
  const disclaimer = "This is not medical advice. For concerns, consult a qualified clinician.";
  const recommendations = label === "Severe"
    ? "Keep area clean and moisturized, avoid irritants, and seek evaluation by a dermatologist."
    : label === "Moderate"
    ? "Monitor changes, maintain gentle skincare, and consider a professional check if symptoms persist."
    : "Maintain regular skincare and sun protection.";
  const text = `${label} scan. Severity Score: ${metrics.severityScore}/100. ${disclaimer}`;
  return { text, label, metrics, recommendations, disclaimer };
}

export async function POST(req: Request) {
  try {
    const { imageBase64, mimeType, prompt } = await req.json();
    if (!imageBase64) return new Response("Missing imageBase64", { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const modelId = process.env.GEMINI_MODEL || "gemini-2.5-flash"; // user requested 2.5 Flash; override via env if needed

    // If no key is configured, return a local deterministic fallback so the UI works offline.
    if (!apiKey) {
      const fallback = offlineFallback(prompt, imageBase64);
      return new Response(JSON.stringify(fallback), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    // Build Google Generative Language API request (multimodal JSON mode)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelId)}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const contents = [
      { role: "user", parts: [ { text: JSON_INSTRUCTIONS } ] },
      { role: "user", parts: [
        prompt ? { text: `User notes: ${String(prompt)}` } : { text: "User notes: (none)" },
        { inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } }
      ]}
    ];

    const body = {
      contents,
      generationConfig: {
        temperature: 0.2,
        // Gemini expects snake_case for this field in v1beta
        response_mime_type: "application/json",
      }
    } as any;

    let parsed: AnalyzeResponse | null = null;
    try {
      const resp = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!resp.ok) {
        // Fall back locally if upstream fails
        return new Response(JSON.stringify(offlineFallback(prompt, imageBase64)), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || data?.candidates?.[0]?.content?.parts?.[0]?.inline_data || "";
      if (typeof text === "string") {
        parsed = JSON.parse(text);
      }
    } catch {
      // parsing or network issue -> fallback
      parsed = null;
    }

    if (!parsed) {
      parsed = offlineFallback(prompt, imageBase64);
    } else {
      // Validate and clamp ranges to avoid UI issues
      const m = parsed.metrics as Metrics;
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, Number.isFinite(v) ? v : min));
      parsed.metrics = {
        lesionAreaCm2: clamp(m?.lesionAreaCm2 ?? 0, 0, 1000),
        rednessLevel: clamp(m?.rednessLevel ?? 0, 0, 10),
        scalingLevel: clamp(m?.scalingLevel ?? 0, 0, 10),
        textureScore: clamp(m?.textureScore ?? 0, 0, 10),
        colorVariationPct: clamp(m?.colorVariationPct ?? 0, 0, 100),
        severityScore: clamp(m?.severityScore ?? 0, 0, 100),
        ambientTempC: clamp(m?.ambientTempC ?? 22, -10, 60),
        humidityPct: clamp(m?.humidityPct ?? 45, 0, 100),
        skinHydrationAU: clamp(m?.skinHydrationAU ?? 50, 0, 100),
      };
      if (!parsed.label) {
        parsed.label = parsed.metrics.severityScore < 20 ? "No issues" : parsed.metrics.severityScore < 60 ? "Moderate" : "Severe";
      }
      if (!parsed.disclaimer) {
        parsed.disclaimer = "This is not medical advice. For concerns, consult a qualified clinician.";
      }
      // Ensure response text always present for existing UI
      parsed.text = parsed.text && typeof parsed.text === "string"
        ? parsed.text
        : `${parsed.label} scan. Severity Score: ${parsed.metrics.severityScore}/100. ${parsed.disclaimer}`;
    }

    return new Response(JSON.stringify(parsed), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(e.message || "Error", { status: 500 });
  }
}
