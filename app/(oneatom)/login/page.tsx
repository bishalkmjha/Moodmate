"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const { error: signInError } = await supabase.auth.signInAnonymously();
    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    if (email) {
      await supabase.auth.updateUser({ data: { contact_email: email } });
    }

    setLoading(false);
    router.push("/onboarding");
    router.refresh();
  }

  return (
    <div className="mx-auto flex max-w-sm flex-col items-center gap-6 pt-10">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Start your streak</h1>
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
            placeholder="you@example.com"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100 outline-none focus:border-amber-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Just for updates — no password, no verification needed.
          </p>
        </div>

        {error && <p className="text-sm text-rose-400">{error}</p>}

        <button type="submit" className="workout-btn-primary w-full" disabled={loading}>
          {loading ? "Please wait..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
