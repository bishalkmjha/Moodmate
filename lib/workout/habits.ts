// Atomic Habits helpers: the four laws (cue, craving, response, reward),
// habit stacking, and the 2-minute rule for making a new habit easy to start.

export const FOUR_LAWS = [
  {
    key: "cue" as const,
    law: "Make it obvious",
    prompt: "What will trigger this habit? (a time, a place, or another habit)",
    placeholder: "e.g. Right after I brush my teeth in the morning",
  },
  {
    key: "craving" as const,
    law: "Make it attractive",
    prompt: "What makes you actually want to do this?",
    placeholder: "e.g. I feel sharper and calmer all morning",
  },
  {
    key: "response" as const,
    law: "Make it easy",
    prompt: "What's the smallest version of this habit you could do in under 2 minutes?",
    placeholder: "e.g. Put on my shoes and step outside",
  },
  {
    key: "reward" as const,
    law: "Make it satisfying",
    prompt: "How will you mark it as a win right away?",
    placeholder: "e.g. Check it off and note how I feel",
  },
];

export function habitStackSentence(anchorHabit: string, newHabit: string): string {
  const anchor = anchorHabit.trim() || "[an existing habit]";
  const target = newHabit.trim() || "[the new habit]";
  return `After I ${anchor}, I will ${target}.`;
}

export function identityStatementSentence(role: string): string {
  const trimmed = role.trim() || "someone who trains";
  return `I am ${trimmed}.`;
}

/**
 * A generic 2-minute starter version of a habit, per Atomic Habits'
 * "standardize before you optimize" advice — scale any habit down to
 * something so easy there's no excuse not to start.
 */
export function twoMinuteVersion(habitTitle: string): string {
  const title = habitTitle.trim();
  if (!title) return "Do the first two minutes of your habit — nothing more.";
  return `Just start: do the first two minutes of "${title}" — that's the whole goal today.`;
}
