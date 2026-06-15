import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "Varyn — Skin Symptom Tracker",
  description:
    "Photograph, describe, and track skin changes over time, with AI observations and a doctor-ready report.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className="min-h-screen bg-gray-50 text-gray-900"
        style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
      >
        <header className="hdr">
          <nav
            className="mx-auto max-w-5xl px-4 py-3"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Link
              href="/"
              className="font-semibold"
              style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  background: "linear-gradient(135deg,#0ea5e9,#7c3aed)",
                }}
              />
              Varyn
            </Link>
            <div
              className="space-x-3 text-sm"
              style={{ display: "flex", gap: "0.9rem" }}
            >
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/capture">New scan</Link>
              <Link href="/timeline">Timeline</Link>
              <Link href="/report">Report</Link>
            </div>
          </nav>
        </header>
        <main
          className="mx-auto max-w-5xl px-4 py-8"
          style={{ flex: "1 1 auto", width: "100%" }}
        >
          {children}
        </main>
        <footer
          className="mx-auto max-w-5xl px-4"
          style={{ width: "100%", padding: "1rem", color: "#64748b", fontSize: ".8rem" }}
        >
          Varyn provides informational observations only and cannot diagnose
          medical conditions. Always consult a qualified clinician.
        </footer>
      </body>
    </html>
  );
}
