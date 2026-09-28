import { redirect } from "next/navigation";
import { requireWorkoutUser } from "@/lib/workout/auth";
import { getExerciseById } from "@/lib/workout/exercise-library";
import { getOrCreateTodaySession, resolveCurrentTier } from "@/lib/workout/session-service";
import type { PlannedExercise } from "@/lib/workout/types";
import { SessionRunner, type RunnerExercise } from "./_components/SessionRunner";

export default async function TrainPage() {
  const { supabase, user } = await requireWorkoutUser();

  const { data: profile } = await supabase
    .from("workout_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) {
    redirect("/onboarding");
  }

  const currentTier = await resolveCurrentTier(supabase, user.id, profile.fitness_tier);
  const session = await getOrCreateTodaySession(supabase, user.id, profile, currentTier);

  if (!session) {
    redirect("/");
  }

  let { data: logs } = await supabase
    .from("session_exercise_logs")
    .select("*")
    .eq("session_id", session.id)
    .order("order_index", { ascending: true });

  if (!logs || logs.length === 0) {
    const plan = (session.plan as unknown as PlannedExercise[]) ?? [];
    if (plan.length > 0) {
      const rows = plan.map((item) => ({
        session_id: session.id,
        user_id: user.id,
        exercise_id: item.exerciseId,
        order_index: item.orderIndex,
        target_sets: item.targetSets,
        target_reps: item.targetReps,
      }));
      const { data: inserted } = await supabase
        .from("session_exercise_logs")
        .insert(rows)
        .select("*")
        .order("order_index", { ascending: true });
      logs = inserted ?? [];
    }
  }

  if (session.status === "planned") {
    await supabase
      .from("workout_sessions")
      .update({ status: "in_progress", started_at: new Date().toISOString() })
      .eq("id", session.id);
  }

  const plan = (session.plan as unknown as PlannedExercise[]) ?? [];
  const roleByExerciseId = new Map(plan.map((p) => [p.exerciseId, p.role]));

  const runnerExercises: RunnerExercise[] = (logs ?? [])
    .map((log) => {
      const exercise = getExerciseById(log.exercise_id);
      if (!exercise) return null;
      return {
        logId: log.id,
        exerciseId: log.exercise_id,
        name: exercise.name,
        cues: exercise.cues,
        isTimeBased: Boolean(exercise.isTimeBased),
        role: roleByExerciseId.get(log.exercise_id) ?? "main",
        targetSets: log.target_sets,
        targetReps: log.target_reps,
        completedSets: log.completed_sets,
        completedReps: log.completed_reps,
        weightKg: log.weight_kg,
        rpe: log.rpe,
        completed: log.completed,
      };
    })
    .filter((e): e is RunnerExercise => e !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Today&apos;s session</h1>
        <p className="mt-1 text-sm text-slate-400 capitalize">{currentTier} tier · full body</p>
      </div>
      <SessionRunner
        sessionId={session.id}
        status={session.status}
        exercises={runnerExercises}
      />
    </div>
  );
}
