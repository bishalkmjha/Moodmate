"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deriveInitialTier } from "@/lib/workout/adaptive-engine";
import { identityStatementSentence } from "@/lib/workout/habits";
import { DEFAULT_WAKE_TIME } from "@/lib/workout/morning-routine";
import type { Equipment, PrimaryGoal, SelfReportedLevel } from "@/lib/workout/types";

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "none", label: "Just my body" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "resistance_bands", label: "Resistance bands" },
  { value: "pull_up_bar", label: "Pull-up bar" },
  { value: "bench", label: "Bench / sturdy step" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "full_gym", label: "Full gym" },
];

const GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: "general_fitness", label: "General fitness" },
  { value: "lose_weight", label: "Lose weight" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "endurance", label: "Endurance" },
  { value: "mobility", label: "Mobility" },
];

export interface InitialProfileValues {
  height_cm: number;
  weight_kg: number;
  sex: "male" | "female" | "other" | null;
  birth_year: number | null;
  self_reported_level: SelfReportedLevel;
  primary_goal: PrimaryGoal;
  equipment: string[];
  injury_notes: string | null;
  identity_statement: string | null;
  wake_time: string | null;
}

function extractIdentityRole(statement: string | null): string {
  if (!statement) return "someone who trains, no matter what";
  return statement.replace(/^I am\s*/i, "").replace(/\.$/, "");
}

