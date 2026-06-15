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
      {/* Header */}
      <div className="row between wrap">
        <div>
          <h1 className="text-xl font-semibold" style={{ margin: 0 }}>
            {greeting()}, {user.name || user.email.split("@")[0]}
          </h1>
          <div className="text-sm text-gray-600">Here's your skin overview.</div>
        </div>
        <Link href="/capture" className="btn">
          + New scan
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-3" style={{ gap: "1rem" }}>
        <StatCard value={entries.length} label="Scans logged" />
        <StatCard value={groups.length} label="Spots tracked" />
        <StatCard
          value={alerts.filter((a) => a.level === "high").length}
          label="Active flags"
          accent={alerts.some((a) => a.level === "high") ? "var(--concerning)" : undefined}
        />
      </div>

      {/* Empty state */}
      {entries.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
          <div style={{ fontSize: "2rem" }}>📷</div>
          <h2 className="font-semibold" style={{ margin: ".5rem 0 .25rem" }}>
            No scans yet
          </h2>
          <p className="text-sm text-gray-600" style={{ maxWidth: 360, margin: "0 auto 1.1rem" }}>
            Take a photo of a spot, rash, or mole. Varyn describes it and starts
            tracking how it changes over time.
          </p>
          <Link href="/capture" className="btn">
            Take your first photo
          </Link>
        </div>
      ) : (
        <>
          {/* Flags */}
          <div className="card">
            <div className="row between" style={{ marginBottom: ".75rem" }}>
              <h2 className="font-semibold" style={{ margin: 0 }}>
                Flagged & patterns
              </h2>
              <Link href="/report" className="text-sm" style={{ color: "var(--primary)", fontWeight: 600 }}>
                Build report →
              </Link>
            </div>
            {alerts.length === 0 ? (
              <p className="text-sm text-gray-600" style={{ margin: 0 }}>
                Nothing flagged. Re-scan the same spot over time so Varyn can spot
                changes.
              </p>
            ) : (
              <div className="grid" style={{ gap: ".5rem" }}>
                {alerts.map((a, i) => (
                  <div key={i} className={`caution-card ${a.level === "high" ? "flag" : ""}`}>
                    <div className="caution-title">
                      {a.level === "high" ? "🚩" : "👀"} {a.title}
                    </div>
                    <div className="text-sm text-gray-600" style={{ marginTop: ".15rem" }}>
                      {a.detail}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="grid grid-2" style={{ gap: "1rem" }}>
            <div className="card">
              <h3 className="font-semibold" style={{ marginTop: 0 }}>
                Scans per day
              </h3>
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer>
                  <BarChart data={byDay}>
                    <XAxis dataKey="day" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={24} />
                    <Tooltip cursor={{ fill: "var(--surface-2)" }} />
                    <Bar dataKey="count" fill="var(--primary)" radius={[5, 5, 0, 0]} maxBarSize={36} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent */}
            <div className="card">
              <div className="row between" style={{ marginBottom: ".5rem" }}>
                <h3 className="font-semibold" style={{ margin: 0 }}>
                  Recent
                </h3>
                <Link href="/timeline" className="text-sm" style={{ color: "var(--primary)", fontWeight: 600 }}>
                  Timeline →
                </Link>
              </div>
              <div className="grid" style={{ gap: ".6rem" }}>
                {entries.slice(0, 3).map((e) => (
                  <div key={e.id} className="row" style={{ gap: ".7rem" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={e.imageThumb}
                      alt="scan"
                      style={{ width: 52, height: 52, objectFit: "cover", borderRadius: 10, flex: "0 0 auto" }}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div className="font-semibold" style={{ fontSize: ".92rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {e.region}
                        {e.spotLabel ? ` — ${e.spotLabel}` : ""}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(e.at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className="badge" style={{ color: labelColor(e.analysis.label) }}>
                      {Math.round(e.analysis.severityScore)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* AI status footer chip */}
      <div className="row" style={{ gap: ".5rem", color: "var(--muted)", fontSize: ".82rem" }}>
        <span
          style={{
            width: 8, height: 8, borderRadius: "50%",
            background: apiReady === null ? "var(--mild)" : apiReady ? "var(--clear)" : "var(--mild)",
          }}
        />
        {apiReady === null
          ? "Checking AI…"
          : apiReady
          ? "AI connected"
          : "AI unavailable"}
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function StatCard({
  value,
  label,
  accent,
}: {
  value: number;
  label: string;
  accent?: string;
}) {
  return (
    <div className="card">
      <div className="stat-value" style={accent ? { color: accent } : undefined}>
        {value}
      </div>
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  );
}
