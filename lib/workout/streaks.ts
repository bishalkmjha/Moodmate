/**
 * Consecutive-day streak ending today or yesterday (a streak isn't broken
 * until a full day is missed, so logging this evening still counts).
 */
export function calculateStreak(datesCompleted: string[]): number {
  const days = new Set(
    datesCompleted.map((d) => new Date(d).toISOString().slice(0, 10)),
  );
  if (days.size === 0) return 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayKey = today.toISOString().slice(0, 10);
  let cursor = new Date(today);
  if (!days.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while (days.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}
