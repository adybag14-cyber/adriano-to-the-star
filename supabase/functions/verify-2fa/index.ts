// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
// @ts-ignore
import { create, verify } from "https://deno.land/x/djwt@v2.4/mod.ts"
// @ts-ignore
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
// Note: In a real deployment, you would import a TOTP library like 'otplib' or 'speakeasy'
// import { authenticator } from 'npm:otplib';

console.log("Hello from verify-2fa functionality!")

// @ts-ignore
serve(async (req) => {
    // CORS headers
    const origin = req.headers.get('origin') || '';
    const nodeEnv = (() => {
        try {
            // @ts-ignore
            return (typeof Deno !== 'undefined' && Deno.env) ? ((Deno.env.get('NODE_ENV') || '') as string) : '';
        } catch (_e) {
            return '';
        }
    })().toLowerCase() || 'production';
    const allowedOriginsRaw = (() => {
        try {
            // @ts-ignore
            return (typeof Deno !== 'undefined' && Deno.env) ? (Deno.env.get('ALLOWED_ORIGINS') || '') : '';
        } catch (_e) {
            return '';
        }
    })();

    const allowedOrigins = allowedOriginsRaw
        .split(',')
        .map((s: string) => s.trim())
        .filter(Boolean);

    const allowOriginHeader = origin && (
        allowedOrigins.length > 0
            ? (allowedOrigins.includes(origin) ? origin : '')
            : (nodeEnv !== 'production' ? origin : '')
    );

    const corsHeaders = {
        ...(allowOriginHeader ? { 'Access-Control-Allow-Origin': allowOriginHeader } : {}),
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };

    const supabaseUrl = (() => {
        try {
            // @ts-ignore
            return (typeof Deno !== 'undefined' && Deno.env) ? (Deno.env.get('SUPABASE_URL') || '') : '';
        } catch (_e) {
            return '';
        }
    })();

    const supabaseServiceRoleKey = (() => {
        try {
            // @ts-ignore
            return (typeof Deno !== 'undefined' && Deno.env) ? (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '') : '';
        } catch (_e) {
            return '';
        }
    })();

    const supabaseAdmin = (supabaseUrl && supabaseServiceRoleKey)
        ? createClient(supabaseUrl, supabaseServiceRoleKey)
        : null;

    async function base32Decode(input: string): Promise<Uint8Array> {
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        const cleaned = String(input || '').toUpperCase().replace(/[^A-Z2-7]/g, '');
        let bits = 0;
        let value = 0;
        const out: number[] = [];

        for (let i = 0; i < cleaned.length; i++) {
            const idx = alphabet.indexOf(cleaned[i]);
            if (idx === -1) continue;
            value = (value << 5) | idx;
            bits += 5;
            if (bits >= 8) {
                out.push((value >>> (bits - 8)) & 0xff);
                bits -= 8;
            }
        }

        return new Uint8Array(out);
    }

    async function hmacSha1(keyBytes: Uint8Array, msgBytes: Uint8Array): Promise<Uint8Array> {
        const keyBuf = keyBytes.slice().buffer;
        const msgBuf = msgBytes.slice().buffer;

        const key = await crypto.subtle.importKey(
            'raw',
            keyBuf,
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );

        const sig = await crypto.subtle.sign('HMAC', key, msgBuf);
        return new Uint8Array(sig);
    }

    async function totp(secretBase32: string, timeStepSeconds = 30, digits = 6, nowMs = Date.now()): Promise<string | null> {
        const keyBytes = await base32Decode(secretBase32);
        if (!keyBytes || keyBytes.length === 0) return null;

        const counter = Math.floor((nowMs / 1000) / timeStepSeconds);
        const buf = new ArrayBuffer(8);
        const view = new DataView(buf);
        view.setUint32(0, Math.floor(counter / 0x100000000));
        view.setUint32(4, counter >>> 0);
        const msgBytes = new Uint8Array(buf);

        const mac = await hmacSha1(keyBytes, msgBytes);
        const offset = mac[mac.length - 1] & 0x0f;
        const binCode =
            ((mac[offset] & 0x7f) << 24) |
            ((mac[offset + 1] & 0xff) << 16) |
            ((mac[offset + 2] & 0xff) << 8) |
            (mac[offset + 3] & 0xff);

        const otp = (binCode % (10 ** digits)).toString().padStart(digits, '0');
        return otp;
    }

    async function verifyTotp(code: string, secretBase32: string): Promise<boolean> {
        const normalized = String(code || '').trim();
        if (!/^[0-9]{6}$/.test(normalized)) return false;

        const stepMs = 30 * 1000;
        const now = Date.now();

        const candidates = [now - stepMs, now, now + stepMs];
        for (const t of candidates) {
            const expected = await totp(secretBase32, 30, 6, t);
            if (expected && expected === normalized) return true;
        }
        return false;
    }

    if (req.method === 'OPTIONS') {
        if (origin && !allowOriginHeader) {
            return new Response('Forbidden', { status: 403, headers: { 'Vary': 'Origin' } })
        }
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { action, userId, code, secret } = await req.json()

        // 1. Generate Secret
        if (action === 'generate-secret') {
            // Mocking secure secret generation
            // In production: const secret = authenticator.generateSecret();
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
            let newSecret = '';
            for (let i = 0; i < 32; i++) {
                const rand = crypto.getRandomValues(new Uint8Array(1))[0];
                newSecret += chars.charAt(rand % chars.length);
            }

            return new Response(
                JSON.stringify({ secret: newSecret }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        // 2. Verify Code
        if (action === 'verify') {
            if (!code) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Missing code' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
                )
            }

            if (!supabaseAdmin) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Supabase admin client not configured' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
                )
            }

            const authHeader = req.headers.get('authorization') || '';
            const bearer = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length).trim() : '';
            if (!bearer) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Missing Authorization bearer token' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
                )
            }

            const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(bearer);
            if (authError || !authData?.user) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Invalid session' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 },
                )
            }

            const effectiveUserId = authData.user.id;
            if (userId && String(userId) !== String(effectiveUserId)) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'User mismatch' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 },
                )
            }

            const { data: twoFA, error: twoFAError } = await supabaseAdmin
                .from('user_2fa')
                .select('secret, enabled')
                .eq('user_id', effectiveUserId)
                .maybeSingle();

            if (twoFAError) {
                return new Response(
                    JSON.stringify({ valid: false, error: 'Failed to load 2FA status' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 },
                )
            }

            // If 2FA is already enabled (secret exists), always verify against stored secret.
            // If 2FA is not yet enabled (no stored secret), allow initial setup verification
            // against the provided secret (but only for the authenticated user).
            const hasStoredSecret = !!(twoFA && twoFA.secret && twoFA.enabled !== false);
            const secretToVerify = hasStoredSecret
                ? String(twoFA.secret)
                : (secret ? String(secret) : '');

            if (!secretToVerify) {
                return new Response(
                    JSON.stringify({ valid: false, error: hasStoredSecret ? '2FA not enabled' : 'Missing secret for setup verification' }),
                    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
                )
            }

            const isValid = await verifyTotp(String(code), secretToVerify);

            return new Response(
                JSON.stringify({ valid: isValid }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            )
        }

        return new Response(
            JSON.stringify({ error: 'Invalid action' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )

    } catch (error: any) {
        return new Response(
            JSON.stringify({
                error: nodeEnv === 'production' ? 'Bad request' : (error && error.message ? error.message : String(error))
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 },
        )
    }
})
