"use client";
import { Entry, SeverityLabel } from "./types";

// localStorage-backed persistence, scoped per signed-in user email.
// Entries persist across sessions on the same browser/device.

function keyFor(email: string) {
  return `varyn_entries:${email.toLowerCase()}`;
}

export function getCurrentUser(): { email: string; name?: string } | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem("varyn_user");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getEntries(email: string): Entry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(keyFor(email));
    if (!raw) return [];
    const list = JSON.parse(raw) as Entry[];
    return list.sort((a, b) => b.at.localeCompare(a.at));
  } catch {
    return [];
  }
}

export function saveEntry(email: string, entry: Entry): void {
  if (typeof window === "undefined") return;
  const list = getEntries(email);
  list.unshift(entry);
  localStorage.setItem(keyFor(email), JSON.stringify(list));
}

export function deleteEntry(email: string, id: string): void {
  if (typeof window === "undefined") return;
  const list = getEntries(email).filter((e) => e.id !== id);
  localStorage.setItem(keyFor(email), JSON.stringify(list));
}

export function clearEntries(email: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(keyFor(email));
}

// ---- Pattern detection helpers ----

export type Trend = "worsening" | "improving" | "stable" | "single";

export type RegionGroup = {
  key: string; // region + spot label
  region: string;
  spotLabel: string;
  entries: Entry[]; // chronological, oldest first
  trend: Trend;
  severityDelta: number; // latest minus first
  firstSeverity: number;
  latestSeverity: number;
  daysTracked: number;
  flagCounts: Record<string, number>;
};

export function groupBySpot(entries: Entry[]): RegionGroup[] {
  const map = new Map<string, Entry[]>();
  for (const e of entries) {
    const spot = e.spotLabel?.trim() || "(unlabeled)";
    const key = `${e.region}::${spot}`;
    const arr = map.get(key) ?? [];
    arr.push(e);
    map.set(key, arr);
  }

  const groups: RegionGroup[] = [];
  for (const [key, arr] of map.entries()) {
    const chron = [...arr].sort((a, b) => a.at.localeCompare(b.at));
    const first = chron[0];
    const latest = chron[chron.length - 1];
    const firstSeverity = first.analysis.severityScore;
    const latestSeverity = latest.analysis.severityScore;
    const severityDelta = latestSeverity - firstSeverity;

    let trend: Trend = "single";
    if (chron.length > 1) {
      if (severityDelta >= 12) trend = "worsening";
      else if (severityDelta <= -12) trend = "improving";
      else trend = "stable";
    }

    const flagCounts: Record<string, number> = {};
    for (const e of chron) {
      for (const f of e.analysis.concernFlags ?? []) {
        flagCounts[f] = (flagCounts[f] ?? 0) + 1;
      }
    }

    const daysTracked = Math.max(
      0,
      Math.round(
        (new Date(latest.at).getTime() - new Date(first.at).getTime()) /
          86400000
      )
    );

    const [region, spotLabel] = key.split("::");
    groups.push({
      key,
      region,
      spotLabel,
      entries: chron,
      trend,
      severityDelta,
      firstSeverity,
      latestSeverity,
      daysTracked,
      flagCounts,
    });
  }

  // Most actionable groups first: worsening, then concerning severity, then recency.
  return groups.sort((a, b) => {
    const rank = (g: RegionGroup) =>
      (g.trend === "worsening" ? 1000 : 0) + g.latestSeverity;
    return rank(b) - rank(a);
  });
}

export type Alert = {
  level: "high" | "watch";
  title: string;
  detail: string;
};

// Surface concerns: high-severity entries, worsening trends, and recurring flags.
export function buildAlerts(entries: Entry[]): Alert[] {
  const alerts: Alert[] = [];
  const groups = groupBySpot(entries);

  for (const g of groups) {
    const where = `${g.region}${
      g.spotLabel !== "(unlabeled)" ? ` — ${g.spotLabel}` : ""
    }`;

    if (g.latestSeverity >= 70) {
      alerts.push({
        level: "high",
        title: `High severity at ${where}`,
        detail: `Latest scan scored ${Math.round(
          g.latestSeverity
        )}/100. Worth showing a clinician.`,
      });
    }

    if (g.trend === "worsening") {
      alerts.push({
        level: g.latestSeverity >= 60 ? "high" : "watch",
        title: `Worsening trend at ${where}`,
        detail: `Severity rose ${Math.round(
          g.severityDelta
        )} points over ${g.daysTracked} day(s) across ${
          g.entries.length
        } scans.`,
      });
    }

    const recurring = Object.entries(g.flagCounts).filter(([, c]) => c >= 2);
    for (const [flag, count] of recurring) {
      alerts.push({
        level: "watch",
        title: `Recurring observation at ${where}`,
        detail: `"${flag}" noted in ${count} scans.`,
      });
    }
  }

  // High alerts first.
  return alerts.sort((a, b) => (a.level === "high" ? -1 : 1) - (b.level === "high" ? -1 : 1));
}

export function labelColor(label: SeverityLabel | string): string {
  switch (label) {
    case "Concerning":
      return "#dc2626";
    case "Moderate":
      return "#ea7a23";
    case "Mild":
      return "#d4a017";
    case "Clear":
      return "#16a34a";
    default:
      return "#64748b";
  }
}

export function severityColor(score: number): string {
  if (score >= 70) return "#dc2626";
  if (score >= 45) return "#ea7a23";
  if (score >= 20) return "#d4a017";
  return "#16a34a";
}
