import { useState } from "react";
import { Text, TextInput, View } from "react-native";
import { supabase } from "@/lib/supabase/client";
import { deriveInitialTier } from "@/lib/workout/adaptive-engine";
import { identityStatementSentence } from "@/lib/workout/habits";
import { DEFAULT_WAKE_TIME } from "@/lib/workout/morning-routine";
import type { Equipment, PrimaryGoal, SelfReportedLevel } from "@/lib/workout/types";
import { Card, Chip, PrimaryButton } from "./ui";

const EQUIPMENT_OPTIONS: { value: Equipment; label: string }[] = [
  { value: "none", label: "Just my body" },
  { value: "dumbbells", label: "Dumbbells" },
  { value: "resistance_bands", label: "Resistance bands" },
  { value: "pull_up_bar", label: "Pull-up bar" },
  { value: "bench", label: "Bench / step" },
  { value: "kettlebell", label: "Kettlebell" },
  { value: "full_gym", label: "Full gym" },
];

const GOAL_OPTIONS: { value: PrimaryGoal; label: string }[] = [
  { value: "general_fitness", label: "General fitness" },
  { value: "lose_weight", label: "Lose weight" },
  { value: "build_muscle", label: "Build muscle" },
  { value: "endurance", label: "Endurance" },
  { value: "mobility", label: "Mobility" },
];

const LEVELS: SelfReportedLevel[] = ["beginner", "intermediate", "advanced"];

export interface InitialProfileValues {
  height_cm: number;
  weight_kg: number;
  birth_year: number | null;
  self_reported_level: SelfReportedLevel;
  primary_goal: PrimaryGoal;
  equipment: string[];
  injury_notes: string | null;
  identity_statement: string | null;
  wake_time: string | null;
}

function extractIdentityRole(statement: string | null): string {
  if (!statement) return "someone who trains, no matter what";
  return statement.replace(/^I am\s*/i, "").replace(/\.$/, "");
}

