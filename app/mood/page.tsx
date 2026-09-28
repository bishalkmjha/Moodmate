'use client';

import { useMemo, useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
// import type { Tables } from "@/database.types"; // This is commented out as it's currently empty

type MoodCategory =
  | "Calm"
  | "Focused"
  | "Energetic"
  | "Anxious"
  | "Overwhelmed"
  | "Content"
  | "Tired";

type CheckInMode = "Quick" | "Daily" | "Detailed";

type TabKey = "Home" | "Relief" | "Insights" | "Journal" | "Profile";

// Simple local suggestion type
type Suggestion = {
  title: string;
  subtitle: string;
  duration: string; // e.g., "2 min"
  category: "Quick" | "Moderate" | "Deep";
};

// Local fallback type while DB types are empty
type MoodCheckinRow = {
  id: string;
  user_id: string | null;
  created_at: string;
  stress_level: number;
  mode: "Quick" | "Daily" | "Detailed";
  notes: string | null;
};

type MusicCategory = "Calm" | "Focus" | "Energize" | "Sleep" | "Nature";

type CuratedPlaylist = {
  id: string; // YouTube playlist/video id
  title: string;
  category: MusicCategory;
  minutes: number;
  provider: "YouTube";
  type: "playlist" | "video";
};

// Curated playlists (safe embeds; no API keys)
const CURATED_PLAYLISTS: CuratedPlaylist[] = [
  { id: "5qap5aO4i9A", title: "lofi hip hop radio - beats to relax/study to", category: "Focus", minutes: 120, provider: "YouTube", type: "video" },
  { id: "DWcJFNfaw9c", title: "Peaceful Piano for Calm", category: "Calm", minutes: 90, provider: "YouTube", type: "video" },
  { id: "7NOSDKb0HlU", title: "Nature Sounds - Rain & Thunder", category: "Nature", minutes: 120, provider: "YouTube", type: "video" },
  { id: "p50rHU2mF2E", title: "Deep Sleep Music", category: "Sleep", minutes: 180, provider: "YouTube", type: "video" },
  { id: "PLPqKQF2LzV74Yv1Yx8RJWb1x1oP8Wgx8C", title: "Focus Flow - Instrumental", category: "Focus", minutes: 60, provider: "YouTube", type: "playlist" },
  { id: "PLcIcQ3b8qG2p5C7yNfVqfXk0pX8c5r4f1", title: "Uplift & Energize", category: "Energize", minutes: 45, provider: "YouTube", type: "playlist" },
];

export default function Home() {
  const [stress, setStress] = useState<number>(3); // 0-10
  const [mode, setMode] = useState<CheckInMode>("Quick");
  const [selectedMoods, setSelectedMoods] = useState<Set<MoodCategory>>(new Set());
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState<boolean>(false);
  const [recent, setRecent] = useState<MoodCheckinRow[]>([]);
  const [trend, setTrend] = useState<{ day: string; avg: number }[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>("Home");
  const supabase = useMemo(() => createClient(), []);

  // Relief feature state
  const [breathMode, setBreathMode] = useState<"Box" | "4-7-8" | "Custom">("Box");
  const [breathPhase, setBreathPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Hold2">("Inhale");
  const [breathRunning, setBreathRunning] = useState<boolean>(false);
  const [customPattern, setCustomPattern] = useState<[number, number, number, number]>([4, 4, 4, 4]);
  const breathTimerRef = useRef<number | null>(null);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState<number>(4);

  const [puzzleNumbers, setPuzzleNumbers] = useState<number[]>([]);
  const [puzzleNext, setPuzzleNext] = useState<number>(1);
  const [puzzleActive, setPuzzleActive] = useState<boolean>(false);
  const [puzzleMessage, setPuzzleMessage] = useState<string>("");

  const [colorHue, setColorHue] = useState<number>(210); // soothing blue default
  const [colorSpeed, setColorSpeed] = useState<number>(6);

  // Music hub state
  const [musicCategory, setMusicCategory] = useState<MusicCategory>("Calm");
  const [selectedPlaylist, setSelectedPlaylist] = useState<CuratedPlaylist | null>(null);
  const [musicFilterMinutes, setMusicFilterMinutes] = useState<number>(0);

  // Smart analytics/predictions
  const [allowNotifications, setAllowNotifications] = useState<"default" | "granted" | "denied">("default");
  const [nudge, setNudge] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setAllowNotifications(Notification.permission as "default" | "granted" | "denied");
    }
  }, []);

  // Fetch recent check-ins and weekly trend (client-side for prototype)
  useEffect(() => {
    void fetchData();
  }, []);

  async function fetchData() {
    // recent 10
    const { data: r } = await supabase
      .from("mood_checkins")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (r) setRecent(r as unknown as MoodCheckinRow[]);

    // past 7 days buckets (compute client-side)
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const { data: last7 } = await supabase
      .from("mood_checkins")
      .select("created_at, stress_level")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (last7) {
      const buckets = new Map<string, number[]>();
      for (let i = 0; i < 7; i++) {
        const d = new Date(since);
        d.setHours(0, 0, 0, 0);
        d.setDate(since.getDate() + i);
        buckets.set(d.toISOString().slice(0, 10), []);
      }
      (last7 as Array<{ created_at: string; stress_level: number }>).forEach((row) => {
        const d = new Date(row.created_at);
        d.setHours(0, 0, 0, 0);
        const key = d.toISOString().slice(0, 10);
        const arr = buckets.get(key);
        if (arr) arr.push(row.stress_level);
        else buckets.set(key, [row.stress_level]);
      });
      const series = Array.from(buckets.entries()).map(([day, vals]) => ({
        day,
        avg:
          vals.length > 0
            ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) /
              10
            : 0,
      }));
      setTrend(series);
    }
  }

  async function saveCheckIn() {
    setSaving(true);
    try {
      // upsert tags first (by slug)
      const moods = Array.from(selectedMoods);
      let tagIds: number[] = [];
      if (moods.length) {
        const slugs = moods.map((m) => m.toLowerCase());
        const labels = moods;
        // Insert missing tags
        const { data: existing } = await supabase
          .from("mood_tags")
          .select("id, slug")
          .in("slug", slugs);
        const existingMap = new Map<string, number>(
          (existing as Array<{ id: number; slug: string }> | null)?.map((t) => [t.slug, t.id]) ?? []
        );
        const toInsert = slugs
          .map((slug, idx) => ({ slug, label: labels[idx] }))
          .filter((t) => !existingMap.has(t.slug));
        if (toInsert.length) {
          const { data: inserted } = await supabase
            .from("mood_tags")
            .insert(toInsert as any)
            .select("id, slug");
          (inserted as Array<{ id: number; slug: string }> | null)?.forEach((t) =>
            existingMap.set(t.slug, t.id)
          );
        }
        tagIds = slugs.map((s) => existingMap.get(s)).filter((v): v is number => typeof v === 'number');
      }

      // insert checkin
      const { data: insertedCheckin, error } = await supabase
        .from("mood_checkins")
        .insert({
          stress_level: stress,
          mode,
          notes: notes || null,
        } as any)
        .select("*")
        .single();

      if (error) throw error;
      if (insertedCheckin && tagIds.length) {
        await supabase.from("mood_checkin_tags").insert(
          tagIds.map((tag_id) => ({
            checkin_id: (insertedCheckin as { id: string }).id,
            tag_id,
          })) as any
        );
      }

      // reset UI lightly and refresh lists
      setNotes("");
      setSelectedMoods(new Set());
      await fetchData();
    } finally {
      setSaving(false);
    }
  }

  const gradientColor = useMemo(() => {
    // map 0-10 to gradient stops green->yellow->orange->red
    const pct = Math.min(10, Math.max(0, stress)) / 10;
    if (pct < 0.33) return "from-emerald-400 to-lime-400";
    if (pct < 0.66) return "from-yellow-400 to-orange-400";
    return "from-orange-500 to-rose-500";
  }, [stress]);

  const ringColor = useMemo(() => {
    if (stress <= 3) return "ring-emerald-400/60";
    if (stress <= 6) return "ring-amber-400/60";
    return "ring-rose-500/60";
  }, [stress]);

  const moodOptions: MoodCategory[] = [
    "Calm",
    "Focused",
    "Energetic",
    "Anxious",
    "Overwhelmed",
    "Content",
    "Tired",
  ];

  const stressLabel = useMemo(() => {
    if (stress <= 2) return "Very Low";
    if (stress <= 4) return "Low";
    if (stress <= 6) return "Moderate";
    if (stress <= 8) return "High";
    return "Very High";
  }, [stress]);

  // Personalized suggestions (local heuristic)
  const suggestions = useMemo<Suggestion[]>(() => {
    const moods = Array.from(selectedMoods);
    const highStress = stress >= 7;
    const moderateStress = stress >= 4 && stress <= 6;

    const base: Suggestion[] = [];
    if (highStress) {
      base.push(
        { title: "Rescue Breath", subtitle: "4-7-8 calming cycle", duration: "2-4 min", category: "Quick" },
        { title: "Grounding 5-4-3-2-1", subtitle: "Sensory reset", duration: "3-5 min", category: "Quick" },
        { title: "Body Scan", subtitle: "Relax your body gradually", duration: "10-15 min", category: "Moderate" }
      );
    } else if (moderateStress) {
      base.push(
        { title: "Box Breathing", subtitle: "Even cadence focus", duration: "3-5 min", category: "Quick" },
        { title: "Mindful Walk", subtitle: "Slow pace, notice details", duration: "10-15 min", category: "Moderate" }
      );
    } else {
      base.push(
        { title: "Focus Primer", subtitle: "Short breathing + puzzle", duration: "3-5 min", category: "Quick" }
      );
    }

    if (moods.includes("Anxious") || moods.includes("Overwhelmed")) {
      base.push({ title: "Progressive Relaxation", subtitle: "Unwind tension", duration: "10-20 min", category: "Moderate" });
    }
    if (moods.includes("Tired")) {
      base.push({ title: "Gentle Color Soothe", subtitle: "Soft gradients", duration: "5-10 min", category: "Quick" });
    }
    if (moods.includes("Energetic")) {
      base.push({ title: "Focus Puzzle", subtitle: "Channel energy to task", duration: "2-5 min", category: "Quick" });
    }
    return base.slice(0, 6);
  }, [stress, selectedMoods]);

  // Breath phase mapping
  const breathDurations = useMemo<[number, number, number, number]>(() => {
    if (breathMode === "Box") return [4, 4, 4, 4];
    if (breathMode === "4-7-8") return [4, 7, 8, 0];
    return customPattern;
  }, [breathMode, customPattern]);

  // Breathing engine
  useEffect(() => {
    if (!breathRunning) return;
    let currentPhase: typeof breathPhase = breathPhase;
    let [inh, hold, ex, hold2] = breathDurations;

    const getNextPhase = (p: typeof breathPhase): typeof breathPhase => {
      if (p === "Inhale") return hold > 0 ? "Hold" : "Exhale";
      if (p === "Hold") return "Exhale";
      if (p === "Exhale") return hold2 > 0 ? "Hold2" : "Inhale";
      return "Inhale";
    };
    const getPhaseDuration = (p: typeof breathPhase): number => {
      if (p === "Inhale") return inh || 0;
      if (p === "Hold") return hold || 0;
      if (p === "Exhale") return ex || 0;
      return hold2 || 0;
    };

    // initialize
    setPhaseSecondsLeft(getPhaseDuration(currentPhase));
    const tick = () => {
      setPhaseSecondsLeft((s) => {
        if (s > 1) return s - 1;
        // move to next
        const next = getNextPhase(currentPhase);
        currentPhase = next;
        setBreathPhase(next);
        return getPhaseDuration(next);
      });
      breathTimerRef.current = window.setTimeout(tick, 1000);
    };
    breathTimerRef.current = window.setTimeout(tick, 1000);

    return () => {
      if (breathTimerRef.current) {
        window.clearTimeout(breathTimerRef.current);
        breathTimerRef.current = null;
      }
    };
  }, [breathRunning, breathDurations]); // eslint-disable-line react-hooks/exhaustive-deps

  // Puzzle setup
  const startPuzzle = () => {
    const nums = Array.from({ length: 9 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    setPuzzleNumbers(nums);
    setPuzzleNext(1);
    setPuzzleActive(true);
    setPuzzleMessage("Tap 1 through 9 in order");
  };

  const tapPuzzle = (n: number) => {
    if (!puzzleActive) return;
    if (n === puzzleNext) {
      if (n === 9) {
        setPuzzleActive(false);
        setPuzzleMessage("Nice! Completed.");
      } else {
        setPuzzleNext(n + 1);
        setPuzzleMessage(`Good. Next: ${n + 1}`);
      }
    } else {
      setPuzzleMessage("Reset focus. Start from the current number.");
    }
  };

  // Build simple pattern analysis from recent check-ins (already fetched by fetchData)
  const timeOfDayPattern = useMemo(() => {
    // Buckets: Morning(5-11), Afternoon(11-17), Evening(17-22), Night(22-5)
    const buckets: Record<"Morning" | "Afternoon" | "Evening" | "Night", number[]> = {
      Morning: [],
      Afternoon: [],
      Evening: [],
      Night: [],
    };
    recent.forEach((c) => {
      const d = new Date(c.created_at);
      const h = d.getHours();
      const slot =
        h >= 5 && h < 11 ? "Morning" : h >= 11 && h < 17 ? "Afternoon" : h >= 17 && h < 22 ? "Evening" : "Night";
      buckets[slot].push(c.stress_level);
    });
    const avg = (arr: number[]) => (arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10 : 0);
    return [
      { label: "Morning", avg: avg(buckets.Morning) },
      { label: "Afternoon", avg: avg(buckets.Afternoon) },
      { label: "Evening", avg: avg(buckets.Evening) },
      { label: "Night", avg: avg(buckets.Night) },
    ];
  }, [recent]);

  // Predictive local nudge based on current time and pattern
  useEffect(() => {
    const now = new Date();
    const h = now.getHours();
    const slot =
      h >= 5 && h < 11 ? "Morning" : h >= 11 && h < 17 ? "Afternoon" : h >= 17 && h < 22 ? "Evening" : "Night";
    const slotAvg = timeOfDayPattern.find((s) => s.label === slot)?.avg ?? 0;

    if (slotAvg >= 6) {
      setNudge(`This ${slot.toLowerCase()}, your stress tends to be higher. Try a 2-min breathing or calming music.`);
      if (allowNotifications === "granted") {
        new Notification("Time for a quick reset", {
          body: `This ${slot.toLowerCase()}, your stress tends to be higher. Try a short reset.`,
          silent: true,
        });
      }
    } else {
      setNudge(null);
    }
  }, [timeOfDayPattern, allowNotifications]);

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    try {
      const res = await Notification.requestPermission();
      setAllowNotifications(res as "default" | "granted" | "denied");
    } catch {
      // ignore
    }
  };

  const filteredPlaylists = useMemo(() => {
    return CURATED_PLAYLISTS.filter(
      (p) => p.category === musicCategory && (musicFilterMinutes === 0 || p.minutes >= musicFilterMinutes)
    );
  }, [musicCategory, musicFilterMinutes]);

  const reliefActive = activeTab === "Relief";
  const insightsActive = activeTab === "Insights";

  const handleToggleMood = (m: MoodCategory) => {
    setSelectedMoods((prev) => {
      const n = new Set(prev);
      if (n.has(m)) n.delete(m);
      else n.add(m);
      return n as Set<MoodCategory>;
    });
  };

  const handlePreset = (v: number) => setStress(v);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-50 to-neutral-100 text-neutral-900 dark:from-neutral-950 dark:to-neutral-900 dark:text-neutral-50">
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        {!reliefActive && !insightsActive && (
          <>
            {/* Top: Stress Meter + Quick Actions */}
            <section className="grid gap-6 md:grid-cols-3">
              {/* Stress Meter */}
              <div className="card md:col-span-2 p-5 sm:p-6">
                <h2 className="text-lg font-semibold mb-4">Stress Meter</h2>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative mx-auto flex h-48 w-48 shrink-0 items-center justify-center">
                    <div
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${gradientColor} opacity-80`}
                    />
                    <div className={`absolute inset-0 rounded-full ring-8 ${ringColor}`} />
                    <div className="relative z-10 flex flex-col items-center justify-center rounded-full bg-white/70 px-6 py-6 text-center backdrop-blur dark:bg-neutral-900/60">
                      <span className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Level
                      </span>
                      <span className="text-5xl font-bold tabular-nums">{stress}</span>
                      <span className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                        {stressLabel}
                      </span>
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        Drag the slider or choose a preset
                      </span>
                      <div className="flex gap-2">
                        {[1, 3, 5, 7, 9].map((s) => (
                          <button
                            key={s}
                            className="chip hover:bg-neutral-100 dark:hover:bg-neutral-700"
                            onClick={() => handlePreset(s)}
                            aria-label={`Set stress to ${s}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={stress}
                      onChange={(e) => setStress(parseInt(e.target.value, 10))}
                      className="w-full accent-indigo-600"
                      aria-label="Stress level"
                    />
                    <div className="mt-3 flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                      <span>0</span>
                      <span>5</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Tips */}
              <div className="card p-5 sm:p-6">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="grid gap-2">
                  <button className="btn-primary">2-min Breathing</button>
                  <button className="btn-outline">Grounding (5-4-3-2-1)</button>
                  <button className="btn-outline">Body Scan (5 min)</button>
                  <button className="btn-outline">Quick Stretch (3 min)</button>
                </div>
                <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
                  These are instant tools for now. We’ll personalize them later.
                </p>
              </div>
            </section>

            {/* Mood Check-In */}
            <section className="mt-6 grid gap-6 lg:grid-cols-3">
              <div className="card p-5 sm:p-6 lg:col-span-2">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">Mood Check-In</h2>
                  <div className="flex gap-2">
                    {(["Quick", "Daily", "Detailed"] as CheckInMode[]).map((m) => (
                      <button
                        key={m}
                        className={`btn ${mode === m ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "btn-outline"}`}
                        onClick={() => setMode(m)}
                        aria-pressed={mode === m}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-4">
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    Select the moods that best describe you right now.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {moodOptions.map((m) => {
                      const active = selectedMoods.has(m);
                      return (
                        <button
                          key={m}
                          onClick={() => handleToggleMood(m)}
                          className={`chip transition-colors ${
                            active
                              ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-500/10 dark:text-indigo-300"
                              : ""
                          }`}
                          aria-pressed={active}
                        >
                          {m}
                        </button>
                      );
                    })}
                  </div>

                  {mode !== "Quick" && (
                    <div className="mt-5">
                      <label htmlFor="notes" className="mb-1 block text-sm font-medium">
                        Notes (optional)
                      </label>
                      <textarea
                        id="notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={mode === "Daily" ? 3 : 6}
                        placeholder={
                          mode === "Daily"
                            ? "What influenced your mood today? (sleep, work, social, etc.)"
                            : "Describe your emotions, triggers, and helpful actions in detail..."
                        }
                        className="w-full resize-y rounded-lg border border-neutral-300 bg-white p-3 text-sm outline-none ring-0 transition-colors placeholder:text-neutral-400 focus:border-indigo-500 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                    </div>
                  )}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button className="btn-primary" onClick={saveCheckIn} disabled={saving}>
                      {saving ? "Saving..." : "Save Check-In"}
                    </button>
                    <button
                      className="btn-outline"
                      onClick={() => {
                        setNotes("");
                        setSelectedMoods(new Set());
                      }}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Preview Insights (now simple live analytics) */}
              <div className="card p-5 sm:p-6">
                <h3 className="text-lg font-semibold">Trends</h3>
                <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                  Average stress over the last 7 days
                </p>

                <div className="mt-4 grid grid-cols-7 gap-2">
                  {trend.map((t) => (
                    <div key={t.day} className="flex flex-col items-center gap-2">
                      <div className="h-24 w-6 rounded bg-neutral-200 dark:bg-neutral-800 overflow-hidden">
                        <div
                          className={`w-full bg-gradient-to-t from-rose-500 to-amber-400`}
                          style={{ height: `${(t.avg / 10) * 100}%` }}
                          aria-hidden
                        />
                      </div>
                      <div className="text-[10px] text-neutral-500 dark:text-neutral-400">
                        {t.day.slice(5)}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium">Recent Check-Ins</h4>
                  <ul className="mt-2 space-y-2 text-sm">
                    {recent.map((c) => (
                      <li key={c.id} className="flex items-center justify-between">
                        <span className="text-neutral-600 dark:text-neutral-300">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                        <span className="font-medium">
                          Stress {c.stress_level} · {c.mode}
                        </span>
                      </li>
                    ))}
                    {recent.length === 0 && (
                      <li className="text-neutral-500 dark:text-neutral-400">
                        No check-ins yet.
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </section>
            {nudge && (
              <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">Gentle Nudge</div>
                    <div className="mt-1 text-sm">{nudge}</div>
                  </div>
                  {allowNotifications !== "granted" && (
                    <button className="btn-outline text-amber-900 dark:text-amber-200" onClick={requestNotificationPermission}>
                      Enable Notifications
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}

        {reliefActive && (
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Breathing Guide */}
            <div className="card p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Breathing Guide</h2>
                <div className="flex gap-2">
                  {(["Box", "4-7-8", "Custom"] as const).map((m) => (
                    <button
                      key={m}
                      className={`btn ${breathMode === m ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "btn-outline"}`}
                      onClick={() => {
                        setBreathMode(m);
                        setBreathPhase("Inhale");
                        setBreathRunning(false);
                      }}
                      aria-pressed={breathMode === m}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {breathMode === "Custom" && (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(["In", "Hold", "Out", "Hold"] as const).map((lbl, idx) => (
                    <label key={idx} className="flex items-center gap-2 text-sm">
                      <span className="w-10 text-neutral-600 dark:text-neutral-300">{lbl}</span>
                      <input
                        type="number"
                        min={0}
                        max={20}
                        value={customPattern[idx]}
                        onChange={(e) => {
                          const v = Math.max(0, Math.min(20, Number(e.target.value) || 0));
                          setCustomPattern((p) => {
                            const arr = [...p] as [number, number, number, number];
                            arr[idx] = v;
                            return arr;
                          });
                        }}
                        className="w-20 rounded-lg border border-neutral-300 bg-white px-2 py-1 dark:border-neutral-700 dark:bg-neutral-900"
                      />
                      <span className="text-neutral-500 dark:text-neutral-400">s</span>
                    </label>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col items-center justify-center">
                <div
                  className="relative flex h-56 w-56 items-center justify-center rounded-full bg-white/70 backdrop-blur dark:bg-neutral-900/60"
                  aria-live="polite"
                >
                  {/* Animated ring scaling with phase */}
                  <div
                    className={`absolute inset-0 rounded-full transition-transform duration-1000 ease-in-out`}
                    style={{
                      transform:
                        breathPhase === "Inhale"
                          ? "scale(1.08)"
                          : breathPhase === "Exhale"
                          ? "scale(0.92)"
                          : "scale(1.0)",
                      boxShadow:
                        breathPhase === "Inhale"
                          ? "0 0 0 10px rgba(79,70,229,0.25)"
                          : "0 0 0 10px rgba(79,70,229,0.15)",
                    }}
                  />
                  <div className="relative z-10 text-center">
                    <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">Phase</div>
                    <div className="text-3xl font-bold">{breathPhase}</div>
                    <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                      {phaseSecondsLeft}s
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    className={`btn ${breathRunning ? "bg-rose-600 text-white hover:bg-rose-700" : "btn-primary"}`}
                    onClick={() => {
                      if (breathRunning) {
                        setBreathRunning(false);
                      } else {
                        setBreathPhase("Inhale");
                        setBreathRunning(true);
                      }
                    }}
                  >
                    {breathRunning ? "Stop" : "Start"}
                  </button>
                  {!breathRunning && (
                    <span className="text-sm text-neutral-600 dark:text-neutral-300">
                      Tip: Breathe gently. Comfort over intensity.
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Personalized Suggestions */}
            <div className="card p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Suggestions for You</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Based on your current stress and moods.
              </p>
              <ul className="mt-4 space-y-3">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                    <div>
                      <div className="font-medium">{s.title}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">{s.subtitle}</div>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {s.category} • {s.duration}
                      </div>
                    </div>
                    <button
                      className="btn-outline px-3 py-1.5 text-sm"
                      onClick={() => {
                        // soft action mapping
                        if (s.title.includes("Breath")) {
                          setActiveTab("Relief");
                          setBreathMode(s.title.includes("4-7-8") ? "4-7-8" : "Box");
                          setBreathPhase("Inhale");
                          setBreathRunning(true);
                        } else if (s.title.includes("Focus Puzzle")) {
                          setActiveTab("Relief");
                          startPuzzle();
                        }
                      }}
                    >
                      Try
                    </button>
                  </li>
                ))}
                {suggestions.length === 0 && (
                  <li className="text-sm text-neutral-600 dark:text-neutral-300">No suggestions yet.</li>
                )}
              </ul>
            </div>

            {/* Focus Puzzle */}
            <div className="card p-5 sm:p-6 lg:col-span-2">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Focus Puzzle</h2>
                <button className="btn-primary" onClick={startPuzzle}>
                  {puzzleActive ? "Reset" : "Start"}
                </button>
              </div>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Tap the numbers from 1 to 9 in order. If you miss, refocus and continue.
              </p>
              <div className="mt-4 grid grid-cols-3 gap-3 sm:gap-4">
                {puzzleNumbers.map((n) => {
                  const isNext = n === puzzleNext && puzzleActive;
                  return (
                    <button
                      key={n}
                      onClick={() => tapPuzzle(n)}
                      className={`h-16 rounded-xl text-lg font-semibold shadow-sm transition-colors sm:h-20 ${
                        isNext
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "bg-white text-neutral-900 hover:bg-neutral-50 dark:bg-neutral-900 dark:text-neutral-50 dark:hover:bg-neutral-800"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 text-sm text-neutral-700 dark:text-neutral-300">{puzzleMessage}</div>
            </div>

            {/* Color Soothe */}
            <div className="card p-5 sm:p-6">
              <h2 className="text-lg font-semibold">Color Soothe</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Gentle color waves help settle your mind. Adjust hue and speed to taste.
              </p>
              <div
                className="mt-4 h-40 w-full overflow-hidden rounded-xl"
                style={{
                  background: `linear-gradient(135deg, hsl(${colorHue} 70% 65%) 0%, hsl(${(colorHue + 40) % 360} 70% 65%) 50%, hsl(${(colorHue + 80) % 360} 70% 65%) 100%)`,
                  animation: `soothe ${Math.max(2, colorSpeed)}s ease-in-out infinite alternate`,
                }}
              />
              <div className="mt-4 space-y-3">
                <label className="block text-sm">
                  Hue
                  <input
                    type="range"
                    min={0}
                    max={359}
                    value={colorHue}
                    onChange={(e) => setColorHue(parseInt(e.target.value, 10))}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </label>
                <label className="block text-sm">
                  Speed
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={colorSpeed}
                    onChange={(e) => setColorSpeed(parseInt(e.target.value, 10))}
                    className="mt-2 w-full accent-indigo-600"
                  />
                </label>
              </div>
            </div>

            {/* Music Hub */}
            <div className="card p-5 sm:p-6 lg:col-span-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Music & Sounds</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {(["Calm", "Focus", "Energize", "Sleep", "Nature"] as MusicCategory[]).map((c) => (
                    <button
                      key={c}
                      className={`btn ${musicCategory === c ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "btn-outline"}`}
                      onClick={() => {
                        setMusicCategory(c);
                        setSelectedPlaylist(null);
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-4">
                <label className="text-sm">
                  Min duration
                  <input
                    type="range"
                    min={0}
                    max={120}
                    step={15}
                    value={musicFilterMinutes}
                    onChange={(e) => setMusicFilterMinutes(parseInt(e.target.value, 10))}
                    className="ml-3 align-middle accent-indigo-600"
                  />
                  <span className="ml-2 text-neutral-600 dark:text-neutral-300">
                    {musicFilterMinutes === 0 ? "Any" : `${musicFilterMinutes} min+`}
                  </span>
                </label>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {filteredPlaylists.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPlaylist(p)}
                    className="flex items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-white p-3 text-left shadow-sm hover:bg-neutral-50 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:bg-neutral-800"
                  >
                    <div>
                      <div className="font-medium">{p.title}</div>
                      <div className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
                        {p.category} • {p.minutes} min • {p.provider}
                      </div>
                    </div>
                    <span className="chip">Play</span>
                  </button>
                ))}
                {filteredPlaylists.length === 0 && (
                  <div className="text-sm text-neutral-600 dark:text-neutral-300">No matches. Lower duration filter.</div>
                )}
              </div>

              {selectedPlaylist && (
                <div className="mt-5">
                  <div className="mb-2 text-sm text-neutral-600 dark:text-neutral-300">
                    Now Playing: <span className="font-medium">{selectedPlaylist.title}</span>
                  </div>
                  <div className="aspect-video w-full overflow-hidden rounded-xl">
                    <iframe
                      src={
                        selectedPlaylist.type === "playlist"
                          ? `https://www.youtube.com/embed/videoseries?list=${selectedPlaylist.id}`
                          : `https://www.youtube.com/embed/${selectedPlaylist.id}?rel=0`
                      }
                      title={selectedPlaylist.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="h-full w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {insightsActive && (
          <section className="grid gap-6 lg:grid-cols-3">
            {/* Smart Analytics Overview */}
            <div className="card p-5 sm:p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold">Smart Analytics</h2>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Patterns from your recent check-ins help predict when support might help.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {/* Time of day */}
                <div>
                  <div className="mb-2 text-sm font-medium">Stress by time of day</div>
                  <div className="flex gap-3">
                    {timeOfDayPattern.map((b) => (
                      <div key={b.label} className="flex flex-1 flex-col items-center">
                        <div className="h-28 w-6 overflow-hidden rounded bg-neutral-200 dark:bg-neutral-800">
                          <div
                            className="h-full w-full bg-gradient-to-t from-rose-500 to-amber-400"
                            style={{ height: `${(b.avg / 10) * 100 || 2}%` }}
                          />
                        </div>
                        <div className="mt-1 text-xs text-neutral-600 dark:text-neutral-300">{b.label}</div>
                        <div className="text-xs text-neutral-500 dark:text-neutral-400">{b.avg}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested actions */}
                <div>
                  <div className="mb-2 text-sm font-medium">Suggested quick actions</div>
                  <ul className="space-y-2 text-sm">
                    <li className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      When stress gets above 6, try 4-7-8 breathing for 3 minutes.
                    </li>
                    <li className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      If afternoons trend higher, schedule a short walk or a focus playlist.
                    </li>
                    <li className="rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                      Use Color Soothe while journaling to downshift arousal.
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Notifications control */}
            <div className="card p-5 sm:p-6">
              <h3 className="text-lg font-semibold">Predictive Notifications</h3>
              <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
                Receive gentle nudges at times you might need support, based on your patterns.
              </p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-neutral-200 p-3 dark:border-neutral-800">
                  <div>
                    <div className="font-medium">Browser Notifications</div>
                    <div className="text-neutral-600 dark:text-neutral-300">
                      Current status: <span className="font-mono">{allowNotifications}</span>
                    </div>
                  </div>
                  <button className="btn-primary" onClick={requestNotificationPermission}>
                    {allowNotifications === "granted" ? "Enabled" : "Enable"}
                  </button>
                </div>
                <div className="rounded-lg border border-neutral-200 p-3 text-neutral-600 dark:border-neutral-800 dark:text-neutral-300">
                  Note: This demo uses the browser Notification API locally. Service worker push can be added later.
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Navigation Structure (bottom dock) */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-50 mx-auto w-full max-w-3xl px-4 pb-5"
        >
          <div className="card flex items-center justify-between gap-2 rounded-2xl px-3 py-2">
            <NavButton label="Home" active={activeTab === "Home"} onClick={() => setActiveTab("Home")} />
            <NavButton label="Relief" active={activeTab === "Relief"} onClick={() => setActiveTab("Relief")} />
            <NavButton label="Insights" active={activeTab === "Insights"} onClick={() => setActiveTab("Insights")} />
            <NavButton label="Journal" active={activeTab === "Journal"} onClick={() => setActiveTab("Journal")} />
            <NavButton label="Profile" active={activeTab === "Profile"} onClick={() => setActiveTab("Profile")} />
          </div>
        </nav>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/70 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-rose-500" aria-hidden />
          <span className="text-base font-semibold">Moodi</span>
        </div>
        <div className="flex items-center gap-2">
          <ThemeBadge />
          <a href="/" className="btn-outline px-3 py-1.5 text-sm">
            OneAtom
          </a>
          <button className="btn-outline px-3 py-1.5 text-sm">Sign In</button>
        </div>
      </div>
    </header>
  );
}

function ThemeBadge() {
  return (
    <span className="chip">
      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
      Calm Mode
    </span>
  );
}

function NavButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800/70"
      }`}
      aria-current={active ? "page" : undefined}
    >
      {label}
    </button>
  );
}

function InsightBar({
  label,
  pct,
  color,
}: {
  label: string;
  pct: number;
  color: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="text-neutral-500 dark:text-neutral-400">{clamped}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
        <div
          className={`h-full ${color}`}
          style={{ width: `${clamped}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}
