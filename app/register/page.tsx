"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export default function RegisterPage() {
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [name, setName] = useState(""); const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  useEffect(()=>{ const u = typeof window!=="undefined" ? sessionStorage.getItem("varyn_user") : null; if (u) router.replace("/dashboard"); }, [router]);
  function onSubmit(e: React.FormEvent){ e.preventDefault(); setError(null);
    if(!email || !password){ setError("Email and password required."); return; }
    const store = JSON.parse(sessionStorage.getItem("varyn_users")||"{}");
    if(store[email]){ setError("User already exists. Try logging in."); return; }
    store[email] = { email, password, name }; sessionStorage.setItem("varyn_users", JSON.stringify(store));
    // Do not auto-login; require explicit sign-in
    router.push("/login?created=1"); }
  return (<div className="card" style={{maxWidth:480}}>
    <h1 className="text-xl font-semibold">Create account</h1>
    <form onSubmit={onSubmit} className="grid gap-3 mt-4">
      <div><label className="label">Name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} placeholder="Your name"/></div>
      <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div>
      <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div>
      {error && <p style={{color:"crimson"}}>{error}</p>}<button className="btn">Register</button>
    </form></div>);
}
