"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  deleteEntry,
  getCurrentUser,
  getEntries,
  groupBySpot,
  labelColor,
  RegionGroup,
  severityColor,
  Trend,
} from "../../lib/storage";
import { Entry } from "../../lib/types";

const TREND_META: Record<Trend, { label: string; color: string; emoji: string }> = {
  worsening: { label: "Worsening", color: "#ef4444", emoji: "↑" },
  improving: { label: "Improving", color: "#22c55e", emoji: "↓" },
  stable: { label: "Stable", color: "#64748b", emoji: "→" },
  single: { label: "Single scan", color: "#94a3b8", emoji: "•" },
};

export default function TimelinePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setEmail(u.email);
    setEntries(getEntries(u.email));
  }, [router]);

  const groups = useMemo(() => groupBySpot(entries), [entries]);

  function refresh() {
    if (email) setEntries(getEntries(email));
  }

  if (!email) return null;

  return (
    <div className="grid" style={{ gap: "1.25rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".75rem" }}>
        <div>
          <h1 className="text-xl font-semibold">Timeline</h1>
          <div className="text-sm text-gray-600">
            Your scans grouped by spot, oldest to newest.
          </div>
        </div>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/capture" className="btn">
            + New scan
          </Link>
          <Link href="/report" className="btn secondary">
            Build report
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <div className="card">
          <p className="text-sm text-gray-600" style={{ margin: 0 }}>
            No scans yet.{" "}
            <Link href="/capture" style={{ textDecoration: "underline" }}>
              Take your first photo
            </Link>
            . Use the same spot label each time to track changes.
          </p>
        </div>
      ) : (
        groups.map((g) => (
          <SpotGroup key={g.key} group={g} email={email} onChanged={refresh} />
        ))
      )}
    </div>
  );
}

function SpotGroup({
  group,
  email,
  onChanged,
}: {
  group: RegionGroup;
  email: string;
  onChanged: () => void;
}) {
  const trend = TREND_META[group.trend];
  const chartData = group.entries.map((e) => ({
    date: new Date(e.at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    severity: Math.round(e.analysis.severityScore),
  }));

  return (
    <div className="card grid" style={{ gap: "1rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: ".5rem" }}>
        <div>
          <h2 className="font-semibold" style={{ margin: 0 }}>
            {group.region}
            {group.spotLabel !== "(unlabeled)" ? ` — ${group.spotLabel}` : ""}
          </h2>
          <div className="text-sm text-gray-600">
            {group.entries.length} scan(s)
            {group.daysTracked > 0 ? ` over ${group.daysTracked} day(s)` : ""}
          </div>
        </div>
        <span
          className="badge"
          style={{ color: trend.color, borderColor: trend.color }}
        >
          {trend.emoji} {trend.label}
          {group.trend !== "single"
            ? ` (${group.severityDelta >= 0 ? "+" : ""}${Math.round(group.severityDelta)})`
            : ""}
        </span>
      </div>

      {group.entries.length > 1 && (
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <LineChart data={chartData}>
              <XAxis dataKey="date" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="severity"
                stroke={trend.color}
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Photo strip across time */}
      <div style={{ display: "flex", gap: ".75rem", overflowX: "auto", paddingBottom: ".25rem" }}>
        {group.entries.map((e) => (
          <div key={e.id} style={{ minWidth: 150, maxWidth: 150 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={e.imageThumb}
              alt="scan"
              style={{ width: 150, height: 120, objectFit: "cover", borderRadius: ".6rem" }}
            />
            <div className="text-sm" style={{ marginTop: ".35rem" }}>
              <div style={{ color: "#64748b" }}>
                {new Date(e.at).toLocaleDateString()}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".35rem", marginTop: ".2rem" }}>
                <span style={{ color: labelColor(e.analysis.label), fontWeight: 600 }}>
                  {e.analysis.label}
                </span>
                <span style={{ color: severityColor(e.analysis.severityScore) }}>
                  {Math.round(e.analysis.severityScore)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Per-scan detail */}
      <div className="grid" style={{ gap: ".6rem" }}>
        {[...group.entries].reverse().map((e) => (
          <div
            key={e.id}
            style={{
              borderTop: "1px solid var(--card-border)",
              paddingTop: ".6rem",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div className="text-sm" style={{ color: "#64748b" }}>
                {new Date(e.at).toLocaleString()}
              </div>
              <button
                className="btn ghost"
                style={{ padding: ".25rem .5rem", fontSize: ".8rem" }}
                onClick={() => {
                  if (confirm("Delete this scan?")) {
                    deleteEntry(email, e.id);
                    onChanged();
                  }
                }}
              >
                Delete
              </button>
            </div>
            <p style={{ margin: ".35rem 0" }}>{e.analysis.description}</p>
            {e.notes && (
              <p className="text-sm" style={{ margin: ".2rem 0", color: "#475569" }}>
                <strong>Your notes:</strong> {e.notes}
              </p>
            )}
            {e.analysis.concernFlags.length > 0 && (
              <div className="text-sm" style={{ color: "#92400e" }}>
                🚩 {e.analysis.concernFlags.join(" · ")}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
