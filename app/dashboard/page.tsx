"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  buildAlerts,
  getCurrentUser,
  getEntries,
  groupBySpot,
  labelColor,
  severityColor,
} from "../../lib/storage";
import { Entry } from "../../lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string } | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [apiReady, setApiReady] = useState<boolean | null>(null);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setUser(u);
    setEntries(getEntries(u.email));
  }, [router]);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/status");
        const j = await r.json();
        setApiReady(!!j.hasKey);
      } catch {
        setApiReady(false);
      }
    })();
  }, []);

  const alerts = useMemo(() => buildAlerts(entries), [entries]);
  const groups = useMemo(() => groupBySpot(entries), [entries]);

  const byDay = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of entries) {
      const day = e.at.slice(0, 10);
      m.set(day, (m.get(day) ?? 0) + 1);
    }
    return Array.from(m.entries())
      .map(([day, count]) => ({ day: day.slice(5), count }))
      .sort((a, b) => a.day.localeCompare(b.day));
  }, [entries]);

  if (!user) return null;

  return (
    <div className="grid" style={{ gap: "1.25rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem" }}>
        <div>
          <h1 className="text-xl font-semibold">Dashboard</h1>
          <div className="text-sm text-gray-600">Signed in as {user.email}</div>
        </div>
        <div style={{ display: "flex", gap: ".5rem", alignItems: "center" }}>
          <Link href="/capture" className="btn">
            + New scan
          </Link>
          <button
            className="btn ghost"
            onClick={() => {
              sessionStorage.removeItem("varyn_user");
              window.location.href = "/login";
            }}
          >
            Sign out
          </button>
        </div>
      </div>

      {/* Status + quick stats */}
      <div className="grid grid-2" style={{ gap: "1rem" }}>
        <StatCard label="Total scans" value={entries.length} />
        <StatCard label="Spots tracked" value={groups.length} />
      </div>

      <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div className="font-semibold">AI image analysis</div>
          <div className="text-sm text-gray-600">
            {apiReady === null
              ? "Checking…"
              : apiReady
              ? "Gemini connected"
              : "No Gemini key — using offline preview"}
          </div>
        </div>
        <span
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: 9999,
            background:
              apiReady === null ? "#f59e0b" : apiReady ? "#22c55e" : "#f59e0b",
          }}
        />
      </div>

      {/* Alerts / flagged */}
      <div className="card">
        <h2 className="font-semibold" style={{ marginTop: 0 }}>
          Flagged & patterns
        </h2>
        {alerts.length === 0 ? (
          <p className="text-sm text-gray-600" style={{ margin: 0 }}>
            Nothing flagged yet. Re-scan the same spot over time so Varyn can
            detect changes.
          </p>
        ) : (
          <div className="grid" style={{ gap: ".5rem" }}>
            {alerts.map((a, i) => (
              <div
                key={i}
                className={a.level === "high" ? "caution-card" : "card"}
                style={
                  a.level === "high"
                    ? { borderLeftColor: "#ef4444", borderLeft: "4px solid #ef4444" }
                    : { borderLeft: "4px solid #f59e0b" }
                }
              >
                <div style={{ fontWeight: 600 }}>
                  {a.level === "high" ? "🚩 " : "👀 "}
                  {a.title}
                </div>
                <div className="text-sm text-gray-700">{a.detail}</div>
              </div>
            ))}
            <Link href="/report" className="text-sm" style={{ textDecoration: "underline" }}>
              Build a doctor-ready report →
            </Link>
          </div>
        )}
      </div>

      {/* Activity chart */}
      {entries.length > 0 && (
        <div className="card">
          <h3 className="font-semibold" style={{ marginTop: 0 }}>
            Scans per day
          </h3>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={byDay}>
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Recent entries */}
      <div className="card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="font-semibold" style={{ margin: 0 }}>
            Recent scans
          </h2>
          <Link href="/timeline" className="text-sm" style={{ textDecoration: "underline" }}>
            View timeline →
          </Link>
        </div>
        {entries.length === 0 ? (
          <p className="text-sm text-gray-600">
            No scans yet.{" "}
            <Link href="/capture" style={{ textDecoration: "underline" }}>
              Take your first photo
            </Link>
            .
          </p>
        ) : (
          <div className="grid grid-2" style={{ gap: ".75rem", marginTop: ".75rem" }}>
            {entries.slice(0, 4).map((e) => (
              <div key={e.id} style={{ display: "flex", gap: ".75rem", alignItems: "center" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={e.imageThumb}
                  alt="scan"
                  style={{ width: 64, height: 64, objectFit: "cover", borderRadius: ".6rem" }}
                />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>
                    {e.region}
                    {e.spotLabel ? ` — ${e.spotLabel}` : ""}
                  </div>
                  <div className="text-sm text-gray-600">
                    {new Date(e.at).toLocaleString()}
                  </div>
                  <div style={{ display: "flex", gap: ".4rem", alignItems: "center", marginTop: ".2rem" }}>
                    <span
                      className="severity-badge"
                      style={{ color: labelColor(e.analysis.label), fontSize: ".8rem" }}
                    >
                      {e.analysis.label}
                    </span>
                    <span style={{ fontSize: ".8rem", color: severityColor(e.analysis.severityScore) }}>
                      {Math.round(e.analysis.severityScore)}/100
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: ".2rem" }}>
      <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{value}</div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
