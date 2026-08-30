/** Honest browser-local analytics for the static GitLab Pages site. */
(function () {
  'use strict';

  const readArray = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };

  class AnalyticsDashboard {
    constructor(container) {
      this.container = container;
      this.range = '30';
      this.render();
    }

    snapshot() {
      const claims = readArray('planet-claims');
      const favourites = [...readArray('favorites'), ...readArray('saved-planets')];
      const interactions = readArray('planet-trends');
      const messages = readArray('ita_local_messages_v1');
      const now = Date.now();
      const days = this.range === 'all' ? Infinity : Number(this.range || 30);
      const since = now - days * 86400000;
      const recent = value => value.filter(item => {
        const timestamp = Date.parse(item?.timestamp || item?.createdAt || item?.date || 0);
        return days === Infinity || (Number.isFinite(timestamp) && timestamp >= since);
      });
      return {
        claims,
        favourites,
        interactions: recent(interactions),
        messages: recent(messages),
        webgpu: Boolean(navigator.gpu),
        language: (document.documentElement.lang || 'en').toUpperCase(),
        generatedAt: new Date()
      };
    }

    render() {
      const data = this.snapshot();
      const activeClaims = data.claims.filter(claim => claim?.status === 'active').length;
      this.container.innerHTML = `
        <section class="analytics-overview" aria-labelledby="analytics-overview-title">
          <div class="analytics-overview-header">
            <div>
              <p class="analytics-eyebrow">BROWSER TELEMETRY</p>
              <h2 id="analytics-overview-title">Your private activity snapshot</h2>
              <p>Values are calculated from this browser only. No account, Supabase project, Google Cloud service, analytics vendor, or tracking pixel receives them.</p>
            </div>
            <span class="analytics-source-badge" id="analytics-account-status">Local browser data only</span>
          </div>
          <div class="analytics-controls" role="group" aria-label="Analytics time range">
            ${[['7','7 days'],['30','30 days'],['90','90 days'],['all','All time']].map(([value,label]) => `<button type="button" data-range="${value}" aria-pressed="${this.range === value}">${label}</button>`).join('')}
            <button type="button" id="analytics-refresh">Refresh snapshot</button>
          </div>
          <div class="analytics-metric-grid">
            <article class="analytics-metric-card"><span class="analytics-metric-label">Saved worlds</span><strong>${data.favourites.length}</strong><small>Local favourites and saved planets</small></article>
            <article class="analytics-metric-card"><span class="analytics-metric-label">Planet claims</span><strong>${data.claims.length}</strong><small>${activeClaims} active in this browser</small></article>
            <article class="analytics-metric-card"><span class="analytics-metric-label">Interactions</span><strong>${data.interactions.length}</strong><small>Within the selected range</small></article>
            <article class="analytics-metric-card"><span class="analytics-metric-label">Graphics capability</span><strong>${data.webgpu ? 'WebGPU' : 'WebGL'}</strong><small>Language ${data.language}</small></article>
          </div>
          <div class="analytics-data-note" role="note">
            <strong>No sample numbers.</strong> Empty activity is displayed as zero. Last refreshed <time datetime="${data.generatedAt.toISOString()}">${data.generatedAt.toLocaleString()}</time>.
          </div>
          <div class="analytics-privacy-grid">
            <article><h3>What stays local</h3><p>Selections, favourites, optional local profile data, and local simulation progress remain in browser storage until the visitor clears it.</p></article>
            <article><h3>What is not measured</h3><p>This page does not claim site-wide visitors, revenue, global model usage, server uptime, or account activity.</p></article>
            <article><h3>Reset control</h3><p>Use browser site-data settings to remove local information. The website cannot recover it after removal.</p></article>
          </div>
        </section>`;

      this.container.querySelectorAll('[data-range]').forEach(button => {
        button.addEventListener('click', () => {
          this.range = button.dataset.range;
          this.render();
        });
      });
      this.container.querySelector('#analytics-refresh')?.addEventListener('click', () => this.render());
    }
  }

  const init = () => {
    const container = document.getElementById('analytics-container');
    if (!container || container.dataset.localAnalyticsReady) return;
    container.dataset.localAnalyticsReady = 'true';
    window.analyticsDashboard = new AnalyticsDashboard(container);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
