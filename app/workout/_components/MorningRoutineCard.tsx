"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MORNING_ROUTINE_BLOCKS } from "@/lib/workout/morning-routine";

type BlockKey = "move" | "reflect" | "grow";

interface Props {
  userId: string;
  today: string;
  wakeTime: string | null;
  initialMinutes: { move: number; reflect: number; grow: number };
}

export function MorningRoutineCard({ userId, today, wakeTime, initialMinutes }: Props) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saving, setSaving] = useState<BlockKey | null>(null);

  async function toggleBlock(key: BlockKey) {
    const nextValue = minutes[key] >= 20 ? 0 : 20;
    const next = { ...minutes, [key]: nextValue };
    setMinutes(next);
    setSaving(key);

    const supabase = createClient();
    await supabase.from("morning_routine_logs").upsert(
      {
        user_id: userId,
        log_date: today,
        move_minutes: next.move,
        reflect_minutes: next.reflect,
        grow_minutes: next.grow,
        completed: next.move >= 20 && next.reflect >= 20 && next.grow >= 20,
      },
      { onConflict: "user_id,log_date" },
    );
    setSaving(null);
  }

  return (
    <div className="workout-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">5AM Club: Victory Hour</h2>
        {wakeTime && <span className="workout-chip">Wake {wakeTime}</span>}
      </div>
      <p className="mt-1 text-sm text-slate-400">The 20/20/20 formula: Move, Reflect, Grow.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {MORNING_ROUTINE_BLOCKS.map((block) => {
          const key = block.key as BlockKey;
          const done = minutes[key] >= 20;
          return (
            <button
              key={key}
              onClick={() => toggleBlock(key)}
              disabled={saving === key}
              className={`rounded-xl border p-3 text-left transition-colors ${
                done
                  ? "border-amber-500 bg-amber-500/10"
                  : "border-slate-700 bg-slate-950 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{block.title}</span>
                <span aria-hidden>{done ? "✓" : ""}</span>
              </div>
              <p className="mt-1 text-xs text-slate-400">{block.subtitle}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
