"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import CaptureForm from "../../components/CaptureForm";
import { getCurrentUser, saveEntry } from "../../lib/storage";

export default function CapturePage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const u = getCurrentUser();
    if (!u) {
      router.replace("/login");
      return;
    }
    setEmail(u.email);
  }, [router]);

  if (!email) return null;

  return (
    <div className="grid" style={{ gap: "1rem" }}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 className="text-xl font-semibold">New scan</h1>
          <div className="text-sm text-gray-600">
            Photograph a spot, analyze it, and save it to your journal.
          </div>
        </div>
        <Link href="/timeline" className="btn ghost">
          View timeline
        </Link>
      </div>

      {saved && (
        <div className="card" style={{ borderLeft: "4px solid #22c55e" }}>
          <span style={{ color: "#065f46" }}>
            Saved to your journal.{" "}
            <Link href="/timeline" style={{ textDecoration: "underline" }}>
              See it on the timeline
            </Link>{" "}
            or scan another spot below.
          </span>
        </div>
      )}

      <CaptureForm
        onSaved={(entry) => {
          saveEntry(email, entry);
          setSaved(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />
    </div>
  );
}
