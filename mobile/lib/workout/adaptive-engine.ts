import { EXERCISE_LIBRARY, getExerciseById } from "./exercise-library";
import type {
  CautionJoint,
  Equipment,
  Exercise,
  FitnessTier,
  MovementPattern,
  PlannedExercise,
  SessionFocus,
  WorkoutProfile,
} from "./types";

const TIER_ORDER: FitnessTier[] = ["foundation", "building", "progressing", "advanced"];
const TIER_RANK: Record<FitnessTier, number> = {
  foundation: 0,
  building: 1,
  progressing: 2,
  advanced: 3,
};

export function calculateBMI(heightCm: number, weightKg: number): number {
  const heightM = heightCm / 100;
  if (heightM <= 0) return 0;
  return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
}

export type BmiCategory = "underweight" | "healthy" | "overweight" | "obese";

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return "underweight";
  if (bmi < 25) return "healthy";
  if (bmi < 30) return "overweight";
  return "obese";
}

export function ageFromBirthYear(birthYear: number | null | undefined): number | null {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

/**
 * Starting tier for a brand-new profile: self-reported level is the base
 * signal, nudged down for safety when BMI or age suggest a gentler on-ramp.
 * This is what makes the app usable at any weight or height from day one.
 */
export function deriveInitialTier(profile: {
  height_cm: number;
  weight_kg: number;
  self_reported_level: WorkoutProfile["self_reported_level"];
  birth_year: number | null;
}): FitnessTier {
  const base: FitnessTier =
    profile.self_reported_level === "advanced"
      ? "progressing"
      : profile.self_reported_level === "intermediate"
        ? "building"
        : "foundation";

  const bmi = calculateBMI(profile.height_cm, profile.weight_kg);
  const category = bmiCategory(bmi);
  const age = ageFromBirthYear(profile.birth_year);

  let rank = TIER_RANK[base];
  if (category === "obese") rank -= 1;
  if (age !== null && age >= 55) rank -= 1;
  if (category === "underweight" && profile.self_reported_level === "beginner") rank -= 1;

  rank = Math.max(0, Math.min(TIER_RANK.advanced, rank));
  return TIER_ORDER[rank];
}

export interface SessionPerformanceSummary {
  overallRpe: number | null;
  completionRate: number; // 0-1, completed sets / target sets across the session
}

/**
 * The ongoing half of the adaptive engine: looks at recent logged sessions
 * and decides whether to promote, hold, or demote the user's tier. Low
 * effort + high completion earns a promotion; high effort or skipped work
 * pulls the tier back down so the plan stays sustainable.
 */
export function recommendTierAdjustment(
  currentTier: FitnessTier,
  recentSessions: SessionPerformanceSummary[],
): { direction: "promote" | "demote" | "hold"; nextTier: FitnessTier } {
  const sample = recentSessions.slice(-5).filter((session) => session.overallRpe !== null);

  if (sample.length < 3) {
    return { direction: "hold", nextTier: currentTier };
  }

  const avgRpe =
    sample.reduce((sum, session) => sum + (session.overallRpe ?? 0), 0) / sample.length;
  const avgCompletion =
    sample.reduce((sum, session) => sum + session.completionRate, 0) / sample.length;

  const rank = TIER_RANK[currentTier];

  if (avgRpe <= 5 && avgCompletion >= 0.9 && rank < TIER_RANK.advanced) {
    return { direction: "promote", nextTier: TIER_ORDER[rank + 1] };
  }

  if ((avgRpe >= 8.5 || avgCompletion < 0.6) && rank > TIER_RANK.foundation) {
    return { direction: "demote", nextTier: TIER_ORDER[rank - 1] };
  }

  return { direction: "hold", nextTier: currentTier };
}

const INJURY_KEYWORDS: CautionJoint[] = ["knee", "shoulder", "back", "wrist", "ankle", "hip"];

export function deriveCautionJoints(
  injuryNotes: string | null | undefined,
  bmi: number,
  tier: FitnessTier,
): CautionJoint[] {
  const joints = new Set<CautionJoint>();
  const notes = (injuryNotes ?? "").toLowerCase();
  for (const joint of INJURY_KEYWORDS) {
    if (notes.includes(joint)) joints.add(joint);
  }
  // Bias toward low-impact substitutions until the base is built, regardless
  // of why someone is starting at a higher body weight.
  if (bmiCategory(bmi) === "obese" && tier === "foundation") {
    joints.add("knee");
  }
  return Array.from(joints);
}

function pickForPattern(
  pattern: MovementPattern,
  tier: FitnessTier,
  equipment: Equipment[],
  cautionJoints: CautionJoint[],
): Exercise | undefined {
  const tierCeiling = TIER_RANK[tier];

  const safe = (exercise: Exercise) =>
    !exercise.cautionJoints.some((joint) => cautionJoints.includes(joint));

  const inTier = (exercise: Exercise) => TIER_RANK[exercise.tier] <= tierCeiling;

  const hasEquipment = (exercise: Exercise) =>
    exercise.equipment.some((eq) => equipment.includes(eq));

  let candidates = EXERCISE_LIBRARY.filter(
    (exercise) => exercise.pattern === pattern && inTier(exercise) && hasEquipment(exercise) && safe(exercise),
  );

  if (candidates.length === 0) {
    // Relax to any safe, in-tier bodyweight option for this pattern.
    candidates = EXERCISE_LIBRARY.filter(
      (exercise) =>
        exercise.pattern === pattern &&
        inTier(exercise) &&
        exercise.equipment.includes("none") &&
        safe(exercise),
    );
  }

  if (candidates.length === 0) {
    // Last resort: ignore the safety filter but stay in-tier, so a slot is
    // never silently dropped.
    candidates = EXERCISE_LIBRARY.filter(
      (exercise) => exercise.pattern === pattern && inTier(exercise) && exercise.equipment.includes("none"),
    );
  }

  if (candidates.length === 0) return undefined;

  candidates.sort((a, b) => TIER_RANK[b.tier] - TIER_RANK[a.tier]);
  return candidates[0];
}

const TIER_VOLUME: Record<FitnessTier, { sets: number; repsMultiplier: number }> = {
  foundation: { sets: 2, repsMultiplier: 1 },
  building: { sets: 3, repsMultiplier: 1.1 },
  progressing: { sets: 3, repsMultiplier: 1.25 },
  advanced: { sets: 4, repsMultiplier: 1.4 },
};

function scaledTargets(exercise: Exercise, tier: FitnessTier) {
  const volume = TIER_VOLUME[tier];
  return {
    targetSets: volume.sets,
    targetReps: Math.max(1, Math.round(exercise.defaultReps * volume.repsMultiplier)),
  };
}

function mobilityPicks(count: number, seed: number): Exercise[] {
  const pool = EXERCISE_LIBRARY.filter((e) => e.pattern === "mobility");
  const picks: Exercise[] = [];
  for (let i = 0; i < count; i++) {
    picks.push(pool[(seed + i) % pool.length]);
  }
  return picks;
}

/**
 * Generates a full-body routine for the day: mobility warm-up, one exercise
 * per major movement pattern (push, pull, squat, hinge, core), a cardio
 * finisher, and a mobility cooldown — all scaled and substituted for the
 * user's current tier, available equipment, and any joints to protect.
 */
export function generateDailyRoutine(
  profile: WorkoutProfile,
  tier: FitnessTier,
  date: Date = new Date(),
): PlannedExercise[] {
  const bmi = calculateBMI(profile.height_cm, profile.weight_kg);
  const cautionJoints = deriveCautionJoints(profile.injury_notes, bmi, tier);
  const equipment = (profile.equipment.length ? profile.equipment : ["none"]) as Equipment[];

  const dayOfYear = Math.floor(
    (date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86_400_000,
  );

  const mainPatterns: MovementPattern[] = ["squat", "push", "pull", "hinge", "core_stability"];

  const planned: PlannedExercise[] = [];
  let order = 0;

  for (const exercise of mobilityPicks(2, dayOfYear)) {
    planned.push({
      exerciseId: exercise.id,
      orderIndex: order++,
      ...scaledTargets(exercise, "foundation"),
      role: "warmup",
    });
  }

  for (const pattern of mainPatterns) {
    const exercise = pickForPattern(pattern, tier, equipment, cautionJoints);
    if (!exercise) continue;
    planned.push({
      exerciseId: exercise.id,
      orderIndex: order++,
      ...scaledTargets(exercise, tier),
      role: "main",
    });
  }

  const cardio = pickForPattern("cardio", tier, equipment, cautionJoints);
  if (cardio) {
    planned.push({
      exerciseId: cardio.id,
      orderIndex: order++,
      ...scaledTargets(cardio, tier),
      role: "finisher",
    });
  }

  for (const exercise of mobilityPicks(2, dayOfYear + 2)) {
    planned.push({
      exerciseId: exercise.id,
      orderIndex: order++,
      ...scaledTargets(exercise, "foundation"),
      role: "cooldown",
    });
  }

  return planned;
}

export function estimateSessionMinutes(planned: PlannedExercise[]): number {
  let seconds = 0;
  for (const item of planned) {
    const exercise = getExerciseById(item.exerciseId);
    if (!exercise) continue;
    const perSet = exercise.isTimeBased ? item.targetReps : item.targetReps * 3.5; // ~3.5s per rep
    seconds += (perSet + 30) * item.targetSets; // +30s rest between sets
  }
  return Math.max(10, Math.round(seconds / 60));
}

export function estimateCaloriesBurned(planned: PlannedExercise[], minutes: number): number {
  const exercises = planned
    .map((item) => getExerciseById(item.exerciseId))
    .filter((e): e is Exercise => Boolean(e));
  if (exercises.length === 0) return 0;
  const avgCaloriesPerMinute =
    exercises.reduce((sum, e) => sum + e.caloriesPerMinute, 0) / exercises.length;
  return Math.round(avgCaloriesPerMinute * minutes);
}

export function focusLabelForPatterns(): SessionFocus {
  return "full_body";
}
