"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MASTER_CODE, DEMO_USER, signInDemo } from "../../lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("varyn_user")) {
      router.replace("/dashboard");
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("created") === "1") setNotice("Account created — sign in below.");
  }, [router]);

  function enterDemo() {
    signInDemo();
    router.push("/dashboard");
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    // Master code works as the password for any email (or no email).
    if (password === MASTER_CODE) {
      signInDemo();
      router.push("/dashboard");
      return;
    }
    const store = JSON.parse(sessionStorage.getItem("varyn_users") || "{}");
    const rec = store[email];
    if (!rec || rec.password !== password) {
      setError("Invalid credentials or account not found.");
      return;
    }
    sessionStorage.setItem("varyn_user", JSON.stringify({ email, name: rec.name }));
    router.push("/dashboard");
  }

  return (
    <div className="grid" style={{ maxWidth: 420, margin: "1.5rem auto 0", gap: "1rem" }}>
      {/* Quick demo access */}
      <div className="card" style={{ borderColor: "var(--primary)", background: "var(--primary-soft)" }}>
        <div className="row between">
          <div>
            <div className="font-semibold">Quick access</div>
            <div className="text-sm text-gray-600">Jump straight into a demo workspace.</div>
          </div>
          <span className="badge" style={{ color: "var(--primary)", background: "#fff", fontFamily: "ui-monospace, monospace" }}>
            {MASTER_CODE}
          </span>
        </div>
        <button className="btn" style={{ width: "100%", marginTop: ".9rem" }} onClick={enterDemo}>
          Enter demo →
        </button>
      </div>

      {/* Standard sign in */}
      <div className="card">
        <h1 className="text-xl font-semibold" style={{ margin: "0 0 1rem" }}>
          Sign in
        </h1>
        <form onSubmit={onSubmit} className="grid" style={{ gap: ".85rem" }}>
          <div>
            <label className="label">Email</label>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="label">Password or access code</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {notice && <p className="text-sm" style={{ color: "var(--primary)", margin: 0 }}>{notice}</p>}
          {error && <p className="text-sm" style={{ color: "var(--concerning)", margin: 0 }}>{error}</p>}
          <button className="btn secondary" style={{ width: "100%" }}>Sign in</button>
        </form>
        <p className="text-sm text-gray-600" style={{ marginTop: ".9rem", marginBottom: 0 }}>
          No account?{" "}
          <Link href="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
