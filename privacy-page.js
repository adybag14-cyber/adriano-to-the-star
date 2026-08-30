(function privacyCentre() {
  'use strict';

  function updateYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = year; });
  }

  async function inspectStorage() {
    const output = document.getElementById('storage-check-result');
    if (!output) return;
    const localItems = (() => { try { return localStorage.length; } catch { return null; } })();
    const sessionItems = (() => { try { return sessionStorage.length; } catch { return null; } })();
    let cachesCount = null;
    let usage = null;
    let quota = null;
    try { if ('caches' in window) cachesCount = (await caches.keys()).length; } catch {}
    try {
      if (navigator.storage?.estimate) ({ usage, quota } = await navigator.storage.estimate());
    } catch {}
    const parts = [
      `Local storage entries: ${localItems ?? 'unavailable'}`,
      `session entries: ${sessionItems ?? 'unavailable'}`,
      `named caches: ${cachesCount ?? 'unavailable'}`
    ];
    if (Number.isFinite(usage) && Number.isFinite(quota)) {
      const mb = value => (value / 1_048_576).toFixed(value > 10_485_760 ? 1 : 2);
      parts.push(`estimated origin storage: ${mb(usage)} MB of ${mb(quota)} MB available quota`);
    }
    output.textContent = `${parts.join('; ')}. No stored values were read or transmitted.`;
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateYear();
    document.getElementById('privacy-print')?.addEventListener('click', () => window.print());
    document.getElementById('privacy-storage-check')?.addEventListener('click', inspectStorage);
  }, { once: true });
})();
