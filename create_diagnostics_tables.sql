-- Create diagnostics / telemetry tables used by optional features
-- Tables: web_vital_alerts, health_check, blockchain_verifications
-- Run this in Supabase SQL Editor for project sepesbfytkmbgjyfqriw

-- 1) Core Web Vitals alerts
CREATE TABLE IF NOT EXISTS public.web_vital_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric TEXT NOT NULL,
    value DOUBLE PRECISION,
    status TEXT,
    message TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    url TEXT,
    user_agent TEXT
);

ALTER TABLE public.web_vital_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read web_vital_alerts"
ON public.web_vital_alerts
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert web_vital_alerts"
ON public.web_vital_alerts
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);


-- 2) Health check pings
CREATE TABLE IF NOT EXISTS public.health_check (
    id BIGSERIAL PRIMARY KEY,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    component TEXT,
    status TEXT,
    details JSONB
);

ALTER TABLE public.health_check ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read health_check"
ON public.health_check
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert health_check"
ON public.health_check
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);


-- 3) Blockchain verification records for claims
CREATE TABLE IF NOT EXISTS public.blockchain_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_id TEXT NOT NULL,
    claim_id UUID,
    planet_kepid BIGINT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    verification_hash TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'prepared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    blockchain_tx_hash TEXT,
    blockchain_network TEXT,
    metadata JSONB
);

ALTER TABLE public.blockchain_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read blockchain_verifications"
ON public.blockchain_verifications
FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can insert blockchain_verifications"
ON public.blockchain_verifications
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));
