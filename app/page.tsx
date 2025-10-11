import Link from "next/link";

export default function Home() {
  return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'70vh'}}>
      <div className="card" style={{textAlign:'center', padding:'2rem 2.25rem'}}>
        <h1 className="text-xl font-semibold" style={{marginBottom:'0.75rem'}}>Welcome to VARYN</h1>
        <div style={{display:'flex', gap:'0.75rem', justifyContent:'center'}}>
          <Link href="/register" className="btn">Sign up</Link>
          <Link href="/login" className="btn secondary">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
