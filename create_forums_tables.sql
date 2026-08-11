-- Create forums and forum_posts tables for community forums
-- Run this in Supabase SQL Editor for project sepesbfytkmbgjyfqriw

-- Step 1: Create forums table (catalog of forums)
CREATE TABLE IF NOT EXISTS public.forums (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    post_count INTEGER NOT NULL DEFAULT 0,
    last_post TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create forum_posts table (posts inside each forum)
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    forum_id TEXT NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    author TEXT,
    replies INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Step 4: RLS policies

-- Forums are a read-only catalog from the app. Anyone can read them.
CREATE POLICY "Anyone can read forums"
ON public.forums
FOR SELECT
USING (true);

-- Forum posts: anyone can read, only authenticated users can create/update/delete their own posts.
CREATE POLICY "Anyone can read forum posts"
ON public.forum_posts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create forum posts"
ON public.forum_posts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = author_id);

CREATE POLICY "Authors can update own posts"
ON public.forum_posts
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can delete own posts"
ON public.forum_posts
FOR DELETE
USING (auth.uid() = author_id);

-- Step 5: Optional helpers to keep forums.post_count and forums.last_post in sync
CREATE OR REPLACE FUNCTION public.update_forum_stats_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.forums
    SET
        post_count = post_count + 1,
        last_post = NEW.created_at
    WHERE id = NEW.forum_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.update_forum_stats_on_delete()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.forums
    SET
        post_count = GREATEST(post_count - 1, 0)
    WHERE id = OLD.forum_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'forum_posts_after_insert'
    ) THEN
        CREATE TRIGGER forum_posts_after_insert
        AFTER INSERT ON public.forum_posts
        FOR EACH ROW
        EXECUTE FUNCTION public.update_forum_stats_on_insert();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'forum_posts_after_delete'
    ) THEN
        CREATE TRIGGER forum_posts_after_delete
        AFTER DELETE ON public.forum_posts
        FOR EACH ROW
        EXECUTE FUNCTION public.update_forum_stats_on_delete();
    END IF;
END;
$$;
