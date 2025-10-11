import "./globals.css";
import Link from "next/link";
import { ReactNode } from "react";

export const metadata = {
  title: "VARYN",
  description: "VARYN demo app with local auth and dashboard."
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900" style={{display:'flex',flexDirection:'column',minHeight:'100vh'}}>
        <header className="hdr">
          <nav className="mx-auto max-w-5xl px-4 py-3" style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <Link href="/" className="font-semibold" style={{display:'flex',alignItems:'center',gap:'.5rem'}}>
              <span style={{
                display:'inline-block', width:24, height:24, borderRadius:6,
                background:'linear-gradient(135deg,#0ea5e9,#7c3aed)'
              }} />
              VARYN
            </Link>
            <div className="space-x-3 text-sm" style={{display:'flex',gap:'0.75rem'}}>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/login">Login</Link>
              <Link href="/register">Register</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8" style={{flex:'1 1 auto', width:'100%'}}>
          {children}
        </main>
      </body>
    </html>
  )
}
