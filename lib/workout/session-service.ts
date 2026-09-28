import type { createClient } from "@/lib/supabase/server";
import type { Json } from "@/database.types";
import {
  generateDailyRoutine,
  recommendTierAdjustment,
} from "./adaptive-engine";
import { todayISODate } from "./date";
import type { FitnessTier, WorkoutProfile } from "./types";

type Client = Awaited<ReturnType<typeof createClient>>;

/**
 * Looks at the last few completed sessions, decides whether the user's tier
 * should move, persists the change, and returns the tier to plan today's
 * session with. Shared by the dashboard and the session runner so both ever
 * see the same "today".
 */
export async function resolveCurrentTier(
  supabase: Client,
  userId: string,
  startingTier: FitnessTier,
): Promise<FitnessTier> {
  const { data: recentSessions } = await supabase
    .from("workout_sessions")
    .select("id, overall_rpe")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("session_date", { ascending: false })
    .limit(5);

  if (!recentSessions || recentSessions.length < 3) {
    return startingTier;
  }

  const ids = recentSessions.map((s) => s.id);
  const { data: logs } = await supabase
    .from("session_exercise_logs")
    .select("session_id, target_sets, completed_sets")
    .in("session_id", ids);

  const summaries = recentSessions.map((session) => {
    const sessionLogs = (logs ?? []).filter((l) => l.session_id === session.id);
    const targetTotal = sessionLogs.reduce((sum, l) => sum + l.target_sets, 0);
    const completedTotal = sessionLogs.reduce((sum, l) => sum + (l.completed_sets ?? 0), 0);
    return {
      overallRpe: session.overall_rpe,
      completionRate: targetTotal > 0 ? completedTotal / targetTotal : 0,
    };
  });

  const adjustment = recommendTierAdjustment(startingTier, summaries);
  if (adjustment.direction === "hold") {
    return startingTier;
  }

  await supabase
    .from("workout_profiles")
    .update({ fitness_tier: adjustment.nextTier })
    .eq("user_id", userId);

  return adjustment.nextTier;
}

export async function getOrCreateTodaySession(
  supabase: Client,
  userId: string,
  profile: WorkoutProfile,
  tier: FitnessTier,
) {
  const today = todayISODate();

  const { data: existing } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("user_id", userId)
    .eq("session_date", today)
    .maybeSingle();

  if (existing) return existing;

  const plan = generateDailyRoutine(profile, tier, new Date());
  const { data: created } = await supabase
    .from("workout_sessions")
    .upsert(
      {
        user_id: userId,
        session_date: today,
        focus: "full_body",
        tier_at_time: tier,
        status: "planned",
        plan: plan as unknown as Json,
      },
      { onConflict: "user_id,session_date" },
    )
    .select("*")
    .single();

  return created;
}
