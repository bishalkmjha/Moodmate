import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";
import { Card, ScreenTitle } from "@/components/ui";

function buildLastNDays(n: number): string[] {
  const days: string[] = [];
  const cursor = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(cursor);
    d.setDate(cursor.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

interface SessionSummary {
  session_date: string;
  status: string;
  tier_at_time: string;
  overall_rpe: number | null;
}

export default function ProgressScreen() {
  const { user } = useAuth();
  const [tier, setTier] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [morningStreak, setMorningStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const { data: profile } = await supabase
        .from("workout_profiles")
        .select("fitness_tier")
        .eq("user_id", user.id)
        .maybeSingle();
      setTier(profile?.fitness_tier ?? null);

      const { data: sessionRows } = await supabase
        .from("workout_sessions")
        .select("session_date, status, tier_at_time, overall_rpe")
        .eq("user_id", user.id)
        .order("session_date", { ascending: false })
        .limit(90);
      setSessions(sessionRows ?? []);

      const { count } = await supabase
        .from("workout_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "completed");
      setTotalCompleted(count ?? 0);

      const { data: morningLogs } = await supabase
        .from("morning_routine_logs")
        .select("log_date, completed")
        .eq("user_id", user.id)
        .order("log_date", { ascending: false })
        .limit(90);
      setMorningStreak(calculateStreak((morningLogs ?? []).filter((l) => l.completed).map((l) => l.log_date)));

      setLoading(false);
    }
    void load();
  }, [user]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-base">
        <Text className="text-slate-400">Loading progress...</Text>
      </View>
    );
  }

  const workoutStreak = calculateStreak(
    sessions.filter((s) => s.status === "completed").map((s) => s.session_date),
  );
  const statusByDate = new Map(sessions.map((s) => [s.session_date, s.status]));
  const days = buildLastNDays(84);
  const today = todayISODate();

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="gap-4 px-5 pb-10 pt-16">
      <ScreenTitle title="Progress" subtitle="Consistency compounds — here's the record." />

      <View className="flex-row flex-wrap gap-3">
        <Card className="flex-1 basis-[45%] gap-1">
          <Text className="text-xs uppercase text-slate-400">Tier</Text>
          <Text className="text-xl font-bold capitalize text-slate-50">{tier ?? "-"}</Text>
        </Card>
        <Card className="flex-1 basis-[45%] gap-1">
          <Text className="text-xs uppercase text-slate-400">Workout streak</Text>
          <Text className="text-xl font-bold text-slate-50">{workoutStreak} 🔥</Text>
        </Card>
        <Card className="flex-1 basis-[45%] gap-1">
          <Text className="text-xs uppercase text-slate-400">Morning streak</Text>
          <Text className="text-xl font-bold text-slate-50">{morningStreak} 🌅</Text>
        </Card>
        <Card className="flex-1 basis-[45%] gap-1">
          <Text className="text-xs uppercase text-slate-400">Sessions done</Text>
          <Text className="text-xl font-bold text-slate-50">{totalCompleted}</Text>
        </Card>
      </View>

      <Card>
        <Text className="mb-3 text-lg font-semibold text-slate-50">Last 12 weeks</Text>
        <View className="flex-row flex-wrap gap-1">
          {days.map((day) => {
            const status = statusByDate.get(day);
            const isToday = day === today;
            const bg =
              status === "completed"
                ? "bg-accent"
                : status === "in_progress"
                  ? "bg-amber-800"
                  : status
                    ? "bg-slate-700"
                    : "bg-slate-800";
            return (
              <View
                key={day}
                className={`h-3 w-3 rounded-sm ${bg} ${isToday ? "border border-slate-100" : ""}`}
              />
            );
          })}
        </View>
      </Card>

      <Card className="gap-2">
        <Text className="text-lg font-semibold text-slate-50">Recent sessions</Text>
        {sessions.slice(0, 10).map((session) => (
          <View
            key={session.session_date}
            className="flex-row items-center justify-between rounded-lg border border-border bg-base px-3 py-2"
          >
            <Text className="text-xs text-slate-300">{session.session_date}</Text>
            <Text className="text-xs capitalize text-slate-400">{session.status}</Text>
            <Text className="text-xs capitalize text-slate-400">{session.tier_at_time}</Text>
            <Text className="text-xs text-slate-400">RPE {session.overall_rpe ?? "-"}</Text>
          </View>
        ))}
        {sessions.length === 0 && <Text className="text-sm text-slate-400">No sessions logged yet.</Text>}
      </Card>
    </ScrollView>
  );
}
