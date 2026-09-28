"use client";

import { useMemo, useState } from "react";
import { EXERCISE_LIBRARY, getExerciseById } from "@/lib/workout/exercise-library";
import type { FitnessTier, MovementPattern } from "@/lib/workout/types";

const PATTERN_LABELS: Record<MovementPattern, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  core_stability: "Core (stability)",
  core_rotation: "Core (rotation)",
  cardio: "Cardio",
  mobility: "Mobility",
};

const PATTERNS = Object.keys(PATTERN_LABELS) as MovementPattern[];
const TIERS: FitnessTier[] = ["foundation", "building", "progressing", "advanced"];

export default function LibraryPage() {
  const [pattern, setPattern] = useState<MovementPattern | "all">("all");
  const [tier, setTier] = useState<FitnessTier | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      if (pattern !== "all" && e.pattern !== pattern) return false;
      if (tier !== "all" && e.tier !== tier) return false;
      return true;
    });
  }, [pattern, tier]);

  const selected = selectedId ? getExerciseById(selectedId) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Exercise library</h1>
        <p className="mt-1 text-sm text-slate-400">
          {EXERCISE_LIBRARY.length} full-body movements, each with an easier and harder version.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setPattern("all")}
          className={`workout-chip ${pattern === "all" ? "bg-amber-500 text-slate-950" : ""}`}
        >
          All patterns
        </button>
        {PATTERNS.map((p) => (
          <button
            key={p}
            onClick={() => setPattern(p)}
            className={`workout-chip ${pattern === p ? "bg-amber-500 text-slate-950" : ""}`}
          >
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setTier("all")}
          className={`workout-chip ${tier === "all" ? "bg-amber-500 text-slate-950" : ""}`}
        >
          All tiers
        </button>
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTier(t)}
            className={`workout-chip capitalize ${tier === t ? "bg-amber-500 text-slate-950" : ""}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((exercise) => (
          <button
            key={exercise.id}
            onClick={() => setSelectedId(exercise.id)}
            className="workout-card p-4 text-left transition-colors hover:bg-slate-800/60"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{exercise.name}</h3>
              <span className="text-xs capitalize text-slate-400">{exercise.tier}</span>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              {PATTERN_LABELS[exercise.pattern]} · {exercise.equipment.join(", ")}
            </p>
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-slate-400">No exercises match those filters.</p>
        )}
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setSelectedId(null)}
        >
          <div
            className="workout-card max-h-[80vh] w-full max-w-md overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h2 className="text-xl font-bold">{selected.name}</h2>
              <button
                onClick={() => setSelectedId(null)}
                aria-label="Close"
                className="text-slate-400 hover:text-slate-100"
              >
                ✕
              </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="workout-chip capitalize">{selected.tier}</span>
              <span className="workout-chip capitalize">{selected.impact} impact</span>
              <span className="workout-chip">{selected.equipment.join(", ")}</span>
            </div>
            <p className="mt-3 text-sm text-slate-300">
              Targets: {selected.muscleGroups.join(", ")}
            </p>
            <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-300">
              {selected.cues.map((cue) => (
                <li key={cue}>{cue}</li>
              ))}
            </ul>
            <div className="mt-4 flex gap-2">
              {selected.easierId && (
                <button
                  className="workout-btn-outline flex-1 px-3 py-2 text-sm"
                  onClick={() => setSelectedId(selected.easierId ?? null)}
                >
                  ← Easier: {getExerciseById(selected.easierId)?.name}
                </button>
              )}
              {selected.harderId && (
                <button
                  className="workout-btn-outline flex-1 px-3 py-2 text-sm"
                  onClick={() => setSelectedId(selected.harderId ?? null)}
                >
                  Harder: {getExerciseById(selected.harderId)?.name} →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
