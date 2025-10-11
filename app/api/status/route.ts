export async function GET() {
  // Report whether a Gemini API key is configured so the UI can indicate readiness
  const hasKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  return new Response(JSON.stringify({ ok: true, hasKey }), { status: 200, headers: { "Content-Type": "application/json" }});
}
