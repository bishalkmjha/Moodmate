import Link from "next/link";
import { redirect } from "next/navigation";
import { requireWorkoutUser } from "@/lib/workout/auth";
import { bmiCategory, calculateBMI, estimateSessionMinutes } from "@/lib/workout/adaptive-engine";
import { getExerciseById } from "@/lib/workout/exercise-library";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";
import { getOrCreateTodaySession, resolveCurrentTier } from "@/lib/workout/session-service";
import type { PlannedExercise } from "@/lib/workout/types";
import { MorningRoutineCard } from "./_components/MorningRoutineCard";

export default async function WorkoutDashboardPage() {
  const { supabase, user } = await requireWorkoutUser();

  const { data: profile } = await supabase
    .from("workout_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/workout/onboarding");
  }

  const today = todayISODate();
  const currentTier = await resolveCurrentTier(supabase, user.id, profile.fitness_tier);
  const session = await getOrCreateTodaySession(supabase, user.id, profile, currentTier);

  const plan = (session?.plan as unknown as PlannedExercise[]) ?? [];
  const estimatedMinutes = estimateSessionMinutes(plan);
  const mainExercises = plan.filter((p) => p.role === "main");

  // --- Streaks -------------------------------------------------------------
  const { data: completedSessions } = await supabase
    .from("workout_sessions")
    .select("session_date")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("session_date", { ascending: false })
    .limit(60);
  const workoutStreak = calculateStreak((completedSessions ?? []).map((s) => s.session_date));

  const { data: morningLogs } = await supabase
    .from("morning_routine_logs")
    .select("log_date, completed, move_minutes, reflect_minutes, grow_minutes")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(60);
  const morningStreak = calculateStreak(
    (morningLogs ?? []).filter((l) => l.completed).map((l) => l.log_date),
  );
  const todayMorningLog = (morningLogs ?? []).find((l) => l.log_date === today) ?? null;

  const bmi = calculateBMI(profile.height_cm, profile.weight_kg);

  return (
    <div className="space-y-6">
      <section className="workout-card p-6">
        <p className="text-sm text-amber-400">{profile.identity_statement ?? "I am someone who trains."}</p>
        <h1 className="mt-1 text-2xl font-bold">
          {session?.status === "completed" ? "Today's session is done. Nice work." : "Today's full-body session"}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="workout-chip capitalize">{currentTier} tier</span>
          <span className="workout-chip">
            BMI {bmi} · {bmiCategory(bmi)}
          </span>
          <span className="workout-chip">~{estimatedMinutes} min</span>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/workout/train"
            className="workout-btn-primary px-5 py-2.5"
            aria-disabled={session?.status === "completed"}
          >
            {session?.status === "completed" ? "Review session" : "Start training"}
          </Link>
          <Link href="/workout/library" className="workout-btn-outline px-5 py-2.5">
            Browse library
          </Link>
        </div>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {mainExercises.map((item) => {
            const exercise = getExerciseById(item.exerciseId);
            if (!exercise) return null;
            return (
              <li
                key={item.exerciseId}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2 text-sm"
              >
                <span>{exercise.name}</span>
                <span className="text-slate-400">
                  {item.targetSets} × {item.targetReps}
                  {exercise.isTimeBased ? "s" : ""}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Workout streak</span>
          <span className="text-3xl font-bold">{workoutStreak} 🔥</span>
          <span className="text-xs text-slate-500">consecutive days trained</span>
        </div>
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Morning routine streak</span>
          <span className="text-3xl font-bold">{morningStreak} 🌅</span>
          <span className="text-xs text-slate-500">consecutive 20/20/20 days</span>
        </div>
      </section>

      <MorningRoutineCard
        userId={user.id}
        today={today}
        wakeTime={profile.wake_time}
        initialMinutes={{
          move: todayMorningLog?.move_minutes ?? 0,
          reflect: todayMorningLog?.reflect_minutes ?? 0,
          grow: todayMorningLog?.grow_minutes ?? 0,
        }}
      />
    </div>
  );
}
