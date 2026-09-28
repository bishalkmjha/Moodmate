import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { getExerciseById } from "@/lib/workout/exercise-library";
import { getOrCreateTodaySession, resolveCurrentTier } from "@/lib/workout/session-service";
import type { PlannedExercise } from "@/lib/workout/types";
import type { TablesUpdate } from "@/database.types";
import { Card, Chip, OutlineButton, PrimaryButton, ScreenTitle } from "@/components/ui";

interface RunnerExercise {
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

export default function TrainScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [tier, setTier] = useState("foundation");
  const [items, setItems] = useState<RunnerExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [finishing, setFinishing] = useState(false);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    async function load() {
      if (!user || !profile) return;
      const resolvedTier = await resolveCurrentTier(supabase, user.id, profile.fitness_tier);
      setTier(resolvedTier);

      const session = await getOrCreateTodaySession(supabase, user.id, profile, resolvedTier);
      if (!session) {
        setLoading(false);
        return;
      }
      setSessionId(session.id);
      setFinished(session.status === "completed");

      let { data: logs } = await supabase
        .from("session_exercise_logs")
        .select("*")
        .eq("session_id", session.id)
        .order("order_index", { ascending: true });

      const plan = (session.plan as unknown as PlannedExercise[]) ?? [];

      if (!logs || logs.length === 0) {
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

      setItems(runnerExercises);
      setLoading(false);
    }
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, profile]);

  function updateLocal(logId: string, patch: Partial<RunnerExercise>) {
    setItems((prev) => prev.map((i) => (i.logId === logId ? { ...i, ...patch } : i)));
  }

  async function persist(logId: string, patch: TablesUpdate<"session_exercise_logs">) {
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
    if (!sessionId) return;
    setFinishing(true);
    const rpes = items.map((i) => i.rpe).filter((r): r is number => r !== null);
    const overallRpe = rpes.length ? Math.round(rpes.reduce((a, b) => a + b, 0) / rpes.length) : null;

    await supabase
      .from("workout_sessions")
      .update({ status: "completed", completed_at: new Date().toISOString(), overall_rpe: overallRpe })
      .eq("id", sessionId);

    setFinishing(false);
    setFinished(true);
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-base">
        <Text className="text-slate-400">Loading today's session...</Text>
      </View>
    );
  }

  if (finished) {
    return (
      <View className="flex-1 items-center justify-center gap-3 bg-base px-6">
        <Text className="text-4xl">✅</Text>
        <Text className="text-xl font-semibold text-slate-50">Session complete</Text>
        <Text className="text-center text-sm text-slate-400">
          Logged for today. Consistency beats intensity — see you tomorrow.
        </Text>
        <PrimaryButton className="mt-2 w-full" onPress={() => router.back()}>
          Back to dashboard
        </PrimaryButton>
      </View>
    );
  }

  const allDone = items.length > 0 && items.every((i) => i.completed);

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="gap-4 px-5 pb-10 pt-16">
      <ScreenTitle title="Today's session" subtitle={`${tier} tier · full body`} />

      {items.map((exercise) => (
        <Card key={exercise.logId} className="gap-3">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 gap-1">
              <Chip>{ROLE_LABEL[exercise.role]}</Chip>
              <Text className="text-lg font-semibold text-slate-50">{exercise.name}</Text>
              <Text className="text-xs text-slate-400">
                Target: {exercise.targetSets} sets × {exercise.targetReps}
                {exercise.isTimeBased ? "s" : " reps"}
              </Text>
            </View>
            {exercise.completed && <Text className="text-xl text-accent">✓</Text>}
          </View>

          {exercise.cues.map((cue) => (
            <Text key={cue} className="text-xs text-slate-500">
              • {cue}
            </Text>
          ))}

          <View className="flex-row flex-wrap gap-3">
            <NumberField
              label="Sets done"
              value={exercise.completedSets ?? exercise.targetSets}
              onChange={(value) => {
                updateLocal(exercise.logId, { completedSets: value });
                void persist(exercise.logId, { completed_sets: value });
              }}
            />
            <NumberField
              label={exercise.isTimeBased ? "Seconds" : "Reps"}
              value={exercise.completedReps ?? exercise.targetReps}
              onChange={(value) => {
                updateLocal(exercise.logId, { completedReps: value });
                void persist(exercise.logId, { completed_reps: value });
              }}
            />
            <NumberField
              label="Weight (kg)"
              value={exercise.weightKg ?? 0}
              onChange={(value) => {
                updateLocal(exercise.logId, { weightKg: value });
                void persist(exercise.logId, { weight_kg: value });
              }}
            />
            <NumberField
              label="Effort (RPE 1-10)"
              value={exercise.rpe ?? 0}
              onChange={(value) => {
                updateLocal(exercise.logId, { rpe: value });
                void persist(exercise.logId, { rpe: value });
              }}
            />
          </View>

          {!exercise.completed && (
            <OutlineButton onPress={() => markComplete(exercise)}>Mark done</OutlineButton>
          )}
        </Card>
      ))}

      <PrimaryButton onPress={finishSession} loading={finishing} disabled={items.length === 0}>
        {allDone ? "Finish session" : "Finish session (some exercises incomplete)"}
      </PrimaryButton>
    </ScrollView>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <View className="w-[46%]">
      <Text className="mb-1 text-xs text-slate-400">{label}</Text>
      <TextInput
        keyboardType="numeric"
        defaultValue={String(value)}
        onEndEditing={(e) => onChange(Number(e.nativeEvent.text) || 0)}
        className="rounded-lg border border-border bg-base px-2 py-2 text-slate-100"
      />
    </View>
  );
}
