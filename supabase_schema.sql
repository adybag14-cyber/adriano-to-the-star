-- Exoplanet Pioneer & Star Is Dons - Supabase Schema
-- Run this in the Supabase SQL Editor

-- 0. EXTENSIONS (Optional, gen_random_uuid comes with newer postgres, but pgcrypto is good standard)
create extension if not exists pgcrypto;

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  username text unique,
  avatar_url text,
  updated_at timestamp with time zone,
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable RLS (Safe to run multiple times)
alter table public.profiles enable row level security;

-- Policies (Drop first to avoid "policy already exists" error)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

drop policy if exists "Users can insert their own profile." on public.profiles;
create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

drop policy if exists "Users can update own profile." on public.profiles;
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 2. GAME SAVES
create table if not exists public.game_saves (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  game_id text not null, -- e.g. 'exoplanet-pioneer'
  slot_id int default 1,
  save_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id, game_id, slot_id)
);

alter table public.game_saves enable row level security;

drop policy if exists "Users can CRUD their own saves." on public.game_saves;
create policy "Users can CRUD their own saves."
  on public.game_saves for all
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- 3. LEADERBOARDS
create table if not exists public.leaderboards (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) not null,
  game_id text not null,
  score int not null,
  details jsonb,
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.leaderboards enable row level security;

drop policy if exists "Leaderboards are viewable by everyone." on public.leaderboards;
create policy "Leaderboards are viewable by everyone."
  on public.leaderboards for select
  using ( true );

drop policy if exists "Users can insert their own scores." on public.leaderboards;
create policy "Users can insert their own scores."
  on public.leaderboards for insert
  with check ( auth.uid() = user_id );

-- 4. TRIGGERS
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger: check if exists via drop
-- Trigger: check if exists via drop
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. TRADE OFFERS (Multiplayer Trading)
create table if not exists public.trade_offers (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references public.profiles(id) not null,
  buyer_id uuid references public.profiles(id),
  offering jsonb not null, -- { "minerals": 100, "energy": 50 }
  requesting jsonb not null, -- { "alloys": 20 }
  status text default 'open', -- 'open', 'completed', 'cancelled'
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  completed_at timestamp with time zone
);

alter table public.trade_offers enable row level security;

drop policy if exists "Trade offers are viewable by everyone." on public.trade_offers;
create policy "Trade offers are viewable by everyone."
  on public.trade_offers for select
  using ( true );

drop policy if exists "Users can insert their own trades." on public.trade_offers;
create policy "Users can insert their own trades."
  on public.trade_offers for insert
  with check ( auth.uid() = seller_id );

drop policy if exists "Users can update trades they're part of." on public.trade_offers;
create policy "Users can update trades they're part of."
  on public.trade_offers for update
  using ( auth.uid() = seller_id or auth.uid() = buyer_id );

-- 6. ADD STATS TO PROFILES
do $$
begin
  if not exists (
    select 1 from information_schema.columns 
    where table_name = 'profiles' and column_name = 'stats'
  ) then
    alter table public.profiles add column stats jsonb default '{}';
  end if;
end $$;
