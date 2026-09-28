import type { ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { WorkoutNav } from "./_components/WorkoutNav";
import { SignOutButton } from "./_components/SignOutButton";

export const metadata = {
  title: "OneAtom — Moodmate",
  description: "Adaptive full-body training with Atomic Habits and 5AM Club routines.",
};

export default async function WorkoutLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="workout-shell">
      <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">
          <Link href="/workout" className="flex items-center gap-2">
            <div
              className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-400 to-orange-600"
              aria-hidden
            />
            <span className="text-base font-semibold">OneAtom</span>
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="workout-chip hover:bg-slate-700">
              Mood app
            </Link>
            {user ? (
              <SignOutButton />
            ) : (
              <Link href="/workout/login" className="workout-btn-primary px-3 py-1.5 text-sm">
                Sign in
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-6 sm:px-6">{children}</main>
      {user && <WorkoutNav />}
    </div>
  );
}
