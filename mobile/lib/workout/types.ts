export type MuscleGroup =
  | "chest"
  | "back"
  | "shoulders"
  | "biceps"
  | "triceps"
  | "quads"
  | "hamstrings"
  | "glutes"
  | "calves"
  | "core"
  | "full_body"
  | "cardio";

export type MovementPattern =
  | "push"
  | "pull"
  | "squat"
  | "hinge"
  | "core_stability"
  | "core_rotation"
  | "cardio"
  | "mobility";

export type Equipment =
  | "none"
  | "dumbbells"
  | "resistance_bands"
  | "pull_up_bar"
  | "bench"
  | "kettlebell"
  | "full_gym";

export type FitnessTier = "foundation" | "building" | "progressing" | "advanced";

export type ImpactLevel = "low" | "moderate" | "high";

export type CautionJoint = "knee" | "shoulder" | "back" | "wrist" | "ankle" | "hip";

export interface Exercise {
  id: string;
  name: string;
  pattern: MovementPattern;
  muscleGroups: MuscleGroup[];
  equipment: Equipment[];
  tier: FitnessTier;
  impact: ImpactLevel;
  cautionJoints: CautionJoint[];
  cues: string[];
  defaultSets: number;
  defaultReps: number;
  isTimeBased?: boolean;
  caloriesPerMinute: number;
  easierId?: string;
  harderId?: string;
}

export type SelfReportedLevel = "beginner" | "intermediate" | "advanced";

export type PrimaryGoal =
  | "lose_weight"
  | "build_muscle"
  | "general_fitness"
  | "endurance"
  | "mobility";

export interface WorkoutProfile {
  user_id: string;
  height_cm: number;
  weight_kg: number;
  sex: "male" | "female" | "other" | null;
  birth_year: number | null;
  self_reported_level: SelfReportedLevel;
  primary_goal: PrimaryGoal;
  // Stored as a generic text[] column in Postgres; validated against the
  // Equipment union at the point of use (see adaptive-engine.ts).
  equipment: string[];
  injury_notes: string | null;
  identity_statement: string | null;
  wake_time: string | null;
  fitness_tier: FitnessTier;
  onboarded_at: string | null;
}

export type SessionFocus = "full_body" | "upper" | "lower" | "core" | "mobility" | "cardio";
export type SessionStatus = "planned" | "in_progress" | "completed" | "skipped";

export interface PlannedExercise {
  exerciseId: string;
  orderIndex: number;
  targetSets: number;
  targetReps: number;
  role: "warmup" | "main" | "finisher" | "cooldown";
}
