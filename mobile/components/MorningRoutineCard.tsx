import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { supabase } from "@/lib/supabase/client";
import { MORNING_ROUTINE_BLOCKS } from "@/lib/workout/morning-routine";
import { Card } from "./ui";

type BlockKey = "move" | "reflect" | "grow";

export function MorningRoutineCard({
  userId,
  today,
  wakeTime,
  initialMinutes,
}: {
  userId: string;
  today: string;
  wakeTime: string | null;
  initialMinutes: { move: number; reflect: number; grow: number };
}) {
  const [minutes, setMinutes] = useState(initialMinutes);
  const [saving, setSaving] = useState<BlockKey | null>(null);

  async function toggleBlock(key: BlockKey) {
    const nextValue = minutes[key] >= 20 ? 0 : 20;
    const next = { ...minutes, [key]: nextValue };
    setMinutes(next);
    setSaving(key);

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
    <Card className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-slate-50">5AM Club: Victory Hour</Text>
        {wakeTime && (
          <View className="rounded-full border border-border bg-slate-800/70 px-3 py-1">
            <Text className="text-xs text-slate-200">Wake {wakeTime}</Text>
          </View>
        )}
      </View>
      <Text className="text-sm text-slate-400">The 20/20/20 formula: Move, Reflect, Grow.</Text>
      <View className="gap-2">
        {MORNING_ROUTINE_BLOCKS.map((block) => {
          const key = block.key as BlockKey;
          const done = minutes[key] >= 20;
          return (
            <Pressable
              key={key}
              onPress={() => toggleBlock(key)}
              disabled={saving === key}
              className={`rounded-xl border p-3 ${
                done ? "border-accent bg-accent/10" : "border-border bg-base"
              }`}
            >
              <View className="flex-row items-center justify-between">
                <Text className="font-medium text-slate-100">{block.title}</Text>
                {done && <Text className="text-accent">✓</Text>}
              </View>
              <Text className="mt-1 text-xs text-slate-400">{block.subtitle}</Text>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}
