"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  buildAlerts,
  getCurrentUser,
  getEntries,
  groupBySpot,
  labelColor,
} from "../../lib/storage";
import { Entry } from "../../lib/types";

export default function ReportPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setEntries(getEntries(u.email));
  }, [router]);

  const groups = useMemo(() => groupBySpot(entries), [entries]);
  const alerts = useMemo(() => buildAlerts(entries), [entries]);

  if (!user) return null;

  const generated = new Date().toLocaleString();

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <div className="card no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem" }}>
        <div>
          <h1 className="text-xl font-semibold">Doctor report</h1>
          <div className="text-sm text-gray-600">
            A printable summary of everything you've tracked.
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/capture" className="btn ghost">
            + New scan
          </Link>
          <button className="btn" onClick={() => window.print()}>
            Print / Save PDF
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card">
          <p className="text-sm text-gray-600" style={{ margin: 0 }}>
            Nothing to report yet.{" "}
            <Link href="/capture" style={{ textDecoration: "underline" }}>
              Add a scan
            </Link>{" "}
            first.
          </p>
        </div>
      ) : (
        <div className="card report-sheet">
          <header style={{ borderBottom: "2px solid #0f172a", paddingBottom: ".75rem", marginBottom: "1rem" }}>
            <h1 style={{ margin: 0 }}>Varyn Skin Tracking Report</h1>
            <div className="text-sm text-gray-600">
              Patient: {user.name || user.email} · Generated {generated}
            </div>
          </header>

          {/* Summary */}
          <section style={{ marginBottom: "1.25rem" }}>
            <h2 className="font-semibold">Summary</h2>
            <ul style={{ margin: ".25rem 0", paddingLeft: "1.1rem" }}>
              <li>{entries.length} total scans across {groups.length} tracked spot(s).</li>
              <li>
                {groups.filter((g) => g.trend === "worsening").length} spot(s)
                trending worse, {groups.filter((g) => g.trend === "improving").length}{" "}
                improving, {groups.filter((g) => g.trend === "stable").length} stable.
              </li>
              <li>
                {alerts.filter((a) => a.level === "high").length} high-priority
                flag(s) for review.
              </li>
            </ul>
          </section>

          {/* Flags */}
          {alerts.length > 0 && (
            <section style={{ marginBottom: "1.25rem" }}>
              <h2 className="font-semibold">Flagged for review</h2>
              <ul style={{ margin: ".25rem 0", paddingLeft: "1.1rem" }}>
                {alerts.map((a, i) => (
                  <li key={i}>
                    <strong>{a.level === "high" ? "🚩 " : "👀 "}{a.title}.</strong>{" "}
                    {a.detail}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Per spot */}
          <section>
            <h2 className="font-semibold">Tracked spots</h2>
            {groups.map((g) => {
              const latest = g.entries[g.entries.length - 1];
              const first = g.entries[0];
              return (
                <div
                  key={g.key}
                  style={{
                    border: "1px solid var(--card-border)",
                    borderRadius: ".75rem",
                    padding: ".9rem",
                    marginTop: ".75rem",
                    breakInside: "avoid",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: ".5rem" }}>
                    <h3 style={{ margin: 0 }}>
                      {g.region}
                      {g.spotLabel !== "(unlabeled)" ? ` — ${g.spotLabel}` : ""}
                    </h3>
                    <span className="text-sm text-gray-600">
                      {g.entries.length} scan(s)
                      {g.daysTracked > 0 ? `, ${g.daysTracked} day(s)` : ""} ·
                      severity {Math.round(first.analysis.severityScore)} →{" "}
                      {Math.round(latest.analysis.severityScore)} (
                      {g.trend})
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: ".5rem", marginTop: ".6rem", flexWrap: "wrap" }}>
                    {g.entries.map((e) => (
                      <figure key={e.id} style={{ margin: 0, width: 110 }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={e.imageThumb}
                          alt="scan"
                          style={{ width: 110, height: 90, objectFit: "cover", borderRadius: ".4rem" }}
                        />
                        <figcaption className="text-sm" style={{ color: "#64748b" }}>
                          {new Date(e.at).toLocaleDateString()} ·{" "}
                          <span style={{ color: labelColor(e.analysis.label) }}>
                            {e.analysis.label}
                          </span>
                        </figcaption>
                      </figure>
                    ))}
                  </div>

                  <p style={{ margin: ".6rem 0 .2rem" }}>
                    <strong>Latest observation:</strong> {latest.analysis.description}
                  </p>
                  {latest.analysis.concernFlags.length > 0 && (
                    <p style={{ margin: ".2rem 0", color: "#92400e" }}>
                      <strong>Flags:</strong> {latest.analysis.concernFlags.join(", ")}
                    </p>
                  )}
                  {[...new Set(g.entries.flatMap((e) => (e.notes ? [e.notes] : [])))].length > 0 && (
                    <p style={{ margin: ".2rem 0", color: "#475569" }}>
                      <strong>Patient notes:</strong>{" "}
                      {[...new Set(g.entries.flatMap((e) => (e.notes ? [e.notes] : [])))].join(" · ")}
                    </p>
                  )}
                </div>
              );
            })}
          </section>

          <footer style={{ marginTop: "1.5rem", paddingTop: ".75rem", borderTop: "1px solid var(--card-border)", color: "#64748b", fontSize: ".8rem" }}>
            Generated by Varyn. These are AI-assisted informational observations,
            not a medical diagnosis. Severity scores reflect visual prominence
            only. Please interpret in clinical context.
          </footer>
        </div>
      )}
    </div>
  );
}
