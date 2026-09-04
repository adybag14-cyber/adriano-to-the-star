/** Explicit export/import/share controls for browser-local catalogue preferences. */
(function () {
  'use strict';
  const allowedKeys = [
    'planet-claims', 'user_claims', 'planet_favorites', 'favorites', 'saved-planets',
    'language-preference', 'theme-preference', 'theme', 'cosmicPlayerVolume', 'cosmicPlayerLoop', 'cosmicPlayerMinimized'
  ];
  const status = message => {
    const target = document.getElementById('database-tools-status');
    if (target) target.textContent = message;
  };
  const readArray = key => {
    try { const value = JSON.parse(localStorage.getItem(key) || '[]'); return Array.isArray(value) ? value : []; }
    catch { return []; }
  };
  const label = planet => planet.kepler_name || planet.kepoi_name || `KEPID ${planet.kepid}`;
  const recordKey = planet => window.databaseInstance.recordKey(planet);

  function openReport(title, paragraphs, rows = []) {
    document.getElementById('database-action-dialog')?.close();
    const opener = document.activeElement;
    const dialog = document.createElement('dialog');
    dialog.id = 'database-action-dialog';
    dialog.setAttribute('aria-labelledby', 'database-action-title');
    dialog.style.cssText = 'max-width: min(620px,calc(100vw - 32px));max-height:80dvh;overflow:auto;background:#09121e;color:#e6f8ff;border:1px solid #4f8997;border-radius:18px;padding:24px;line-height:1.6;';
    const heading = document.createElement('h2');
    heading.id = 'database-action-title';
    heading.textContent = title;
    dialog.append(heading);
    for (const text of paragraphs) { const p = document.createElement('p'); p.textContent = text; dialog.append(p); }
    const list = document.createElement('dl');
    for (const [name, value] of rows) {
      const term = document.createElement('dt'); term.textContent = name;
      const description = document.createElement('dd'); description.textContent = value;
      list.append(term, description);
    }
    dialog.append(list);
    const close = document.createElement('button');
    close.type = 'button'; close.textContent = 'Close';
    close.addEventListener('click', () => dialog.close());
    dialog.append(close);
    dialog.addEventListener('close', () => { dialog.remove(); opener?.focus?.({ preventScroll: true }); });
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }

  function assessHabitability(reference) {
    const planet = window.databaseInstance?.findPlanet(reference);
    if (!planet) { status('This catalogue object could not be found.'); return; }
    const format = (value, unit) => value != null && Number.isFinite(Number(value)) ? `${value} ${unit}` : 'Not reported in this snapshot';
    openReport(`Habitability evidence: ${label(planet)}`, [
      'This assessment reports the available evidence for this exact catalogue object.',
      planet.status === 'FALSE POSITIVE'
        ? 'This object is classified as a false positive. It must not be interpreted as a confirmed habitable planet.'
        : 'Habitability cannot be determined from a detection score or a planet name. The snapshot does not establish surface pressure, atmospheric composition, liquid water, or a surface temperature.',
      'No habitability percentage is assigned when those measurements are unavailable.'
    ], [
      ['Catalogue object', planet.kepoi_name], ['Detection status', planet.status],
      ['Radius', format(planet.radius, 'Earth radii')], ['Mass', format(planet.mass, 'Earth masses')],
      ['Orbital period', format(planet.period, 'days')], ['Atmosphere and liquid water', 'Not established']
    ]);
  }

  function savePlanet(reference, suppliedPlanet) {
    const planet = suppliedPlanet || window.databaseInstance?.findPlanet(reference);
    if (!planet) return;
    const key = recordKey(planet);
    const feature = window.databaseAdvancedFeatures;
    const values = feature ? feature.normalizeFavorites() : [...new Set(readArray('planet_favorites').map(reference => {
      const savedPlanet = window.databaseInstance.findPlanet(reference);
      return savedPlanet ? recordKey(savedPlanet) : reference;
    }))];
    const index = values.indexOf(key);
    if (index === -1) values.push(key); else values.splice(index, 1);
    localStorage.setItem('planet_favorites', JSON.stringify(values));
    if (feature) feature.favorites = values;
    document.querySelectorAll('.planet-card[data-record-id]').forEach(card => {
      const button = card.querySelector('.bookmark-btn');
      if (!button) return;
      const saved = values.includes(card.dataset.recordId);
      button.dataset.i18n = saved ? 'common.saved' : 'common.save';
      button.textContent = window.i18n?.()?.t(button.dataset.i18n) || (saved ? 'Saved' : 'Save');
      button.setAttribute('aria-pressed', String(saved));
    });
    status(`${label(planet)} ${index === -1 ? 'saved in' : 'removed from'} browser-local favourites.`);
  }

  function comparePlanet(reference) {
    const feature = window.databaseAdvancedFeatures;
    const planet = window.databaseInstance?.findPlanet(reference);
    if (!planet || !feature) { status('Comparison is still loading. Please try again.'); return; }
    feature.toggleComparison(recordKey(planet));
    const names = feature.comparisonList.map(key => window.databaseInstance.findPlanet(key)).filter(Boolean).map(label);
    status(names.length ? `Comparison selection: ${names.join(', ')}. Open Compare to view the table.` : 'Comparison selection cleared.');
    document.querySelectorAll('.planet-card[data-record-id]').forEach(card => {
      const button = card.querySelector('.compare-btn');
      if (!button) return;
      const selected = feature.comparisonList.includes(card.dataset.recordId);
      button.textContent = selected ? 'Selected' : 'Compare';
      button.setAttribute('aria-pressed', String(selected));
    });
    if (names.length >= 2) feature.showComparison();
  }

  function claimPlanet(reference) {
    const db = window.databaseInstance;
    const planet = db?.findPlanet(reference);
    if (!planet) { status('The selected catalogue object is unavailable. No claim was saved.'); return; }
    const user = window.authManager?.getCurrentUser();
    if (!user) {
      const dialog = openReport('Create a local profile', ['A local profile is required to attach this teaching claim to your browser. No ownership or purchase is involved.']);
      const link = document.createElement('a');
      link.href = `members.html?redirect=database&claim=${encodeURIComponent(recordKey(planet))}`;
      link.textContent = 'Open local profiles';
      dialog.insertBefore(link, dialog.lastElementChild);
      return;
    }
    const key = recordKey(planet);
    const claims = readArray('planet-claims');
    if (!claims.some(claim => claim.userId === user.id && (claim.recordId || claim.planet?.kepoi_name) === key)) {
      const now = new Date().toISOString();
      claims.push({ id: crypto.randomUUID(), recordId: key, kepid: planet.kepid, userId: user.id, username: user.username,
        planetName: label(planet), planet: { ...planet }, status: 'active', createdAt: now, claimedAt: now, storage: 'browser-local' });
      localStorage.setItem('planet-claims', JSON.stringify(claims));
    }
    planet.availability = 'claimed';
    db.renderPage();
    status(`Local teaching claim saved for ${label(planet)}. Open the dashboard to review it. This record carries no ownership rights.`);
    openReport(`Claim saved: ${label(planet)}`, ['Your teaching claim is stored in this browser. It carries no legal ownership, certificate authority, or financial value.']);
  }

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
    window.analyzeHabitability = assessHabitability;
    window.toggleBookmark = savePlanet;
    window.addToComparison = comparePlanet;
    window.claimPlanet = claimPlanet;
    const completePendingClaim = () => {
      const url = new URL(location.href);
      const pending = url.searchParams.get('claim');
      if (!pending || !window.authManager?.getCurrentUser() || !window.databaseInstance?.allData?.length) return;
      url.searchParams.delete('claim');
      history.replaceState(history.state, '', url);
      claimPlanet(pending);
    };
    document.addEventListener('ita:database-ready', completePendingClaim, { once: true });
    completePendingClaim();
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
