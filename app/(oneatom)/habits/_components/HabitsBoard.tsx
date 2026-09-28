"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { FOUR_LAWS, habitStackSentence, twoMinuteVersion } from "@/lib/workout/habits";
import { todayISODate } from "@/lib/workout/date";

export interface HabitWithState {
  id: string;
  title: string;
  identityStatement: string | null;
  cue: string | null;
  craving: string | null;
  response: string | null;
  reward: string | null;
  cueTime: string | null;
  streak: number;
  doneToday: boolean;
}

export function HabitsBoard({ userId, initialHabits }: { userId: string; initialHabits: HabitWithState[] }) {
  const [habits, setHabits] = useState(initialHabits);
  const [showForm, setShowForm] = useState(false);
  const [expandedTips, setExpandedTips] = useState<string | null>(null);

  async function toggleToday(habit: HabitWithState) {
    const today = todayISODate();
    const supabase = createClient();
    const willBeDone = !habit.doneToday;

    setHabits((prev) =>
      prev.map((h) =>
        h.id === habit.id
          ? { ...h, doneToday: willBeDone, streak: h.streak + (willBeDone ? 1 : -1) }
          : h,
      ),
    );

    if (willBeDone) {
      await supabase
        .from("habit_logs")
        .upsert(
          { habit_id: habit.id, user_id: userId, log_date: today, completed: true },
          { onConflict: "habit_id,log_date" },
        );
    } else {
      await supabase.from("habit_logs").delete().eq("habit_id", habit.id).eq("log_date", today);
    }
  }

  return (
    <div className="space-y-4">
      {habits.length === 0 && (
        <div className="workout-card p-6 text-center text-sm text-slate-400">
          No habits yet. Start with one you can do in under two minutes.
        </div>
      )}

      {habits.map((habit) => (
        <div key={habit.id} className="workout-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{habit.title}</h3>
              {habit.identityStatement && (
                <p className="text-xs text-amber-400">{habit.identityStatement}</p>
              )}
              {habit.cue && (
                <p className="mt-1 text-xs text-slate-400">
                  Cue: {habit.cue}
                  {habit.cueTime ? ` · ${habit.cueTime}` : ""}
                </p>
              )}
            </div>
            <button
              onClick={() => toggleToday(habit)}
              className={`workout-chip ${habit.doneToday ? "bg-amber-500 text-slate-950" : ""}`}
            >
              {habit.doneToday ? "Done today ✓" : "Mark done"}
            </button>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">{habit.streak} day streak</span>
            <button
              className="text-xs text-slate-400 underline hover:text-slate-200"
              onClick={() => setExpandedTips(expandedTips === habit.id ? null : habit.id)}
            >
              {expandedTips === habit.id ? "Hide 2-minute version" : "Feeling resistant?"}
            </button>
          </div>
          {expandedTips === habit.id && (
            <p className="mt-2 rounded-lg bg-slate-950/60 p-3 text-xs text-slate-300">
              {twoMinuteVersion(habit.title)}
            </p>
          )}
        </div>
      ))}

      {showForm ? (
        <NewHabitForm
          userId={userId}
          onCreated={(habit) => {
            setHabits((prev) => [...prev, habit]);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <button className="workout-btn-primary w-full py-3" onClick={() => setShowForm(true)}>
          + Build a new habit
        </button>
      )}
    </div>
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
  const [cueTime, setCueTime] = useState("");
  const [anchorHabit, setAnchorHabit] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);

    const supabase = createClient();
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
        cue_time: cueTime || null,
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
      craving: data.craving,
      response: data.response,
      reward: data.reward,
      cueTime: data.cue_time,
      streak: 0,
      doneToday: false,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="workout-card space-y-4 p-5">
      <h3 className="text-lg font-semibold">New habit</h3>
      <label className="block text-sm">
        Habit title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. 10 push-ups"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
          required
        />
      </label>
      <label className="block text-sm">
        &ldquo;I am...&rdquo; (identity)
        <input
          value={identityRole}
          onChange={(e) => setIdentityRole(e.target.value)}
          placeholder="a person who moves every day"
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
        />
      </label>

      {FOUR_LAWS.map((law) => {
        const value = { cue, craving, response, reward }[law.key];
        const setValue = { cue: setCue, craving: setCraving, response: setResponse, reward: setReward }[
          law.key
        ];
        return (
          <label key={law.key} className="block text-sm">
            <span className="font-medium">{law.law}</span>
            <span className="block text-xs text-slate-400">{law.prompt}</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={law.placeholder}
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
            />
          </label>
        );
      })}

      <label className="block text-sm">
        Cue time (optional)
        <input
          type="time"
          value={cueTime}
          onChange={(e) => setCueTime(e.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
        />
      </label>

      <div>
        <label className="block text-sm">
          Habit stack (optional): an existing habit to anchor this to
          <input
            value={anchorHabit}
            onChange={(e) => setAnchorHabit(e.target.value)}
            placeholder="e.g. pour my morning coffee"
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-950 p-2.5 text-slate-100"
          />
        </label>
        {anchorHabit && title && (
          <p className="mt-2 text-xs text-amber-400">
            {habitStackSentence(anchorHabit, title)}
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <button type="submit" className="workout-btn-primary flex-1 py-2" disabled={saving}>
          {saving ? "Saving..." : "Save habit"}
        </button>
        <button type="button" className="workout-btn-outline flex-1 py-2" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
