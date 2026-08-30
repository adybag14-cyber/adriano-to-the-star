/** Explicit export/import/share controls for browser-local catalogue preferences. */
(function () {
  'use strict';
  const allowedKeys = [
    'planet-claims', 'user_claims', 'planet_favorites', 'favorites', 'saved-planets',
    'language-preference', 'theme', 'cosmicPlayerVolume', 'cosmicPlayerLoop', 'cosmicPlayerMinimized'
  ];
  const status = message => {
    const target = document.getElementById('database-tools-status');
    if (target) target.textContent = message;
  };

  function exportData() {
    const values = {};
    allowedKeys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value != null) values[key] = value;
    });
    const payload = { schema: 'ita-database-local-export', version: 1, exportedAt: new Date().toISOString(), values };
    const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = Object.assign(document.createElement('a'), { href: url, download: 'ita-database-local-data.json' });
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`Exported ${Object.keys(values).length} browser-local settings. Profiles, passwords, encrypted notebooks, and files were excluded.`);
  }

  async function importData(file) {
    if (!file || file.size > 1024 * 1024) throw new Error('Choose an I.T.A JSON export smaller than 1 MB.');
    const payload = JSON.parse(await file.text());
    if (payload?.schema !== 'ita-database-local-export' || payload.version !== 1 || !payload.values || typeof payload.values !== 'object') {
      throw new Error('This is not a supported I.T.A database export.');
    }
    const entries = Object.entries(payload.values).filter(([key, value]) => allowedKeys.includes(key) && typeof value === 'string');
    if (!entries.length) throw new Error('The export contains no supported settings.');
    if (!confirm(`Import ${entries.length} local settings and replace matching values in this browser?`)) return;
    entries.forEach(([key, value]) => localStorage.setItem(key, value));
    status(`Imported ${entries.length} browser-local settings. Refreshing the catalogue…`);
    setTimeout(() => location.reload(), 350);
  }

  async function share() {
    const data = { title: 'Adriano To The Star Exoplanet Database', text: 'Explore the browser-based Kepler catalogue.', url: location.href.split('#')[0] };
    if (navigator.share) {
      try { await navigator.share(data); status('Share sheet opened.'); }
      catch (error) { if (error.name !== 'AbortError') status(`Share was unavailable: ${error.message}`); }
      return;
    }
    try {
      await navigator.clipboard.writeText(data.url);
      status('Database link copied to the clipboard.');
    } catch {
      status('Copy is unavailable. Use the address bar to copy this page URL.');
    }
  }

  const init = () => {
    const input = document.getElementById('database-import-file');
    document.querySelector('[data-export-user-data]')?.addEventListener('click', exportData);
    document.querySelector('[data-import-user-data]')?.addEventListener('click', () => input?.click());
    document.querySelector('[data-share-database]')?.addEventListener('click', share);
    input?.addEventListener('change', async () => {
      try { await importData(input.files?.[0]); }
      catch (error) { status(error.message); }
      finally { input.value = ''; }
    });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
