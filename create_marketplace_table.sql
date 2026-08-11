-- Create marketplace_listings table for planet trading
-- Run this in Supabase SQL Editor

-- Step 1: Create the table
CREATE TABLE IF NOT EXISTS public.marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    seller_id UUID NOT NULL,
    seller_username TEXT,
    claim_id UUID NOT NULL, -- Reference to planet_claims.id
    kepid BIGINT NOT NULL,
    planet_data JSONB,
    listing_type TEXT NOT NULL CHECK (listing_type IN ('sell', 'trade', 'auction')),
    price DECIMAL(10, 2), -- For sell/auction listings
    currency TEXT DEFAULT 'USD',
    trade_description TEXT, -- For trade listings
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'cancelled', 'expired')),
    expires_at TIMESTAMPTZ, -- Optional expiration
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sold_at TIMESTAMPTZ,
    buyer_id UUID,
    buyer_username TEXT
);

-- Step 2: Add foreign keys
ALTER TABLE public.marketplace_listings
ADD CONSTRAINT marketplace_listings_seller_id_fkey
FOREIGN KEY (seller_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.marketplace_listings
ADD CONSTRAINT marketplace_listings_buyer_id_fkey
FOREIGN KEY (buyer_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Step 3: Enable Row Level Security
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS Policies

-- Policy 1: Anyone can view active listings
CREATE POLICY "Anyone can view active listings"
ON public.marketplace_listings
FOR SELECT
USING (status = 'active');

-- Policy 2: Users can view their own listings (all statuses)
CREATE POLICY "Users can view own listings"
ON public.marketplace_listings
FOR SELECT
USING (auth.uid() = seller_id OR auth.uid() = buyer_id);

-- Policy 3: Users can create their own listings
CREATE POLICY "Users can create own listings"
ON public.marketplace_listings
FOR INSERT
WITH CHECK (auth.uid() = seller_id);

-- Policy 4: Sellers can update their own active listings
CREATE POLICY "Sellers can update own listings"
ON public.marketplace_listings
FOR UPDATE
USING (auth.uid() = seller_id AND status = 'active')
WITH CHECK (auth.uid() = seller_id);

-- Policy 5: Sellers can cancel their own listings
CREATE POLICY "Sellers can cancel own listings"
ON public.marketplace_listings
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

-- Step 5: Create indexes
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_seller_id ON public.marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_status ON public.marketplace_listings(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_kepid ON public.marketplace_listings(kepid);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_listing_type ON public.marketplace_listings(listing_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_listings_created_at ON public.marketplace_listings(created_at DESC);

-- Step 6: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_marketplace_listings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger
CREATE TRIGGER update_marketplace_listings_updated_at
    BEFORE UPDATE ON public.marketplace_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_listings_updated_at();

