"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
export default function LoginPage(){
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [error,setError]=useState<string|null>(null); const [notice,setNotice]=useState<string|null>(null);
  const router=useRouter();
  useEffect(()=>{
    const u = typeof window!=="undefined" ? sessionStorage.getItem("varyn_user") : null;
    if(u) router.replace("/dashboard");
    // success message after signup
    if (typeof window!=="undefined") {
      const u = new URLSearchParams(window.location.search);
      if (u.get("created") === "1") setNotice("Account created. Please sign in.");
    }
  },[router]);
  function onSubmit(e:React.FormEvent){ e.preventDefault(); setError(null);
    const store=JSON.parse(sessionStorage.getItem("varyn_users")||"{}"); const rec=store[email];
    if(!rec || rec.password!==password){ setError("Invalid credentials or account not found."); return; }
    sessionStorage.setItem("varyn_user", JSON.stringify({ email, name: rec.name })); router.push("/dashboard"); }
  return (<div className="card" style={{maxWidth:480}}>
    <h1 className="text-xl font-semibold">Sign in</h1>
    <form onSubmit={onSubmit} className="grid gap-3 mt-4">
      <div><label className="label">Email</label><input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" required/></div>
      <div><label className="label">Password</label><input className="input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required/></div>
      {notice && <p className="text-sm" style={{color:'#065f46'}}>{notice}</p>}
      {error && <p style={{color:"crimson"}}>{error}</p>}
      <button className="btn">Sign in</button>
    </form>
    <p className="text-sm" style={{marginTop:"0.75rem"}}>No account? <a href="/register" className="hover:underline">Register</a></p>
  </div>); }
