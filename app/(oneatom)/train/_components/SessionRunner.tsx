"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export interface RunnerExercise {
  logId: string;
  exerciseId: string;
  name: string;
  cues: string[];
  isTimeBased: boolean;
  role: "warmup" | "main" | "finisher" | "cooldown";
  targetSets: number;
  targetReps: number;
  completedSets: number | null;
  completedReps: number | null;
  weightKg: number | null;
  rpe: number | null;
  completed: boolean;
}

const ROLE_LABEL: Record<RunnerExercise["role"], string> = {
  warmup: "Warm-up",
  main: "Main work",
  finisher: "Finisher",
  cooldown: "Cooldown",
};

export function SessionRunner({
  sessionId,
  status,
  exercises,
}: {
  sessionId: string;
  status: string;
  exercises: RunnerExercise[];
}) {
  const [items, setItems] = useState(exercises);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(status === "completed");
  const router = useRouter();

  const allDone = useMemo(() => items.every((i) => i.completed), [items]);

  function updateLocal(logId: string, patch: Partial<RunnerExercise>) {
    setItems((prev) => prev.map((i) => (i.logId === logId ? { ...i, ...patch } : i)));
  }

  async function persist(logId: string, patch: Record<string, unknown>) {
    const supabase = createClient();
    await supabase.from("session_exercise_logs").update(patch).eq("id", logId);
  }

  function markComplete(exercise: RunnerExercise) {
    const completedSets = exercise.completedSets ?? exercise.targetSets;
    const completedReps = exercise.completedReps ?? exercise.targetReps;
    updateLocal(exercise.logId, { completed: true, completedSets, completedReps });
    void persist(exercise.logId, {
      completed: true,
      completed_sets: completedSets,
      completed_reps: completedReps,
    });
  }

  async function finishSession() {
    setFinishing(true);
    const rpes = items.map((i) => i.rpe).filter((r): r is number => r !== null);
    const overallRpe = rpes.length ? Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length) : null;

    const supabase = createClient();
    await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        overall_rpe: overallRpe,
      })
      .eq("id", sessionId);

    setFinishing(false);
    setFinished(true);
    router.refresh();
  }

  if (finished) {
    return (
      <div className="workout-card p-6 text-center">
        <p className="text-3xl">✅</p>
        <h2 className="mt-2 text-xl font-semibold">Session complete</h2>
        <p className="mt-1 text-sm text-slate-400">
          Logged for today. Consistency beats intensity — see you tomorrow.
        </p>
        <button className="workout-btn-primary mt-4 px-5 py-2" onClick={() => router.push("/")}>
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((exercise) => (
        <div key={exercise.logId} className="workout-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <span className="workout-chip mb-1 inline-block">{ROLE_LABEL[exercise.role]}</span>
              <h3 className="text-lg font-semibold">{exercise.name}</h3>
              <p className="mt-1 text-xs text-slate-400">
                Target: {exercise.targetSets} sets × {exercise.targetReps}
                {exercise.isTimeBased ? "s" : " reps"}
              </p>
            </div>
            <span aria-hidden className="text-xl">
              {exercise.completed ? "✓" : ""}
            </span>
          </div>

          <ul className="mt-2 list-inside list-disc text-xs text-slate-500">
            {exercise.cues.map((cue) => (
              <li key={cue}>{cue}</li>
            ))}
          </ul>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <label className="text-xs text-slate-400">
              Sets done
              <input
                type="number"
                min={0}
                max={exercise.targetSets + 2}
                value={exercise.completedSets ?? exercise.targetSets}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  updateLocal(exercise.logId, { completedSets: value });
                  void persist(exercise.logId, { completed_sets: value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400">
              {exercise.isTimeBased ? "Seconds" : "Reps"} done
              <input
                type="number"
                min={0}
                value={exercise.completedReps ?? exercise.targetReps}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  updateLocal(exercise.logId, { completedReps: value });
                  void persist(exercise.logId, { completed_reps: value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400">
              Weight (kg)
              <input
                type="number"
                min={0}
                value={exercise.weightKg ?? 0}
                onChange={(e) => {
                  const value = Number(e.target.value);
                  updateLocal(exercise.logId, { weightKg: value });
                  void persist(exercise.logId, { weight_kg: value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100"
              />
            </label>
            <label className="text-xs text-slate-400">
              Effort (RPE 1-10)
              <input
                type="number"
                min={1}
                max={10}
                value={exercise.rpe ?? ""}
                onChange={(e) => {
                  const value = e.target.value === "" ? null : Number(e.target.value);
                  updateLocal(exercise.logId, { rpe: value });
                  void persist(exercise.logId, { rpe: value });
                }}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2 text-slate-100"
              />
            </label>
          </div>

          {!exercise.completed && (
            <button
              className="workout-btn-outline mt-3 px-4 py-1.5 text-sm"
              onClick={() => markComplete(exercise)}
            >
              Mark done
            </button>
          )}
        </div>
      ))}

      <button
        className="workout-btn-primary w-full py-3"
        onClick={finishSession}
        disabled={finishing || items.length === 0}
      >
        {finishing ? "Saving..." : allDone ? "Finish session" : "Finish session (some exercises incomplete)"}
      </button>
    </div>
  );
}
