// The 5AM Club's 20/20/20 formula: one "Victory Hour" split into three
// 20-minute blocks, done before the world wakes up.

export const MORNING_ROUTINE_BLOCKS = [
  {
    key: "move" as const,
    title: "Move (20 min)",
    subtitle: "Get your heart rate up",
    description:
      "Sweat to release BDNF and stress hormones, and to prime focus for the day. Your workout session counts here.",
    tips: [
      "Any intensity counts — the goal is consistency, not a personal record.",
      "Rolling out of bed straight into movement beats a snooze button.",
    ],
  },
  {
    key: "reflect" as const,
    title: "Reflect (20 min)",
    subtitle: "Journal, meditate, or set intentions",
    description:
      "Calm the mind and get clear on today's priorities before notifications and other people set the agenda.",
    tips: [
      "Try: what am I grateful for, what's my #1 priority today, who can I help?",
      "Even 5 slow breaths counts as a start.",
    ],
  },
  {
    key: "grow" as const,
    title: "Grow (20 min)",
    subtitle: "Learn something",
    description:
      "Read, listen to something educational, or practice a skill — invest in who you're becoming.",
    tips: [
      "Keep a book or article queued the night before so there's zero friction.",
      "Consistency compounds: 20 minutes a day is 120+ hours a year.",
    ],
  },
];

export const DEFAULT_WAKE_TIME = "05:00";
