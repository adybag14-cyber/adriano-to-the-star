-- Create user_dashboard_layouts table for custom dashboard widgets
-- Run this in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.user_dashboard_layouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    layout JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Add foreign key
ALTER TABLE public.user_dashboard_layouts
ADD CONSTRAINT user_dashboard_layouts_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Enable Row Level Security
ALTER TABLE public.user_dashboard_layouts ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Users can only view their own layouts
CREATE POLICY "Users can view own layouts"
ON public.user_dashboard_layouts
FOR SELECT
USING (auth.uid() = user_id);

-- Policy 2: Users can create their own layouts
CREATE POLICY "Users can create own layouts"
ON public.user_dashboard_layouts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can update their own layouts
CREATE POLICY "Users can update own layouts"
ON public.user_dashboard_layouts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Users can delete their own layouts
CREATE POLICY "Users can delete own layouts"
ON public.user_dashboard_layouts
FOR DELETE
USING (auth.uid() = user_id);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_dashboard_layouts_user_id ON public.user_dashboard_layouts(user_id);

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_dashboard_layouts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
DROP TRIGGER IF EXISTS update_user_dashboard_layouts_updated_at ON public.user_dashboard_layouts;
CREATE TRIGGER update_user_dashboard_layouts_updated_at
    BEFORE UPDATE ON public.user_dashboard_layouts
    FOR EACH ROW
    EXECUTE FUNCTION update_user_dashboard_layouts_updated_at();

