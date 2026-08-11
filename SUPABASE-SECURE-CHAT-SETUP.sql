-- Secure Chat Setup Script
-- Run this in your Supabase SQL Editor

-- ============================================================================
-- 1. PROFILES TABLE (User Directory)
-- ============================================================================

-- Create a table for public user profiles
create table public.profiles (
  id uuid references auth.users(id) on delete cascade not null primary key,
  username text unique,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone default timezone('utc'::text, now()),
  
  constraint username_length check (char_length(username) >= 3)
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Policies
create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Trigger to automatically create a profile entry when a new user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url)
  values (
    new.id, 
    new.raw_user_meta_data->>'username', 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

-- Drop trigger if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================================
-- 2. STORAGE BUCKET
-- ============================================================================

-- Create Storage Bucket for Secure Files
-- Note: We use a single bucket 'secure-files' for both keys and messages
insert into storage.buckets (id, name, public)
values ('secure-files', 'secure-files', false)
on conflict (id) do nothing; -- Prevent error if already exists

-- ============================================================================
-- 3. MESSAGE METADATA
-- ============================================================================

-- Create Metadata Table for Messages
create table if not exists public.secure_messages_metadata (
    id uuid default gen_random_uuid() primary key,
    sender_id uuid references auth.users(id) not null,
    receiver_id uuid references auth.users(id) not null,
    storage_path text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.secure_messages_metadata enable row level security;

-- RLS Policies for Metadata Table

-- Allow users to see messages they sent or received
drop policy if exists "Users can view their own messages" on public.secure_messages_metadata;
create policy "Users can view their own messages"
on public.secure_messages_metadata for select
using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Allow users to insert messages they send
drop policy if exists "Users can insert sent messages" on public.secure_messages_metadata;
create policy "Users can insert sent messages"
on public.secure_messages_metadata for insert
with check (auth.uid() = sender_id);

-- ============================================================================
-- 4. STORAGE POLICIES
-- ============================================================================

-- Public Keys: Everyone can read everyone's public key
drop policy if exists "Public Keys are public" on storage.objects;
create policy "Public Keys are public"
on storage.objects for select
using ( bucket_id = 'secure-files' and name like 'keys/%/public.json' );

-- Private Keys: Only the owner can read/write their own private key
drop policy if exists "Users can manage their own private key" on storage.objects;
create policy "Users can manage their own private key"
on storage.objects for all
using ( bucket_id = 'secure-files' and name like 'keys/' || auth.uid() || '/private.enc' )
with check ( bucket_id = 'secure-files' and name like 'keys/' || auth.uid() || '/private.enc' );

-- Public Keys Write: Only owner can write their public key
drop policy if exists "Users can upload their own public key" on storage.objects;
create policy "Users can upload their own public key"
on storage.objects for insert
with check ( bucket_id = 'secure-files' and name like 'keys/' || auth.uid() || '/public.json' );

-- Messages: Sender can upload
drop policy if exists "Senders can upload messages" on storage.objects;
create policy "Senders can upload messages"
on storage.objects for insert
with check ( bucket_id = 'secure-files' and name like 'messages/%' );

-- Messages: Recipient can read
-- Strategy: We rely on the folder structure 'messages/{receiver_id}/{sender_id}_timestamp.json'
drop policy if exists "Recipients can read their messages" on storage.objects;
create policy "Recipients can read their messages"
on storage.objects for select
using ( bucket_id = 'secure-files' and name like 'messages/' || auth.uid() || '/%' );

