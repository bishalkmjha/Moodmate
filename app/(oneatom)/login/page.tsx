"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [mode, setMode] = useState<"sign_in" | "sign_up">("sign_in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    const supabase = createClient();

    if (mode === "sign_up") {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      setInfo("Account created. Redirecting you to set up your profile...");
      router.push("/onboarding");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
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
