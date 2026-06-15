"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("varyn_user")) {
      router.replace("/dashboard");
    }
  }, [router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Email and password required.");
      return;
    }
    const store = JSON.parse(sessionStorage.getItem("varyn_users") || "{}");
    if (store[email]) {
      setError("User already exists. Try logging in.");
      return;
    }
    store[email] = { email, password, name };
    sessionStorage.setItem("varyn_users", JSON.stringify(store));
    router.push("/login?created=1");
  }

  return (
    <div className="card" style={{ maxWidth: 420, margin: "1.5rem auto 0" }}>
      <h1 className="text-xl font-semibold" style={{ margin: "0 0 1rem" }}>
        Create account
      </h1>
      <form onSubmit={onSubmit} className="grid" style={{ gap: ".85rem" }}>
        <div>
          <label className="label">Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        {error && <p className="text-sm" style={{ color: "var(--concerning)", margin: 0 }}>{error}</p>}
        <button className="btn" style={{ width: "100%" }}>Register</button>
      </form>
      <p className="text-sm text-gray-600" style={{ marginTop: ".9rem", marginBottom: 0 }}>
        Have an account?{" "}
        <Link href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
