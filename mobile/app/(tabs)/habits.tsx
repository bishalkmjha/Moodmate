import { useEffect, useState } from "react";
import { ScrollView, Text, TextInput, View } from "react-native";
import { useAuth } from "@/lib/auth-provider";
import { supabase } from "@/lib/supabase/client";
import { FOUR_LAWS, habitStackSentence, twoMinuteVersion } from "@/lib/workout/habits";
import { calculateStreak } from "@/lib/workout/streaks";
import { todayISODate } from "@/lib/workout/date";
import { Card, Chip, OutlineButton, PrimaryButton, ScreenTitle } from "@/components/ui";

interface HabitWithState {
  id: string;
  title: string;
  identityStatement: string | null;
  cue: string | null;
  cueTime: string | null;
  streak: number;
  doneToday: boolean;
}

export default function HabitsScreen() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<HabitWithState[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedTips, setExpandedTips] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      const today = todayISODate();
      const { data: rawHabits } = await supabase
        .from("habits")
        .select("*")
        .eq("user_id", user.id)
        .eq("active", true)
        .order("created_at", { ascending: true });

      const habitIds = (rawHabits ?? []).map((h) => h.id);
      const { data: logs } = habitIds.length
        ? await supabase
            .from("habit_logs")
            .select("habit_id, log_date, completed")
            .in("habit_id", habitIds)
            .eq("completed", true)
        : { data: [] };

      setHabits(
        (rawHabits ?? []).map((habit) => {
          const habitLogs = (logs ?? []).filter((l) => l.habit_id === habit.id);
          return {
            id: habit.id,
            title: habit.title,
            identityStatement: habit.identity_statement,
            cue: habit.cue,
            cueTime: habit.cue_time,
            streak: calculateStreak(habitLogs.map((l) => l.log_date)),
            doneToday: habitLogs.some((l) => l.log_date === today),
          };
        }),
      );
      setLoading(false);
    }
    void load();
  }, [user]);

  async function toggleToday(habit: HabitWithState) {
    if (!user) return;
    const today = todayISODate();
    const willBeDone = !habit.doneToday;

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id ? { ...h, doneToday: willBeDone, streak: h.streak + (willBeDone ? 1 : -1) } : h,
      ),
    );

    if (willBeDone) {
      await supabase
        .from("habit_logs")
        .upsert({ habit_id: habit.id, user_id: user.id, log_date: today, completed: true }, {
          onConflict: "habit_id,log_date",
        });
    } else {
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("log_date", today);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-base">
        <Text className="text-slate-400">Loading habits...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-base" contentContainerClassName="gap-4 px-5 pb-10 pt-16">
      <ScreenTitle
        title="Habits"
        subtitle="Built on Atomic Habits: make it obvious, attractive, easy, and satisfying."
      />

      {habits.length === 0 && (
        <Card>
          <Text className="text-center text-sm text-slate-400">
            No habits yet. Start with one you can do in under two minutes.
          </Text>
        </Card>
      )}

      {habits.map((habit) => (
        <Card key={habit.id} className="gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1">
              <Text className="font-semibold text-slate-50">{habit.title}</Text>
              {habit.identityStatement && (
                <Text className="text-xs text-accent">{habit.identityStatement}</Text>
              )}
              {habit.cue && (
                <Text className="mt-1 text-xs text-slate-400">
                  Cue: {habit.cue}
                  {habit.cueTime ? ` · ${habit.cueTime}` : ""}
                </Text>
              )}
            </View>
            <Chip active={habit.doneToday} onPress={() => toggleToday(habit)}>
              {habit.doneToday ? "Done today ✓" : "Mark done"}
            </Chip>
          </View>
          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-slate-500">{habit.streak} day streak</Text>
            <Text
              className="text-xs text-slate-400 underline"
              onPress={() => setExpandedTips(expandedTips === habit.id ? null : habit.id)}
            >
              {expandedTips === habit.id ? "Hide 2-minute version" : "Feeling resistant?"}
            </Text>
          </View>
          {expandedTips === habit.id && (
            <Text className="rounded-lg bg-base p-3 text-xs text-slate-300">
              {twoMinuteVersion(habit.title)}
            </Text>
          )}
        </Card>
      ))}

      {showForm ? (
        <NewHabitForm
          userId={user!.id}
          onCreated={(habit) => {
            setHabits((prev) => [...prev, habit]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <PrimaryButton onPress={() => setShowForm(true)}>+ Build a new habit</PrimaryButton>
      )}
    </ScrollView>
  );
}

function NewHabitForm({
  userId,
  onCreated,
  onCancel,
}: {
  userId: string;
  onCreated: (habit: HabitWithState) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState("");
  const [identityRole, setIdentityRole] = useState("");
  const [cue, setCue] = useState("");
  const [craving, setCraving] = useState("");
  const [response, setResponse] = useState("");
  const [reward, setReward] = useState("");
  const [anchorHabit, setAnchorHabit] = useState("");
  const [saving, setSaving] = useState(false);

  const lawValues: Record<string, [string, (v: string) => void]> = {
    cue: [cue, setCue],
    craving: [craving, setCraving],
    response: [response, setResponse],
    reward: [reward, setReward],
  };

  async function handleSubmit() {
    if (!title.trim()) return;
    setSaving(true);

    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: userId,
        title: title.trim(),
        identity_statement: identityRole.trim() ? `I am ${identityRole.trim()}.` : null,
        cue: cue.trim() || null,
        craving: craving.trim() || null,
        response: response.trim() || null,
        reward: reward.trim() || null,
      })
      .select("*")
      .single();

    setSaving(false);
    if (error || !data) return;

    onCreated({
      id: data.id,
      title: data.title,
      identityStatement: data.identity_statement,
      cue: data.cue,
      cueTime: data.cue_time,
      streak: 0,
      doneToday: false,
    });
  }

  return (
    <Card className="gap-3">
      <Text className="text-lg font-semibold text-slate-50">New habit</Text>
      <View>
        <Text className="mb-1 text-sm text-slate-300">Habit title</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g. 10 push-ups"
          placeholderTextColor="#64748b"
          className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
        />
      </View>
      <View>
        <Text className="mb-1 text-sm text-slate-300">&ldquo;I am...&rdquo; (identity)</Text>
        <TextInput
          value={identityRole}
          onChangeText={setIdentityRole}
          placeholder="a person who moves every day"
          placeholderTextColor="#64748b"
          className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
        />
      </View>

      {FOUR_LAWS.map((law) => {
        const [value, setValue] = lawValues[law.key];
        return (
          <View key={law.key}>
            <Text className="text-sm font-medium text-slate-200">{law.law}</Text>
            <Text className="mb-1 text-xs text-slate-400">{law.prompt}</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder={law.placeholder}
              placeholderTextColor="#64748b"
              className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
            />
          </View>
        );
      })}

      <View>
        <Text className="mb-1 text-sm text-slate-300">
          Habit stack (optional): an existing habit to anchor this to
        </Text>
        <TextInput
          value={anchorHabit}
          onChangeText={setAnchorHabit}
          placeholder="e.g. pour my morning coffee"
          placeholderTextColor="#64748b"
          className="rounded-lg border border-border bg-base px-3 py-2.5 text-slate-100"
        />
        {!!anchorHabit && !!title && (
          <Text className="mt-2 text-xs text-accent">{habitStackSentence(anchorHabit, title)}</Text>
        )}
      </View>

      <View className="flex-row gap-2">
        <PrimaryButton className="flex-1" onPress={handleSubmit} loading={saving}>
          Save habit
        </PrimaryButton>
        <OutlineButton className="flex-1" onPress={onCancel}>
          Cancel
        </OutlineButton>
      </View>
    </Card>
  );
}
