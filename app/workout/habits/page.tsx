import { requireWorkoutUser } from "@/lib/workout/auth";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";
import { HabitsBoard, type HabitWithState } from "./_components/HabitsBoard";

export default async function HabitsPage() {
  const { supabase, user } = await requireWorkoutUser();
  const today = todayISODate();

  const { data: habits } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .eq("active", true)
    .order("created_at", { ascending: true });

  const habitIds = (habits ?? []).map((h) => h.id);
  const { data: logs } = habitIds.length
    ? await supabase
        .from("habit_logs")
        .select("habit_id, log_date, completed")
        .in("habit_id", habitIds)
        .eq("completed", true)
    : { data: [] };

  const habitsWithState: HabitWithState[] = (habits ?? []).map((habit) => {
    const habitLogs = (logs ?? []).filter((l) => l.habit_id === habit.id);
    return {
      id: habit.id,
      title: habit.title,
      identityStatement: habit.identity_statement,
      cue: habit.cue,
      craving: habit.craving,
      response: habit.response,
      reward: habit.reward,
      cueTime: habit.cue_time,
      streak: calculateStreak(habitLogs.map((l) => l.log_date)),
      doneToday: habitLogs.some((l) => l.log_date === today),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Habits</h1>
        <p className="mt-1 text-sm text-slate-400">
          Built on Atomic Habits: make it obvious, attractive, easy, and satisfying.
        </p>
      </div>
      <HabitsBoard userId={user.id} initialHabits={habitsWithState} />
    </div>
  );
}
