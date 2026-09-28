import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { EXERCISE_LIBRARY, getExerciseById } from "@/lib/workout/exercise-library";
import type { FitnessTier, MovementPattern } from "@/lib/workout/types";
import { Card, Chip, ScreenTitle } from "@/components/ui";

const PATTERN_LABELS: Record<MovementPattern, string> = {
  push: "Push",
  pull: "Pull",
  squat: "Squat",
  hinge: "Hinge",
  core_stability: "Core (stability)",
  core_rotation: "Core (rotation)",
  cardio: "Cardio",
  mobility: "Mobility",
};

const PATTERNS = Object.keys(PATTERN_LABELS) as MovementPattern[];
const TIERS: FitnessTier[] = ["foundation", "building", "progressing", "advanced"];

export default function LibraryScreen() {
  const [pattern, setPattern] = useState<MovementPattern | "all">("all");
  const [tier, setTier] = useState<FitnessTier | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return EXERCISE_LIBRARY.filter((e) => {
      if (pattern !== "all" && e.pattern !== pattern) return false;
      if (tier !== "all" && e.tier !== tier) return false;
      return true;
    });
  }, [pattern, tier]);

  const selected = selectedId ? getExerciseById(selectedId) : null;

  return (
    <View className="flex-1 bg-base pt-16">
      <View className="px-5">
        <ScreenTitle
          title="Exercise library"
          subtitle={`${EXERCISE_LIBRARY.length} full-body movements, each with an easier and harder version.`}
        />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 pb-2">
        <Chip active={pattern === "all"} onPress={() => setPattern("all")}>
          All patterns
        </Chip>
        {PATTERNS.map((p) => (
          <Chip key={p} active={pattern === p} onPress={() => setPattern(p)}>
            {PATTERN_LABELS[p]}
          </Chip>
        ))}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-5 pb-3">
        <Chip active={tier === "all"} onPress={() => setTier("all")}>
          All tiers
        </Chip>
        {TIERS.map((t) => (
          <Chip key={t} active={tier === t} onPress={() => setTier(t)}>
            {t[0].toUpperCase() + t.slice(1)}
          </Chip>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-5 pb-10"
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelectedId(item.id)}>
            <Card>
              <View className="flex-row items-center justify-between">
                <Text className="font-semibold text-slate-50">{item.name}</Text>
                <Text className="text-xs capitalize text-slate-400">{item.tier}</Text>
              </View>
              <Text className="mt-1 text-xs text-slate-400">
                {PATTERN_LABELS[item.pattern]} · {item.equipment.join(", ")}
              </Text>
            </Card>
          </Pressable>
        )}
        ListEmptyComponent={<Text className="px-1 text-sm text-slate-400">No exercises match those filters.</Text>}
      />

      <Modal visible={!!selected} animationType="slide" transparent onRequestClose={() => setSelectedId(null)}>
        <Pressable className="flex-1 justify-end bg-black/60" onPress={() => setSelectedId(null)}>
          <Pressable
            onPress={() => {}}
            className="max-h-[80%] rounded-t-2xl border border-border bg-surface p-6"
          >
            {selected && (
              <ScrollView>
                <View className="flex-row items-start justify-between">
                  <Text className="text-xl font-bold text-slate-50">{selected.name}</Text>
                  <Pressable onPress={() => setSelectedId(null)}>
                    <Text className="text-slate-400">✕</Text>
                  </Pressable>
                </View>
                <View className="mt-2 flex-row flex-wrap gap-2">
                  <Chip>{selected.tier}</Chip>
                  <Chip>{selected.impact} impact</Chip>
                  <Chip>{selected.equipment.join(", ")}</Chip>
                </View>
                <Text className="mt-3 text-sm text-slate-300">
                  Targets: {selected.muscleGroups.join(", ")}
                </Text>
                <View className="mt-3 gap-1">
                  {selected.cues.map((cue) => (
                    <Text key={cue} className="text-sm text-slate-300">
                      • {cue}
                    </Text>
                  ))}
                </View>
                <View className="mt-4 flex-row gap-2">
                  {selected.easierId && (
                    <Pressable
                      className="flex-1 rounded-xl border border-border px-3 py-2"
                      onPress={() => setSelectedId(selected.easierId ?? null)}
                    >
                      <Text className="text-center text-sm text-slate-100">
                        ← Easier: {getExerciseById(selected.easierId)?.name}
                      </Text>
                    </Pressable>
                  )}
                  {selected.harderId && (
                    <Pressable
                      className="flex-1 rounded-xl border border-border px-3 py-2"
                      onPress={() => setSelectedId(selected.harderId ?? null)}
                    >
                      <Text className="text-center text-sm text-slate-100">
                        Harder: {getExerciseById(selected.harderId)?.name} →
                      </Text>
                    </Pressable>
                  )}
                </View>
              </ScrollView>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
