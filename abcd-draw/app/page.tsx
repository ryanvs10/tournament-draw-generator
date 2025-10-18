"use client";

import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code" | "done">("email");
  const [message, setMessage] = useState<string | null>(null);

  async function requestOtp() {
    setMessage(null);
    const res = await fetch("/api/auth/request-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (res.ok) {
      setStep("code");
      setMessage("Code sent. Check server logs in dev.");
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Failed to send code");
    }
  }

  async function verifyOtp() {
    setMessage(null);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (res.ok) {
      setStep("done");
      setMessage("Logged in.");
    } else {
      const data = await res.json();
      setMessage(data.error ?? "Failed to verify code");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">A-B-C-D Draw Generator</h1>
        {message && <div className="text-sm text-red-600">{message}</div>}
        {step === "email" && (
          <div className="space-y-3">
            <label className="block text-sm">Email</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <button className="w-full bg-black text-white rounded px-3 py-2" onClick={requestOtp}>
              Send code
            </button>
          </div>
        )}
        {step === "code" && (
          <div className="space-y-3">
            <label className="block text-sm">Enter code</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
            />
            <button className="w-full bg-black text-white rounded px-3 py-2" onClick={verifyOtp}>
              Verify
            </button>
          </div>
        )}
        {step === "done" && <div>Welcome! Continue to your dashboard (coming next).</div>}
      </div>
    </div>
  );
}
