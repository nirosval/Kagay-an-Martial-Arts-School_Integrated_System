-- ============================================================
-- Kagay-an Martial Arts School — Supabase Schema
-- Run this entire file in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Players table (achievements stored as JSONB to match app model)
create table if not exists public.players (
  id           text        primary key,
  name         text        not null,
  birthdate    text        not null,
  age          integer     not null,
  weight_kg    numeric     not null,
  height_cm    numeric     not null,
  year_started integer     not null,
  membership_status text   not null default 'active_member'
                           check (membership_status in ('active_member','active_nonmember','inactive')),
  belt_rank    text        not null default 'White Belt',
  photo_url    text,
  achievements jsonb       not null default '[]'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.players enable row level security;

-- Open policy: app manages its own auth, so allow all via anon key
create policy "Allow all operations"
  on public.players
  for all
  using (true)
  with check (true);

-- Seed demo players (only if table is empty)
insert into public.players
  (id, name, birthdate, age, weight_kg, height_cm, year_started, membership_status, belt_rank, achievements, created_at, updated_at)
select
  'seed-1','Carlos Dela Cruz','2005-03-15',20,68,172,2018,'active_member','Black Belt',
  '[{"id":"a1","title":"Regional Champion","date":"2023-08-12","description":"1st place kumite division"},{"id":"a2","title":"National Silver Medal","date":"2024-03-05","description":"Kata team event"}]'::jsonb,
  now(), now()
where not exists (select 1 from public.players limit 1);

insert into public.players
  (id, name, birthdate, age, weight_kg, height_cm, year_started, membership_status, belt_rank, achievements, created_at, updated_at)
select
  'seed-2','Maria Santos','2008-07-22',16,52,158,2020,'active_nonmember','Brown Belt',
  '[{"id":"a3","title":"City Gold Medal","date":"2024-01-20","description":"Kata individual"}]'::jsonb,
  now(), now()
where not exists (select 1 from public.players where id != 'seed-1' limit 1);

insert into public.players
  (id, name, birthdate, age, weight_kg, height_cm, year_started, membership_status, belt_rank, achievements, created_at, updated_at)
select
  'seed-3','Jose Reyes','2010-11-08',14,45,155,2022,'inactive','Blue Belt',
  '[]'::jsonb,
  now(), now()
where not exists (select 1 from public.players where id not in ('seed-1','seed-2') limit 1);