export function ProfileForm({
  userId,
  initialProfile,
  submitLabel = "Build my adaptive plan",
  onSaved,
}: {
  userId: string;
  initialProfile?: InitialProfileValues | null;
  submitLabel?: string;
  onSaved: () => void;
}) {
  const [heightCm, setHeightCm] = useState(String(initialProfile?.height_cm ?? 170));
  const [weightKg, setWeightKg] = useState(String(initialProfile?.weight_kg ?? 70));
  const [birthYear, setBirthYear] = useState(
    initialProfile?.birth_year ? String(initialProfile.birth_year) : "",
  );
  const [level, setLevel] = useState<SelfReportedLevel>(
    initialProfile?.self_reported_level ?? "beginner",
  );
  const [goal, setGoal] = useState<PrimaryGoal>(initialProfile?.primary_goal ?? "general_fitness");
  const [equipment, setEquipment] = useState<Set<Equipment>>(
    new Set((initialProfile?.equipment?.length ? initialProfile.equipment : ["none"]) as Equipment[]),
  );
  const [injuryNotes, setInjuryNotes] = useState(initialProfile?.injury_notes ?? "");
  const [identityRole, setIdentityRole] = useState(
    extractIdentityRole(initialProfile?.identity_statement ?? null),
  );
  const [wakeTime, setWakeTime] = useState(initialProfile?.wake_time ?? DEFAULT_WAKE_TIME);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleEquipment(value: Equipment) {
    setEquipment((prev) => {
      if (value === "none") return new Set<Equipment>(["none"]);
      const next = new Set(prev);
      next.delete("none");
      if (next.has(value)) next.delete(value);
      else next.add(value);
      if (next.size === 0) next.add("none");
      return next;
    });
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    const height = Number(heightCm);
    const weight = Number(weightKg);
    if (!height || !weight) {
      setSaving(false);
      setError("Enter a valid height and weight.");
      return;
    }

    const tier = deriveInitialTier({
      height_cm: height,
      weight_kg: weight,
      self_reported_level: level,
      birth_year: birthYear ? Number(birthYear) : null,
    });

    const { error: upsertError } = await supabase.from("workout_profiles").upsert({
      user_id: userId,
      height_cm: height,
      weight_kg: weight,
      birth_year: birthYear ? Number(birthYear) : null,
      self_reported_level: level,
      primary_goal: goal,
      equipment: Array.from(equipment),
      injury_notes: injuryNotes || null,
      identity_statement: identityStatementSentence(identityRole),
      wake_time: wakeTime,
      fitness_tier: initialProfile ? undefined : tier,
      onboarded_at: initialProfile ? undefined : new Date().toISOString(),
    });

    setSaving(false);
    if (upsertError) {
      setError(upsertError.message);
      return;
    }
    onSaved();
  }

  return (
    <View className="gap-4">
      <Card className="gap-4">
        <Text className="text-lg font-semibold text-slate-50">Your body, your plan</Text>
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Text className="mb-1 text-sm text-slate-300">Height (cm)</Text>
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              keyboardType="numeric"
              className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
            />
          </View>
          <View className="flex-1">
            <Text className="mb-1 text-sm text-slate-300">Weight (kg)</Text>
            <TextInput
              value={weightKg}
              onChangeText={setWeightKg}
              keyboardType="numeric"
              className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
            />
          </View>
        </View>
        <View>
          <Text className="mb-1 text-sm text-slate-300">Birth year (optional)</Text>
          <TextInput
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="numeric"
            placeholder="1995"
            placeholderTextColor="#64748b"
            className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
          />
        </View>
      </Card>

      <Card className="gap-4">
        <Text className="text-lg font-semibold text-slate-50">Where you&apos;re starting</Text>
        <View>
          <Text className="mb-2 text-sm text-slate-300">Fitness level</Text>
          <View className="flex-row flex-wrap gap-2">
            {LEVELS.map((l) => (
              <Chip key={l} active={level === l} onPress={() => setLevel(l)}>
                {l[0].toUpperCase() + l.slice(1)}
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <Text className="mb-2 text-sm text-slate-300">Primary goal</Text>
          <View className="flex-row flex-wrap gap-2">
            {GOAL_OPTIONS.map((g) => (
              <Chip key={g.value} active={goal === g.value} onPress={() => setGoal(g.value)}>
                {g.label}
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <Text className="mb-2 text-sm text-slate-300">Equipment you have access to</Text>
          <View className="flex-row flex-wrap gap-2">
            {EQUIPMENT_OPTIONS.map((eq) => (
              <Chip key={eq.value} active={equipment.has(eq.value)} onPress={() => toggleEquipment(eq.value)}>
                {eq.label}
              </Chip>
            ))}
          </View>
        </View>
        <View>
          <Text className="mb-1 text-sm text-slate-300">Any injuries or joints to protect?</Text>
          <TextInput
            value={injuryNotes}
            onChangeText={setInjuryNotes}
            multiline
            placeholder="e.g. sensitive knee, previous shoulder injury"
            placeholderTextColor="#64748b"
            className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
          />
        </View>
      </Card>

      <Card className="gap-4">
        <Text className="text-lg font-semibold text-slate-50">Identity &amp; morning routine</Text>
        <View>
          <Text className="mb-1 text-sm text-slate-300">&ldquo;I am...&rdquo;</Text>
          <TextInput
            value={identityRole}
            onChangeText={setIdentityRole}
            className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
          />
        </View>
        <View>
          <Text className="mb-1 text-sm text-slate-300">5AM Club wake time (HH:MM)</Text>
          <TextInput
            value={wakeTime}
            onChangeText={setWakeTime}
            placeholder="05:00"
            placeholderTextColor="#64748b"
            className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
          />
        </View>
      </Card>

      {error && <Text className="text-sm text-rose-400">{error}</Text>}

      <PrimaryButton onPress={handleSubmit} loading={saving}>
        {submitLabel}
      </PrimaryButton>
    </View>
  );
}