export function ProfileForm({
  userId,
  initialProfile,
  submitLabel = "Build my adaptive plan",
  redirectTo = "/",
}: {
  userId: string;
  initialProfile?: InitialProfileValues | null;
  submitLabel?: string;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [units, setUnits] = useState<"metric" | "imperial">("metric");
  const [heightCm, setHeightCm] = useState<number>(initialProfile?.height_cm ?? 170);
  const [heightFt, setHeightFt] = useState<number>(5);
  const [heightIn, setHeightIn] = useState<number>(7);
  const [weightKg, setWeightKg] = useState<number>(initialProfile?.weight_kg ?? 70);
  const [weightLb, setWeightLb] = useState<number>(
    initialProfile ? Math.round(initialProfile.weight_kg / 0.4536) : 154,
  );
  const [sex, setSex] = useState<"male" | "female" | "other" | "">(initialProfile?.sex ?? "");
  const [birthYear, setBirthYear] = useState<string>(
    initialProfile?.birth_year ? String(initialProfile.birth_year) : "",
  );
  const [level, setLevel] = useState<SelfReportedLevel>(
    initialProfile?.self_reported_level ?? "beginner",
  );
  const [goal, setGoal] = useState<PrimaryGoal>(initialProfile?.primary_goal ?? "general_fitness");
  const [equipment, setEquipment] = useState<Set<Equipment>>(
    new Set(
      (initialProfile?.equipment?.length ? initialProfile.equipment : ["none"]) as Equipment[],
    ),
  );
  const [injuryNotes, setInjuryNotes] = useState(initialProfile?.injury_notes ?? "");
  const [identityRole, setIdentityRole] = useState(
    extractIdentityRole(initialProfile?.identity_statement ?? null),
  );
  const [wakeTime, setWakeTime] = useState(initialProfile?.wake_time ?? DEFAULT_WAKE_TIME);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolvedHeightCm = units === "metric" ? heightCm : Math.round((heightFt * 12 + heightIn) * 2.54);
  const resolvedWeightKg = units === "metric" ? weightKg : Math.round(weightLb * 0.4536 * 10) / 10;

  function toggleEquipment(value: Equipment) {
    setEquipment((prev) => {
      const next = new Set(prev);
      if (value === "none") return new Set<Equipment>(["none"]);
      next.delete("none");
      if (next.has(value)) next.delete(value);
      else next.add(value);
      if (next.size === 0) next.add("none");
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const tier = deriveInitialTier({
      height_cm: resolvedHeightCm,
      weight_kg: resolvedWeightKg,
      self_reported_level: level,
      birth_year: birthYear ? Number(birthYear) : null,
    });

    const supabase = createClient();
    const { error: upsertError } = await supabase.from("workout_profiles").upsert({
      user_id: userId,
      height_cm: resolvedHeightCm,
      weight_kg: resolvedWeightKg,
      sex: sex || null,
      birth_year: birthYear ? Number(birthYear) : null,
      self_reported_level: level,
      primary_goal: goal,
      equipment: Array.from(equipment),
      injury_notes: injuryNotes || null,
      identity_statement: identityStatementSentence(identityRole),
      wake_time: wakeTime,
      fitness_tier: initialProfile ? undefined : tier,
      onboarded_at: initialProfile ? undefined : new Date().toISOString(),
    });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <section className="workout-card space-y-4 p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Your body, your plan</h2>
          <div className="flex gap-2">
            <button
              type="button"
              className={`workout-chip ${units === "metric" ? "bg-amber-500 text-slate-950" : ""}`}
              onClick={() => setUnits("metric")}
            >
              cm / kg
            </button>
            <button
              type="button"
              className={`workout-chip ${units === "imperial" ? "bg-amber-500 text-slate-950" : ""}`}
              onClick={() => setUnits("imperial")}
            >
              ft-in / lb
            </button>
          </div>
        </div>
        <p className="text-sm text-slate-400">
          Every plan is scaled to your height and weight — there is no single &ldquo;default
          body&rdquo; here.
        </p>

        {units === "metric" ? (
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm">
              Height (cm)
              <input
                type="number"
                min={100}
                max={250}
                value={heightCm}
                onChange={(e) => setHeightCm(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
              />
            </label>
            <label className="text-sm">
              Weight (kg)
              <input
                type="number"
                min={30}
                max={300}
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
              />
            </label>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            <label className="text-sm">
              Height (ft)
              <input
                type="number"
                min={3}
                max={8}
                value={heightFt}
                onChange={(e) => setHeightFt(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
              />
            </label>
            <label className="text-sm">
              Height (in)
              <input
                type="number"
                min={0}
                max={11}
                value={heightIn}
                onChange={(e) => setHeightIn(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
              />
            </label>
            <label className="text-sm">
              Weight (lb)
              <input
                type="number"
                min={60}
                max={660}
                value={weightLb}
                onChange={(e) => setWeightLb(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
              />
            </label>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm">
            Sex (optional)
            <select
              value={sex}
              onChange={(e) => setSex(e.target.value as typeof sex)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="text-sm">
            Birth year (optional)
            <input
              type="number"
              min={1900}
              max={new Date().getFullYear()}
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
            />
          </label>
        </div>
      </section>

      <section className="workout-card space-y-4 p-5">
        <h2 className="text-lg font-semibold">Where you're starting</h2>
        <div>
          <span className="mb-2 block text-sm text-slate-300">Fitness level</span>
          <div className="flex gap-2">
            {(["beginner", "intermediate", "advanced"] as SelfReportedLevel[]).map((l) => (
              <button
                type="button"
                key={l}
                onClick={() => setLevel(l)}
                className={`workout-chip capitalize ${level === l ? "bg-amber-500 text-slate-950" : ""}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-sm text-slate-300">Primary goal</span>
          <div className="flex flex-wrap gap-2">
            {GOAL_OPTIONS.map((g) => (
              <button
                type="button"
                key={g.value}
                onClick={() => setGoal(g.value)}
                className={`workout-chip ${goal === g.value ? "bg-amber-500 text-slate-950" : ""}`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <span className="mb-2 block text-sm text-slate-300">Equipment you have access to</span>
          <div className="flex flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <button
                type="button"
                key={eq.value}
                onClick={() => toggleEquipment(eq.value)}
                className={`workout-chip ${equipment.has(eq.value) ? "bg-amber-500 text-slate-950" : ""}`}
              >
                {eq.label}
              </button>
            ))}
          </div>
        </div>
        <label className="block text-sm">
          Any injuries or joints to protect? (optional)
          <textarea
            value={injuryNotes}
            onChange={(e) => setInjuryNotes(e.target.value)}
            rows={2}
            placeholder="e.g. sensitive knee, previous shoulder injury"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-sm text-slate-100"
          />
        </label>
      </section>

      <section className="workout-card space-y-4 p-5">
        <h2 className="text-lg font-semibold">Identity &amp; morning routine</h2>
        <p className="text-sm text-slate-400">
          Atomic Habits: the goal isn&apos;t to run a marathon, it&apos;s to become a runner.
          Finish this sentence:
        </p>
        <label className="block text-sm">
          &ldquo;I am...&rdquo;
          <input
            value={identityRole}
            onChange={(e) => setIdentityRole(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
          />
        </label>
        <label className="block text-sm">
          5AM Club: what time do you want to start your Victory Hour?
          <input
            type="time"
            value={wakeTime}
            onChange={(e) => setWakeTime(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
          />
        </label>
      </section>

      {error && <p className="text-sm text-rose-400">{error}</p>}

      <button type="submit" className="workout-btn-primary w-full" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
