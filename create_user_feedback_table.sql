-- Create user_feedback table for storing user feedback and bug reports
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.user_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    email TEXT,
    page TEXT,
    user_agent TEXT,
    user_id TEXT,
    status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'resolved', 'closed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own feedback
CREATE POLICY "Users can insert feedback"
    ON public.user_feedback
    FOR INSERT
    WITH CHECK (true);

-- Policy: Users can view their own feedback
CREATE POLICY "Users can view own feedback"
    ON public.user_feedback
    FOR SELECT
    USING (auth.uid()::text = user_id OR user_id = 'anonymous');

-- Policy: Admins can view all feedback (adjust role check as needed)
-- CREATE POLICY "Admins can view all feedback"
--     ON public.user_feedback
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM public.user_roles
--             WHERE user_id = auth.uid()::text
--             AND role = 'admin'
--         )
--     );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_feedback_updated_at
    BEFORE UPDATE ON public.user_feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_user_feedback_updated_at();

-- Add comment to table
COMMENT ON TABLE public.user_feedback IS 'Stores user feedback, bug reports, and feature requests';

