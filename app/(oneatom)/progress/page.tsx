import { requireWorkoutUser } from "@/lib/workout/auth";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";

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

export default async function ProgressPage() {
  const { supabase, user } = await requireWorkoutUser();

  const { data: profile } = await supabase
    .from("workout_profiles")
    .select("fitness_tier")
    .eq("user_id", user.id)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("session_date, status, focus, tier_at_time, overall_rpe")
    .eq("user_id", user.id)
    .order("session_date", { ascending: false })
    .limit(90);

  const { count: totalCompleted } = await supabase
    .from("workout_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { data: morningLogs } = await supabase
    .from("morning_routine_logs")
    .select("log_date, completed")
    .eq("user_id", user.id)
    .order("log_date", { ascending: false })
    .limit(90);

  const workoutStreak = calculateStreak(
    (sessions ?? []).filter((s) => s.status === "completed").map((s) => s.session_date),
  );
  const morningStreak = calculateStreak(
    (morningLogs ?? []).filter((l) => l.completed).map((l) => l.log_date),
  );

  const statusByDate = new Map((sessions ?? []).map((s) => [s.session_date, s.status]));
  const days = buildLastNDays(84);
  const today = todayISODate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Progress</h1>
        <p className="mt-1 text-sm text-slate-400">Consistency compounds — here's the record.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-4">
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Tier</span>
          <span className="text-2xl font-bold capitalize">{profile?.fitness_tier ?? "-"}</span>
        </div>
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Workout streak</span>
          <span className="text-2xl font-bold">{workoutStreak} 🔥</span>
        </div>
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Morning streak</span>
          <span className="text-2xl font-bold">{morningStreak} 🌅</span>
        </div>
        <div className="workout-stat-tile">
          <span className="text-xs uppercase tracking-wide text-slate-400">Sessions completed</span>
          <span className="text-2xl font-bold">{totalCompleted ?? 0}</span>
        </div>
      </section>

      <section className="workout-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Last 12 weeks</h2>
        <div className="grid grid-flow-col grid-rows-7 gap-1 overflow-x-auto pb-2">
          {days.map((day) => {
            const status = statusByDate.get(day);
            const isToday = day === today;
            const color =
              status === "completed"
                ? "bg-amber-500"
                : status === "in_progress"
                  ? "bg-amber-500/40"
                  : status
                    ? "bg-slate-700"
                    : "bg-slate-800/40";
            return (
              <div
                key={day}
                title={`${day}${status ? ` · ${status}` : ""}`}
                className={`h-3 w-3 rounded-sm ${color} ${isToday ? "ring-1 ring-slate-100" : ""}`}
              />
            );
          })}
        </div>
      </section>

      <section className="workout-card p-5">
        <h2 className="mb-3 text-lg font-semibold">Recent sessions</h2>
        <ul className="space-y-2 text-sm">
          {(sessions ?? []).slice(0, 10).map((session) => (
            <li
              key={session.session_date}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2"
            >
              <span>{session.session_date}</span>
              <span className="capitalize text-slate-400">{session.status}</span>
              <span className="capitalize text-slate-400">{session.tier_at_time}</span>
              <span className="text-slate-400">RPE {session.overall_rpe ?? "-"}</span>
            </li>
          ))}
          {(!sessions || sessions.length === 0) && (
            <li className="text-slate-400">No sessions logged yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}
