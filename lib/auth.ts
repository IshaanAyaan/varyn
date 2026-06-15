"use client";

// Master access code for quick demo entry. Logging in with this code (in the
// password field, or via the one-tap button) drops you straight into a shared
// demo workspace without registering.
export const MASTER_CODE = "VARYN-DEMO";

export const DEMO_USER = { email: "demo@varyn.app", name: "Demo" };

export function signInDemo() {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("varyn_user", JSON.stringify(DEMO_USER));
  }
}
