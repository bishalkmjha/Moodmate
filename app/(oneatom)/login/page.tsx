"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "sign_in" | "sign_up" | "verify_otp";

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  async function sendVerificationCode(targetEmail: string) {
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email: targetEmail });
    setPendingEmail(targetEmail);
    setOtp("");
    setMode("verify_otp");
    setInfo("We sent a 6-digit code to your email. Enter it below to verify your account.");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "verify_otp") {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email: pendingEmail,
        token: otp,
        type: "signup",
      });
      setLoading(false);
      if (verifyError) {
        setError(verifyError.message);
        return;
      }
      router.push("/onboarding");
      router.refresh();
      return;
    }

    if (mode === "sign_up") {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (!data.session) {
        setPendingEmail(email);
        setOtp("");
        setMode("verify_otp");
        setInfo("Account created. We sent a 6-digit code to your email — enter it below to verify.");
        return;
      }
      router.push("/onboarding");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      if (signInError.message.toLowerCase().includes("email not confirmed")) {
        await sendVerificationCode(email);
        return;
      }
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function handleResend() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error: resendError } = await supabase.auth.resend({ type: "signup", email: pendingEmail });
    setLoading(false);
    if (resendError) {
      setError(resendError.message);
      return;
    }
    setInfo("Sent a new code.");
  }

  if (mode === "verify_otp") {
    return (
      <div className="mx-auto flex max-w-sm flex-col items-center gap-6 pt-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="mt-1 text-sm text-slate-400">
            Enter the 6-digit code we sent to <span className="text-slate-200">{pendingEmail}</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="workout-card w-full space-y-4 p-6">
          <div>
            <label htmlFor="otp" className="mb-1 block text-sm font-medium text-slate-200">
              Verification code
            </label>
            <input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              required
              minLength={6}
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-center text-lg tracking-[0.5em] text-slate-100 outline-none focus:border-amber-500"
              placeholder="000000"
            />
          </div>

          {error && <p className="text-sm text-rose-400">{error}</p>}
          {info && <p className="text-sm text-emerald-400">{info}</p>}

          <button type="submit" className="workout-btn-primary w-full" disabled={loading || otp.length !== 6}>
            {loading ? "Verifying..." : "Verify"}
          </button>
        </form>

        <div className="flex items-center gap-4 text-sm">
          <button className="text-slate-400 hover:text-slate-200" onClick={handleResend} disabled={loading}>
            Resend code
          </button>
          <button
            className="text-slate-400 hover:text-slate-200"
            onClick={() => {
              setMode("sign_in");
              setError(null);
              setInfo(null);
            }}
          >
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">
          {mode === "sign_in" ? "Welcome back" : "Start your streak"}
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          A full-body plan that adapts to you, plus the habits to keep showing up.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="workout-card w-full space-y-4 p-6">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-slate-200">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-slate-200">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
          />
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}
        {info && <p className="text-sm text-emerald-400">{info}</p>}

        <button type="submit" className="workout-btn-primary w-full" disabled={loading}>
          {loading ? "Please wait..." : mode === "sign_in" ? "Sign in" : "Create account"}
        </button>
      </form>

      <button
        className="text-sm text-slate-400 hover:text-slate-200"
        onClick={() => {
          setMode(mode === "sign_in" ? "sign_up" : "sign_in");
          setError(null);
          setInfo(null);
        }}
      >
        {mode === "sign_in" ? "New here? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
