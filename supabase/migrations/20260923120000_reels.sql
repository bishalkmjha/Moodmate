-- Reels: short workout-clip posts, likes, and the storage bucket that
-- backs them. A lightweight social feed to give people a reason to open
-- the app besides "did I train today."

create table if not exists public.reels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  video_path text not null,
  caption text,
  created_at timestamptz not null default now()
);

create table if not exists public.reel_likes (
  reel_id uuid not null references public.reels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (reel_id, user_id)
);

create index if not exists reels_created_at_idx on public.reels (created_at desc);
create index if not exists reel_likes_reel_idx on public.reel_likes (reel_id);

alter table public.reels enable row level security;
alter table public.reel_likes enable row level security;

drop policy if exists "reels: readable by any authenticated user" on public.reels;
create policy "reels: readable by any authenticated user"
  on public.reels for select
  using (auth.role() = 'authenticated');

drop policy if exists "reels: insert own" on public.reels;
create policy "reels: insert own"
  on public.reels for insert
  with check (auth.uid() = user_id);

drop policy if exists "reels: delete own" on public.reels;
create policy "reels: delete own"
  on public.reels for delete
  using (auth.uid() = user_id);

drop policy if exists "reel_likes: readable by any authenticated user" on public.reel_likes;
create policy "reel_likes: readable by any authenticated user"
  on public.reel_likes for select
  using (auth.role() = 'authenticated');

drop policy if exists "reel_likes: insert own" on public.reel_likes;
create policy "reel_likes: insert own"
  on public.reel_likes for insert
  with check (auth.uid() = user_id);

drop policy if exists "reel_likes: delete own" on public.reel_likes;
create policy "reel_likes: delete own"
  on public.reel_likes for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: a public 'reels' bucket. Playback reads the public URL directly
-- (no RLS needed for that); uploads/deletes are restricted to the caller's
-- own folder, keyed by their user id (e.g. "<user_id>/<uuid>.mp4").
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('reels', 'reels', true, 104857600, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do nothing;

drop policy if exists "reels bucket: public read" on storage.objects;
create policy "reels bucket: public read"
  on storage.objects for select
  using (bucket_id = 'reels');

drop policy if exists "reels bucket: insert own folder" on storage.objects;
create policy "reels bucket: insert own folder"
  on storage.objects for insert
  with check (bucket_id = 'reels' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "reels bucket: delete own folder" on storage.objects;
create policy "reels bucket: delete own folder"
  on storage.objects for delete
  using (bucket_id = 'reels' and (storage.foldername(name))[1] = auth.uid()::text);
