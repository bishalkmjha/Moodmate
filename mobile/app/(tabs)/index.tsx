import { useCallback, useEffect, useState } from "react";
import { RefreshControl, ScrollView, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { bmiCategory, calculateBMI, estimateSessionMinutes } from "@/lib/workout/adaptive-engine";
import { getExerciseById } from "@/lib/workout/exercise-library";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";
import { getOrCreateTodaySession, resolveCurrentTier } from "@/lib/workout/session-service";
import type { FitnessTier, PlannedExercise } from "@/lib/workout/types";
import type { Tables } from "@/database.types";
import { Card, Chip, PrimaryButton, ScreenTitle } from "@/components/ui";
import { MorningRoutineCard } from "@/components/MorningRoutineCard";

type WorkoutSession = Tables<"workout_sessions">;

export default function TodayScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [tier, setTier] = useState<FitnessTier>("foundation");
  const [workoutStreak, setWorkoutStreak] = useState(0);
  const [morningStreak, setMorningStreak] = useState(0);
  const [morningMinutes, setMorningMinutes] = useState({ move: 0, reflect: 0, grow: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user || !profile) return;
    const today = todayISODate();

    const resolvedTier = await resolveCurrentTier(supabase, user.id, profile.fitness_tier);
    setTier(resolvedTier);

    const todaySession = await getOrCreateTodaySession(supabase, user.id, profile, resolvedTier);
    setSession(todaySession);

    const { data: completedSessions } = await supabase
      .from("workout_sessions")
      .select("session_date")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("session_date", { ascending: false })
      .limit(60);
    setWorkoutStreak(calculateStreak((completedSessions ?? []).map((s) => s.session_date)));

    const { data: morningLogs } = await supabase
      .from("morning_routine_logs")
      .select("log_date, completed, move_minutes, reflect_minutes, grow_minutes")
      .eq("user_id", user.id)
      .order("log_date", { ascending: false })
      .limit(60);
    setMorningStreak(calculateStreak((morningLogs ?? []).filter((l) => l.completed).map((l) => l.log_date)));
    const todayLog = (morningLogs ?? []).find((l) => l.log_date === today);
    setMorningMinutes({
      move: todayLog?.move_minutes ?? 0,
      reflect: todayLog?.reflect_minutes ?? 0,
      grow: todayLog?.grow_minutes ?? 0,
    });
  }, [user, profile]);

  useEffect(() => {
    setLoading(true);
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  if (!user || !profile || loading) {
    return (
      <View className="flex-1 items-center justify-center bg-base">
        <Text className="text-slate-400">Loading your plan...</Text>
      </View>
    );
  }

  const plan = ((session?.plan as unknown as PlannedExercise[]) ?? []).filter(
    (item) => item.role === "main",
  );
  const estimatedMinutes = estimateSessionMinutes(plan);
  const bmi = calculateBMI(profile.height_cm, profile.weight_kg);
  const isCompleted = session?.status === "completed";

  return (
    <ScrollView
      className="flex-1 bg-base"
      contentContainerClassName="gap-4 px-5 pb-10 pt-16"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
    >
      <Card className="gap-3">
        <Text className="text-sm text-accent">
          {profile.identity_statement ?? "I am someone who trains."}
        </Text>
        <ScreenTitle title={isCompleted ? "Today's session is done. Nice work." : "Today's full-body session"} />
        <View className="flex-row flex-wrap gap-2">
          <Chip>{tier} tier</Chip>
          <Chip>
            BMI {bmi} · {bmiCategory(bmi)}
          </Chip>
          <Chip>~{estimatedMinutes} min</Chip>
        </View>
        <View className="flex-row gap-3">
          <PrimaryButton className="flex-1" onPress={() => router.push("/train")}>
            {isCompleted ? "Review session" : "Start training"}
          </PrimaryButton>
        </View>
        <View className="gap-2">
          {plan.map((item) => {
            const exercise = getExerciseById(item.exerciseId);
            if (!exercise) return null;
            return (
              <View
                key={item.exerciseId}
                className="flex-row items-center justify-between rounded-lg border border-border bg-base px-3 py-2"
              >
                <Text className="text-sm text-slate-100">{exercise.name}</Text>
                <Text className="text-sm text-slate-400">
                  {item.targetSets} × {item.targetReps}
                  {exercise.isTimeBased ? "s" : ""}
                </Text>
              </View>
            );
          })}
        </View>
      </Card>

      <View className="flex-row gap-3">
        <Card className="flex-1 gap-1">
          <Text className="text-xs uppercase tracking-wide text-slate-400">Workout streak</Text>
          <Text className="text-3xl font-bold text-slate-50">{workoutStreak} 🔥</Text>
        </Card>
        <Card className="flex-1 gap-1">
          <Text className="text-xs uppercase tracking-wide text-slate-400">Morning streak</Text>
          <Text className="text-3xl font-bold text-slate-50">{morningStreak} 🌅</Text>
        </Card>
      </View>

      <MorningRoutineCard
        userId={user.id}
        today={todayISODate()}
        wakeTime={profile.wake_time}
        initialMinutes={morningMinutes}
      />
    </ScrollView>
  );
}
