import Link from "next/link";

export default function Home() {
  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <section className="hero card">
        <h1 className="text-xl font-semibold" style={{ fontSize: "1.6rem", marginBottom: ".5rem" }}>
          Track your skin, one photo at a time.
        </h1>
        <p className="text-gray-700" style={{ maxWidth: 640, marginTop: 0 }}>
          Snap a photo of a skin spot, rash, or mole. Varyn uses AI to write an
          objective description and severity reading, then keeps a private,
          dated journal so you can see how it changes over time — and hand your
          doctor a clear report.
        </p>
        <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem", flexWrap: "wrap" }}>
          <Link href="/capture" className="btn">
            Take a photo
          </Link>
          <Link href="/dashboard" className="btn secondary">
            Open dashboard
          </Link>
          <Link href="/login" className="btn ghost">
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid grid-2" style={{ gap: "1rem" }}>
        <FeatureCard
          emoji="📷"
          title="Capture & describe"
          body="Photograph a spot and get a plain-language AI description with a severity score — no jargon, no guesswork."
        />
        <FeatureCard
          emoji="📈"
          title="See patterns over time"
          body="Re-scan the same spot with a label and Varyn charts how it changes — improving, stable, or worsening."
        />
        <FeatureCard
          emoji="🚩"
          title="Automatic flagging"
          body="Warning signs and worsening trends are flagged automatically so nothing slips by unnoticed."
        />
        <FeatureCard
          emoji="🩺"
          title="Doctor-ready report"
          body="One click builds a printable summary of every tracked spot, its timeline, and flagged concerns."
        />
      </section>

      <p className="text-sm text-gray-600" style={{ margin: 0 }}>
        Your photos and notes stay in this browser only. Varyn is informational
        and does not diagnose conditions.
      </p>
    </div>
  );
}

function FeatureCard({
  emoji,
  title,
  body,
}: {
  emoji: string;
  title: string;
  body: string;
}) {
  return (
    <div className="card">
      <div style={{ fontSize: "1.6rem" }}>{emoji}</div>
      <h3 className="font-semibold" style={{ margin: ".4rem 0" }}>
        {title}
      </h3>
      <p className="text-sm text-gray-700" style={{ margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
