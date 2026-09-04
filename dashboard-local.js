/** Browser-local mission dashboard with no remote telemetry. */
(function () {
  'use strict';
  const readArray = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const keys = ['planet-claims', 'user_claims', 'planet_favorites', 'favorites', 'saved-planets', 'planet-trends', 'ita_newsletter_preferences_v2'];

  class LocalDashboard {
    init() {
      this.render();
      addEventListener('ita:auth-changed', () => this.render());
    }

    snapshot() {
      const claims = readArray('planet-claims');
      return {
        user: window.authManager?.getCurrentUser?.() || null,
        claims,
        favourites: [...readArray('planet_favorites'), ...readArray('favorites'), ...readArray('saved-planets')],
        interactions: readArray('planet-trends'),
        language: document.documentElement.lang || 'en',
        generatedAt: new Date().toISOString()
      };
    }

    render() {
      const data = this.snapshot();
      document.getElementById('welcome-message').textContent = data.user
        ? `Welcome, ${data.user.fullName || data.user.username}`
        : 'Local mission overview';
      document.getElementById('user-email').textContent = data.user
        ? `${data.user.email} · browser-local profile`
        : 'Guest workspace · nothing is synchronized';
      document.getElementById('stat-total').textContent = String(data.claims.length);
      document.getElementById('stat-confirmed').textContent = String(data.claims.filter(item => item.status === 'active' || item.confirmed).length);
      const target = document.getElementById('claims-container');
      target.replaceChildren();

      const controls = document.createElement('section');
      controls.className = 'dashboard-local-controls';
      controls.innerHTML = `<h3>Workspace controls</h3><p>Saved worlds: <strong>${data.favourites.length}</strong> · Recent interaction records: <strong>${data.interactions.length}</strong> · Language: <strong>${data.language.toUpperCase()}</strong></p><div><button type="button" id="dashboard-refresh">Refresh</button><button type="button" id="dashboard-export">Export snapshot</button><button type="button" id="dashboard-reset">Clear dashboard activity</button></div><p id="dashboard-status" role="status" aria-live="polite">Snapshot generated ${new Date(data.generatedAt).toLocaleString()}.</p>`;
      target.append(controls);

      const list = document.createElement('section');
      list.setAttribute('aria-labelledby', 'dashboard-worlds-title');
      const heading = document.createElement('h3');
      heading.id = 'dashboard-worlds-title';
      heading.textContent = 'Locally claimed worlds';
      list.append(heading);
      if (!data.claims.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No local planet claims are stored in this browser.';
        list.append(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'dashboard-claims-grid';
        data.claims.slice(0, 100).forEach(claim => {
          const card = document.createElement('article');
          const title = document.createElement('h4');
          title.textContent = claim.planetName || claim.name || claim.planet_data?.pl_name || `KEPID ${claim.kepid || 'unknown'}`;
          const meta = document.createElement('p');
          meta.textContent = `${claim.status || 'local record'}${claim.createdAt || claim.timestamp ? ` · ${new Date(claim.createdAt || claim.timestamp).toLocaleDateString()}` : ''}`;
          card.append(title, meta);
          grid.append(card);
        });
        list.append(grid);
      }
      target.append(list);

      document.getElementById('dashboard-refresh').addEventListener('click', () => this.render());
      document.getElementById('dashboard-export').addEventListener('click', () => this.export(data));
      document.getElementById('dashboard-reset').addEventListener('click', () => this.reset());
    }

    export(data) {
      const payload = { ...data, user: data.user ? { id: data.user.id, username: data.user.username, storage: 'browser-local' } : null };
      const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = Object.assign(document.createElement('a'), { href: url, download: 'ita-local-dashboard.json' });
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      document.getElementById('dashboard-status').textContent = 'Local dashboard snapshot exported.';
    }

    reset() {
      if (!confirm('Clear local claims, favourites, saved planets, interaction history, and newsletter plan from this browser?')) return;
      keys.forEach(key => localStorage.removeItem(key));
      this.render();
      document.getElementById('dashboard-status').textContent = 'Dashboard activity was cleared from this browser. Local profiles and encrypted notebooks were preserved.';
    }
  }

  const init = () => {
    const dashboard = new LocalDashboard();
    dashboard.init();
    window.localDashboard = dashboard;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
