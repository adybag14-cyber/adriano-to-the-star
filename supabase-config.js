// Legacy compatibility shim.
// Production data/auth moved from Supabase to Cloudflare Workers + D1 in 2026-08.
(() => {
  'use strict';
  const local = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  window.ITA_BACKEND_CONFIG = Object.freeze({
    provider: 'cloudflare-d1',
    apiBase: window.EXOPLANET_API_BASE || (local ? 'http://localhost:3002' : 'https://api.adrianotothestar.com')
  });

  // Keep these names defined because older modules feature-detect them.
  // They intentionally disable every Supabase code path and contain no retired endpoint or key.
  window.SUPABASE_CONFIG = Object.freeze({ url: '', anonKey: '', enabled: false, retired: true });
  window.USE_SUPABASE = false;
  window.supabaseClient = null;

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG: window.SUPABASE_CONFIG, USE_SUPABASE: false, ITA_BACKEND_CONFIG: window.ITA_BACKEND_CONFIG };
  }
})();
