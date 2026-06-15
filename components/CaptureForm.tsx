"use client";
import { useRef, useState } from "react";
import { Analysis, BODY_REGIONS, Entry } from "../lib/types";
import { fileToDataUrl, makeThumbnail } from "../lib/image";
import { labelColor } from "../lib/storage";

type Props = {
  onSaved: (entry: Entry) => void;
};

export default function CaptureForm({ onSaved }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fullDataUrl, setFullDataUrl] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [region, setRegion] = useState<string>(BODY_REGIONS[0]);
  const [spotLabel, setSpotLabel] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setAnalysis(null);
    setMimeType(file.type || "image/jpeg");
    const dataUrl = await fileToDataUrl(file);
    setFullDataUrl(dataUrl);
    const thumb = await makeThumbnail(dataUrl);
    setPreview(thumb);
  }

  async function analyze() {
    if (!fullDataUrl) {
      setError("Please choose or capture a photo first.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: fullDataUrl.split(",")[1],
          mimeType,
          prompt: [
            region ? `Body region: ${region}.` : "",
            spotLabel ? `Spot label: ${spotLabel}.` : "",
            notes ? `Symptoms / notes: ${notes}` : "",
          ]
            .filter(Boolean)
            .join(" "),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data: Analysis = await res.json();
      setAnalysis(data);
    } catch (e: any) {
      setError(e?.message || "Failed to analyze image.");
    } finally {
      setLoading(false);
    }
  }

  function save() {
    if (!analysis || !preview) return;
    const entry: Entry = {
      id:
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : String(Date.now()) + Math.random().toString(16).slice(2),
      at: new Date().toISOString(),
      region,
      spotLabel: spotLabel.trim(),
      notes: notes.trim(),
      imageThumb: preview,
      analysis,
    };
    try {
      onSaved(entry);
      // reset for the next capture
      setPreview(null);
      setFullDataUrl(null);
      setSpotLabel("");
      setNotes("");
      setAnalysis(null);
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) {
      setError(
        "Could not save — local storage may be full. Try removing old entries."
      );
    }
  }

  return (
    <div className="card grid" style={{ gap: "1rem" }}>
      <div className="grid grid-2" style={{ gap: "1rem" }}>
        <div className="grid" style={{ gap: ".75rem", alignContent: "start" }}>
          <div>
            <label className="label">Photo</label>
            <input
              ref={fileRef}
              className="input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPick}
            />
            <div className="text-sm text-gray-600" style={{ marginTop: ".35rem" }}>
              On a phone this opens the camera. Photos are downscaled and stored
              only on this device.
            </div>
          </div>
          <div>
            <label className="label">Body region</label>
            <select
              className="input"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            >
              {BODY_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Spot label (optional)</label>
            <input
              className="input"
              placeholder='e.g. "Mole near left wrist"'
              value={spotLabel}
              onChange={(e) => setSpotLabel(e.target.value)}
            />
            <div className="text-sm text-gray-600" style={{ marginTop: ".35rem" }}>
              Use the same label each time to track one spot over time.
            </div>
          </div>
          <div>
            <label className="label">Symptoms / notes</label>
            <textarea
              className="input"
              rows={3}
              placeholder="Itchy, appeared last week, slightly raised…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="grid" style={{ gap: ".75rem", alignContent: "start" }}>
          <label className="label">Preview</label>
          <div
            style={{
              border: "1px dashed var(--card-border)",
              borderRadius: "1rem",
              minHeight: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              background: "rgba(255,255,255,0.6)",
            }}
          >
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={preview}
                alt="preview"
                style={{ maxWidth: "100%", maxHeight: 320, borderRadius: ".75rem" }}
              />
            ) : (
              <span className="text-sm text-gray-600">No photo yet</span>
            )}
          </div>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <button className="btn" onClick={analyze} disabled={loading || !preview}>
              {loading ? "Analyzing…" : "Analyze"}
            </button>
            <button
              className="btn secondary"
              onClick={save}
              disabled={!analysis}
            >
              Save to journal
            </button>
          </div>
          {error && (
            <p className="text-sm" style={{ color: "crimson" }}>
              {error}
            </p>
          )}
        </div>
      </div>

      {analysis && (
        <div className="grid" style={{ gap: ".75rem" }}>
          <div className="severity-card">
            <div className="severity-header">
              <span className="badge" style={{ color: labelColor(analysis.label) }}>
                <span
                  style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: labelColor(analysis.label), display: "inline-block",
                  }}
                />
                {analysis.label}
              </span>
              <span className="text-sm text-gray-600">
                Severity{" "}
                <strong style={{ color: labelColor(analysis.label) }}>
                  {Math.round(analysis.severityScore)}
                </strong>
                /100
              </span>
            </div>
            <div className="sev-track" style={{ marginTop: ".7rem" }}>
              <div
                className="sev-fill"
                style={{
                  width: `${Math.max(2, Math.min(100, analysis.severityScore))}%`,
                  background: labelColor(analysis.label),
                }}
              />
            </div>
            <p style={{ marginTop: ".75rem", marginBottom: 0 }}>{analysis.description}</p>
          </div>

          {analysis.concernFlags.length > 0 && (
            <div className="caution-card flag">
              <div className="caution-title">🚩 Flagged for your doctor</div>
              <div className="row wrap" style={{ gap: ".4rem", marginTop: ".5rem" }}>
                {analysis.concernFlags.map((f, i) => (
                  <span key={i} className="badge" style={{ background: "#fff" }}>
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}

          {analysis.recommendations && (
            <div className="caution-card info">
              <div className="caution-title">💡 Suggested next steps</div>
              <div style={{ marginTop: ".35rem" }}>{analysis.recommendations}</div>
            </div>
          )}

          <p className="caution-subtle" style={{ margin: 0 }}>
            {analysis.disclaimer}
          </p>
        </div>
      )}
    </div>
  );
}
