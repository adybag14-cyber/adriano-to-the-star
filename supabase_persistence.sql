-- EXOPLANET PIONEER - SUPABASE SCHEMA
-- Phase 4: Online Features & Cloud Persistence
-- UPDATED: Idempotent (Safe to run multiple times)

-- 1. PROFILES
-- Links to Supabase Auth.users. Stores public user data.
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

-- RLS
alter table public.profiles enable row level security;

drop policy if exists "Public profiles are viewable by everyone." on profiles;
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on profiles;
create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on profiles;
create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- 2. GAME SAVES
-- Stores full game state as JSONB.
create table if not exists public.game_saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  game_id text not null, -- 'ep' for Exoplanet Pioneer
  slot_id int not null,
  save_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  constraint one_save_per_slot unique (user_id, game_id, slot_id)
);

-- RLS
alter table public.game_saves enable row level security;

drop policy if exists "Users can manage their own saves." on game_saves;
create policy "Users can manage their own saves."
  on game_saves for all
  using ( auth.uid() = user_id );

-- 3. LEADERBOARDS
-- Stores high scores and achievements.
create table if not exists public.leaderboards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  game_id text not null,
  score bigint not null,
  details jsonb, -- Extra stats like "Day reached", "Population", etc.
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.leaderboards enable row level security;

drop policy if exists "Leaderboards are viewable by everyone." on leaderboards;
create policy "Leaderboards are viewable by everyone."
  on leaderboards for select
  using ( true );

drop policy if exists "Users can insert their own scores." on leaderboards;
create policy "Users can insert their own scores."
  on leaderboards for insert
  with check ( auth.uid() = user_id );

-- 4. CLAIMED SYSTEMS (MULTIPLAYER LITE)
-- Tracks who discovered/claimed which star system.
create table if not exists public.claimed_systems (
  system_id text primary key, -- e.g. 'kepler_186f'
  user_id uuid references auth.users not null,
  system_name text,
  coordinates jsonb,
  claimed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.claimed_systems enable row level security;

drop policy if exists "Claims are viewable by everyone." on claimed_systems;
create policy "Claims are viewable by everyone."
  on claimed_systems for select
  using ( true );

drop policy if exists "Users can claim systems." on claimed_systems;
create policy "Users can claim systems."
  on claimed_systems for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can update their own claims." on claimed_systems;
create policy "Users can update their own claims."
  on claimed_systems for update
  using ( auth.uid() = user_id );

-- 5. STORAGE BUCKETS
-- (Optional: SQL usually can't create storage buckets directly in standard Supabase setup unless enabled extensions, better done in Dashboard)

-- 6. FUNCTIONS & TRIGGERS

-- Handle New User -> Create Profile automatically
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, avatar_url)
  values (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'avatar_url')
  on conflict (id) do nothing; -- Handle conflict gracefully
  return new;
end;
$$ language plpgsql security definer;

-- Re-create Trigger safely
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update 'updated_at' column automatically
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists update_profiles_updated_at on public.profiles;
create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.update_updated_at();

drop trigger if exists update_game_saves_updated_at on public.game_saves;
create trigger update_game_saves_updated_at
  before update on public.game_saves
  for each row execute procedure public.update_updated_at();
