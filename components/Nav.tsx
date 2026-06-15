"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/capture", label: "New scan" },
  { href: "/timeline", label: "Timeline" },
  { href: "/report", label: "Report" },
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    setAuthed(!!sessionStorage.getItem("varyn_user"));
  }, [pathname]);

  function signOut() {
    sessionStorage.removeItem("varyn_user");
    router.replace("/login");
  }

  return (
    <nav
      className="mx-auto max-w-5xl px-4 py-3"
      style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: ".75rem" }}
    >
      <Link href="/" className="brand">
        <span className="brand-mark">V</span>
        Varyn
      </Link>
      <div className="navlinks">
        {authed &&
          LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`navlink${pathname === l.href ? " active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        {authed ? (
          <button className="btn ghost sm" style={{ marginLeft: ".4rem" }} onClick={signOut}>
            Sign out
          </button>
        ) : (
          <Link href="/login" className="btn sm" style={{ marginLeft: ".4rem" }}>
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
