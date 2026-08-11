-- Create badges and achievements system
-- Run this in Supabase SQL Editor

-- Step 1: Create badges catalog table
CREATE TABLE IF NOT EXISTS public.badges_catalog (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    badge_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT, -- Emoji or icon identifier
    category TEXT CHECK (category IN ('claim', 'marketplace', 'social', 'milestone', 'special')),
    points_reward INTEGER DEFAULT 0,
    rarity TEXT DEFAULT 'common' CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Step 2: Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    badge_id TEXT NOT NULL,
    earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    progress INTEGER DEFAULT 100, -- For progress-based badges
    UNIQUE(user_id, badge_id)
);

-- Step 3: Add foreign keys
ALTER TABLE public.user_badges
ADD CONSTRAINT user_badges_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.user_badges
ADD CONSTRAINT user_badges_badge_id_fkey
FOREIGN KEY (badge_id) REFERENCES public.badges_catalog(badge_id) ON DELETE CASCADE;

-- Step 4: Enable Row Level Security
ALTER TABLE public.badges_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for badges_catalog
CREATE POLICY "Anyone can view badges catalog"
ON public.badges_catalog
FOR SELECT
USING (true);

-- Step 6: Create RLS Policies for user_badges
CREATE POLICY "Anyone can view user badges"
ON public.user_badges
FOR SELECT
USING (true);

CREATE POLICY "Users can view own badges"
ON public.user_badges
FOR SELECT
USING (auth.uid() = user_id OR true); -- Public viewing

-- Step 7: Create indexes
CREATE INDEX IF NOT EXISTS idx_user_badges_user_id ON public.user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge_id ON public.user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_earned_at ON public.user_badges(earned_at DESC);
CREATE INDEX IF NOT EXISTS idx_badges_catalog_category ON public.badges_catalog(category);
CREATE INDEX IF NOT EXISTS idx_badges_catalog_rarity ON public.badges_catalog(rarity);

-- Step 8: Insert default badges
INSERT INTO public.badges_catalog (badge_id, name, description, icon, category, points_reward, rarity) VALUES
-- Claim badges
('first_claim', 'First Claim', 'Claimed your first exoplanet', '🪐', 'claim', 50, 'common'),
('five_claims', 'Planet Collector', 'Claimed 5 exoplanets', '🌍', 'claim', 100, 'uncommon'),
('ten_claims', 'Star System Owner', 'Claimed 10 exoplanets', '⭐', 'claim', 200, 'rare'),
('fifty_claims', 'Galactic Landlord', 'Claimed 50 exoplanets', '🌌', 'claim', 500, 'epic'),
('hundred_claims', 'Cosmic Emperor', 'Claimed 100 exoplanets', '👑', 'claim', 1000, 'legendary'),

-- Marketplace badges
('first_sale', 'First Sale', 'Sold your first planet', '💰', 'marketplace', 75, 'common'),
('five_sales', 'Merchant', 'Completed 5 sales', '💼', 'marketplace', 150, 'uncommon'),
('ten_sales', 'Trader', 'Completed 10 sales', '🤝', 'marketplace', 300, 'rare'),
('first_trade', 'Trader', 'Completed your first trade', '🔄', 'marketplace', 100, 'uncommon'),

-- Social badges
('first_message', 'Communicator', 'Sent your first message', '💬', 'social', 25, 'common'),
('hundred_messages', 'Social Butterfly', 'Sent 100 messages', '🦋', 'social', 200, 'rare'),
('helpful', 'Helpful', 'Received 5 positive ratings', '👍', 'social', 150, 'uncommon'),

-- Milestone badges
('points_100', 'Getting Started', 'Earned 100 points', '🌟', 'milestone', 0, 'common'),
('points_500', 'Rising Star', 'Earned 500 points', '⭐', 'milestone', 0, 'uncommon'),
('points_1000', 'Stellar', 'Earned 1,000 points', '✨', 'milestone', 0, 'rare'),
('points_5000', 'Cosmic', 'Earned 5,000 points', '🌠', 'milestone', 0, 'epic'),
('points_10000', 'Master', 'Earned 10,000 points', '👑', 'milestone', 0, 'legendary'),

-- Special badges
('early_adopter', 'Early Adopter', 'Joined during early access', '🚀', 'special', 500, 'rare'),
('beta_tester', 'Beta Tester', 'Helped test the platform', '🧪', 'special', 300, 'uncommon'),
('founder', 'Founder', 'One of the first 100 users', '💎', 'special', 1000, 'legendary')
ON CONFLICT (badge_id) DO NOTHING;

