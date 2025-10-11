# VARYN

A minimal Next.js 14 app with local-only signup/login and a simple dashboard. Now supports optional Gemini-based image analysis for hand scans with structured metrics and severity classification.

---

## Quickstart (Local)

```bash
pnpm i   # or npm i / yarn
pnpm dev
```
Visit http://localhost:3000

---

## Auth flow (demo-only)

- Register: stores email/password in `sessionStorage` (`luxen_users`).
- Login: sets `sessionStorage` → `luxen_user`.
- Sign out: clears the session entry. Ephemeral, for demo only.
- `/signup` redirects to `/register`.

---

## Dashboard

- Upload a hand image and add notes.
- `POST /api/analyze` returns structured metrics when `GEMINI_API_KEY` is set, using Gemini Flash; otherwise a local offline fallback simulates results.
- Metrics returned and charted:
  - Lesion Area (cm²)
  - Redness Level (0-10)
  - Scaling Level (0-10)
  - Texture Score (0-10)
  - Color Variation (%)
  - Severity Score (0-100)
  - Ambient Temp (°C)
  - Humidity (%)
  - Skin Hydration (AU)
  - Severity label: No issues / Moderate / Severe

The latest scan shows a metrics bar chart; aggregate cards include per-day counts and label distribution.

Safety: Outputs are informational only and are not medical advice. Consult a qualified clinician for concerns.

## Configuration

Set environment variables in `.env`:

```
GEMINI_API_KEY=your_google_api_key
# Optional: override model id
GEMINI_MODEL=gemini-2.5-flash
```

---

Generated: 2025-10-11
