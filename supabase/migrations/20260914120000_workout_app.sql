-- Workout app schema: adaptive full-body training, Atomic Habits habit loops,
-- and 5AM Club morning routine tracking.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- workout_profiles: body metrics + goals that drive the adaptive engine
-- ---------------------------------------------------------------------------
create table if not exists public.workout_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  height_cm numeric(5, 1) not null check (height_cm > 0),
  weight_kg numeric(5, 1) not null check (weight_kg > 0),
  sex text check (sex in ('male', 'female', 'other')),
  birth_year int check (birth_year between 1900 and 2100),
  self_reported_level text not null default 'beginner'
    check (self_reported_level in ('beginner', 'intermediate', 'advanced')),
  primary_goal text not null default 'general_fitness'
    check (primary_goal in ('lose_weight', 'build_muscle', 'general_fitness', 'endurance', 'mobility')),
  equipment text[] not null default array['none']::text[],
  injury_notes text,
  identity_statement text,
  wake_time time,
  fitness_tier text not null default 'foundation'
    check (fitness_tier in ('foundation', 'building', 'progressing', 'advanced')),
  onboarded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists workout_profiles_set_updated_at on public.workout_profiles;
create trigger workout_profiles_set_updated_at
  before update on public.workout_profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- workout_sessions: one generated/adapted routine per day
-- ---------------------------------------------------------------------------
create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  session_date date not null default current_date,
  focus text not null default 'full_body'
    check (focus in ('full_body', 'upper', 'lower', 'core', 'mobility', 'cardio')),
  tier_at_time text not null,
  status text not null default 'planned'
    check (status in ('planned', 'in_progress', 'completed', 'skipped')),
  plan jsonb not null default '[]'::jsonb,
  overall_rpe int check (overall_rpe between 1 and 10),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, session_date)
);

-- ---------------------------------------------------------------------------
-- session_exercise_logs: per-exercise performance for progression
-- ---------------------------------------------------------------------------
create table if not exists public.session_exercise_logs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  exercise_id text not null,
  order_index int not null default 0,
  target_sets int not null default 3,
  target_reps int not null default 10,
  completed_sets int,
  completed_reps int,
  weight_kg numeric(6, 2),
  rpe int check (rpe between 1 and 10),
  completed boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists session_exercise_logs_session_idx
  on public.session_exercise_logs (session_id);

-- ---------------------------------------------------------------------------
-- habits: Atomic Habits four-laws habit loop
-- ---------------------------------------------------------------------------
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  identity_statement text,
  cue text,
  craving text,
  response text,
  reward text,
  cue_time time,
  frequency text[] not null default array['daily']::text[],
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  completed boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  unique (habit_id, log_date)
);

-- ---------------------------------------------------------------------------
-- morning_routine_logs: 5AM Club 20/20/20 (Move / Reflect / Grow)
-- ---------------------------------------------------------------------------
create table if not exists public.morning_routine_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  log_date date not null default current_date,
  move_minutes int not null default 0 check (move_minutes >= 0),
  reflect_minutes int not null default 0 check (reflect_minutes >= 0),
  grow_minutes int not null default 0 check (grow_minutes >= 0),
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, log_date)
);

-- ---------------------------------------------------------------------------
-- Row Level Security: every row is only visible to its owner
-- ---------------------------------------------------------------------------
alter table public.workout_profiles enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.session_exercise_logs enable row level security;
alter table public.habits enable row level security;
alter table public.habit_logs enable row level security;
alter table public.morning_routine_logs enable row level security;

create policy "workout_profiles: owner full access"
  on public.workout_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "workout_sessions: owner full access"
  on public.workout_sessions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "session_exercise_logs: owner full access"
  on public.session_exercise_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habits: owner full access"
  on public.habits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "habit_logs: owner full access"
  on public.habit_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "morning_routine_logs: owner full access"
  on public.morning_routine_logs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
