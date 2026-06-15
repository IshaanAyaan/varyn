import Link from "next/link";

export default function Home() {
  return (
    <div className="grid" style={{ gap: "1.5rem" }}>
      <section className="hero">
        <span className="badge" style={{ color: "var(--primary)", marginBottom: "1rem" }}>
          AI skin journal
        </span>
        <h1 style={{ fontSize: "2rem", margin: "0 0 .6rem", maxWidth: 620 }}>
          Track your skin, one photo at a time.
        </h1>
        <p className="text-gray-700" style={{ maxWidth: 540, margin: "0 0 1.4rem", fontSize: "1.02rem" }}>
          Photograph a spot, get a clear read on it, and watch how it changes —
          then hand your doctor a tidy report.
        </p>
        <div className="row wrap" style={{ gap: ".6rem" }}>
          <Link href="/capture" className="btn">
            Take a photo
          </Link>
          <Link href="/login" className="btn secondary">
            Sign in
          </Link>
        </div>
      </section>

      <section className="grid grid-4" style={{ gap: "1rem" }}>
        <Feature icon="📷" title="Capture" body="Snap a spot, get a plain-language read and severity score." />
        <Feature icon="📈" title="Track" body="Re-scan over time and see the trend at a glance." />
        <Feature icon="🚩" title="Get flagged" body="Warning signs and worsening spots surface automatically." />
        <Feature icon="🩺" title="Report" body="One tap builds a printable summary for your doctor." />
      </section>

      <p className="text-sm text-gray-600" style={{ margin: 0 }}>
        Informational only, not a diagnosis.
      </p>
    </div>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div className="card card-link">
      <div
        style={{
          width: 40, height: 40, borderRadius: 10,
          background: "var(--primary-soft)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.25rem", marginBottom: ".7rem",
        }}
      >
        {icon}
      </div>
      <h3 className="font-semibold" style={{ margin: "0 0 .3rem", fontSize: "1rem" }}>
        {title}
      </h3>
      <p className="text-sm text-gray-600" style={{ margin: 0 }}>
        {body}
      </p>
    </div>
  );
}
