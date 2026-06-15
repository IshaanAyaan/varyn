import "./globals.css";
import { ReactNode } from "react";
import Nav from "../components/Nav";

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
          <Nav />
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
