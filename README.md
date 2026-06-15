# Varyn — Skin Symptom Tracker

Photograph a skin spot, get an AI-written description and severity reading, and
keep a private dated journal so you can see how it changes over time — then hand
your doctor a clean, printable report.

Built with Next.js 14 (App Router). Image analysis uses Google Gemini, with a
built-in offline simulator so the app works even without a key.

---

## Quickstart (local)

```bash
npm install
npm run dev
```

Visit http://localhost:3000

---

## How it works

1. **Sign up / sign in** — demo-only auth stored in `sessionStorage`.
2. **New scan** (`/capture`) — take or upload a photo, pick a body region, give
   the spot a label (e.g. "Mole near wrist"), add symptom notes, and analyze.
   `POST /api/analyze` returns a structured, non-diagnostic observation.
3. **Save to journal** — the photo is downscaled and the entry is stored in
   `localStorage`, scoped per signed-in user, so it persists across sessions.
4. **Timeline** (`/timeline`) — entries are grouped by spot (region + label),
   charted by severity over time, with a worsening / improving / stable trend.
5. **Dashboard** (`/dashboard`) — overview, stats, and automatic **flags**:
   high-severity spots, worsening trends, and recurring observations.
6. **Report** (`/report`) — a printable, doctor-ready summary of every tracked
   spot, its image timeline, and flagged concerns. Use **Print / Save PDF**.

### What the analysis returns

- `description` — plain-language summary of what's visible
- `label` — Clear / Mild / Moderate / Concerning
- `severityScore` — 0–100 (visual prominence, **not** a diagnosis)
- `attributes` — redness, scaling, texture, color variation, size estimate (mm)
- `concernFlags` — warning signs worth showing a clinician
- `recommendations` + `disclaimer`

### Pattern detection

Done client-side over saved entries, grouped by region + spot label:

- **Worsening / improving** when severity shifts ≥12 points across scans
- **High severity** alert when the latest scan ≥70
- **Recurring observations** when a flag appears in ≥2 scans

---

## Configuration

Set environment variables (e.g. in Vercel or a local `.env`):

```
GEMINI_API_KEY=your_google_api_key
# Optional: override model id (default gemini-2.5-flash)
GEMINI_MODEL=gemini-2.5-flash
```

Without a key, `/api/analyze` returns a deterministic offline preview so the
full flow still works.

---

## Privacy & safety

- Photos and notes never leave the browser except the single image sent to the
  Gemini API for analysis; saved entries live only in this browser's storage.
- Varyn provides **informational observations only and cannot diagnose medical
  conditions**. Always consult a qualified clinician.
