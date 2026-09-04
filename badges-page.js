/** Browser-local achievement catalogue and progress calculator. */
(function () {
  'use strict';
  const readArray = key => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  };
  const catalogue = [
    ['first-world', 'First World', 'Save or claim one exoplanet.', '🪐', 'exploration', 1, 'worlds'],
    ['five-worlds', 'Planet Collector', 'Save or claim five exoplanets.', '🌍', 'exploration', 5, 'worlds'],
    ['ten-worlds', 'System Cartographer', 'Save or claim ten exoplanets.', '🗺️', 'exploration', 10, 'worlds'],
    ['first-interaction', 'Console Online', 'Record one local planet interaction.', '🛰️', 'learning', 1, 'interactions'],
    ['ten-interactions', 'Persistent Observer', 'Record ten local planet interactions.', '🔭', 'learning', 10, 'interactions'],
    ['local-profile', 'Mission Identity', 'Create a browser-local profile.', '👤', 'platform', 1, 'profile'],
    ['newsletter-plan', 'Signal Planner', 'Save a browser-local newsletter preference plan.', '📡', 'platform', 1, 'newsletter'],
    ['encrypted-vault', 'Cipher Officer', 'Create a browser-local encrypted notebook.', '🔐', 'platform', 1, 'vault'],
    ['webgpu-ready', 'GPU Navigator', 'Open the catalogue in a WebGPU-capable browser.', '✨', 'technology', 1, 'webgpu']
  ].map(([id, name, description, icon, category, target, metric]) => ({ id, name, description, icon, category, target, metric }));

  class BadgesPage {
    constructor() { this.filter = 'all'; }
    init() {
      this.render();
      addEventListener('ita:auth-changed', () => this.render());
    }
    metrics() {
      const user = window.authManager?.getCurrentUser?.() || null;
      const userId = user?.id || 'guest';
      return {
        worlds: new Set([...readArray('planet-claims'), ...readArray('planet_favorites'), ...readArray('favorites'), ...readArray('saved-planets')].map(item => typeof item === 'string' || typeof item === 'number' ? String(item) : item.recordId || item.planet?.kepoi_name || item.kepid || item.id || item.name).filter(Boolean)).size,
        interactions: readArray('planet-trends').length,
        profile: Number(Boolean(user)),
        newsletter: Number(Boolean(localStorage.getItem('ita_newsletter_preferences_v2'))),
        vault: Number(Boolean(localStorage.getItem(`ita_encrypted_notebook_v2:${userId}`))),
        webgpu: Number(Boolean(navigator.gpu))
      };
    }
    render() {
      const metrics = this.metrics();
      const progress = catalogue.map(badge => ({ ...badge, value: metrics[badge.metric] || 0, earned: (metrics[badge.metric] || 0) >= badge.target }));
      const earned = progress.filter(item => item.earned).length;
      const summary = document.getElementById('reputation-summary');
      summary.innerHTML = `<section class="reputation-card"><div class="reputation-header"><div><h2>Local mission progress</h2><p>Computed on this device; not a public reputation score.</p></div><strong>${earned} / ${catalogue.length} earned</strong></div><div class="progress-track" role="progressbar" aria-label="Badges earned" aria-valuemin="0" aria-valuemax="${catalogue.length}" aria-valuenow="${earned}"><div class="progress-fill" style="width:${earned / catalogue.length * 100}%"></div></div><div class="badges-header-actions" role="group" aria-label="Badge filters"><button type="button" data-badge-filter="all" aria-pressed="${this.filter === 'all'}">All</button><button type="button" data-badge-filter="earned" aria-pressed="${this.filter === 'earned'}">Earned</button><button type="button" data-badge-filter="locked" aria-pressed="${this.filter === 'locked'}">In progress</button><button type="button" id="refresh-badges">Refresh progress</button></div></section>`;
      summary.querySelectorAll('[data-badge-filter]').forEach(button => button.addEventListener('click', () => {
        this.filter = button.dataset.badgeFilter;
        this.render();
      }));
      document.getElementById('refresh-badges').addEventListener('click', () => this.render());
      this.renderBadges(progress);
    }
    renderBadges(progress) {
      const visible = progress.filter(item => this.filter === 'all' || (this.filter === 'earned' ? item.earned : !item.earned));
      const grouped = Map.groupBy ? Map.groupBy(visible, item => item.category) : visible.reduce((map, item) => map.set(item.category, [...(map.get(item.category) || []), item]), new Map());
      const target = document.getElementById('badges-container');
      target.replaceChildren();
      if (!visible.length) {
        const empty = document.createElement('p');
        empty.textContent = 'No badges match this filter.';
        target.append(empty);
        return;
      }
      for (const [category, badges] of grouped) {
        const section = document.createElement('section');
        section.className = 'badges-category';
        const title = document.createElement('h3');
        title.textContent = category[0].toUpperCase() + category.slice(1);
        const grid = document.createElement('div');
        grid.className = 'badges-grid';
        badges.forEach(badge => {
          const card = document.createElement('article');
          card.className = `badge-card ${badge.earned ? 'earned' : 'locked'}`;
          const icon = document.createElement('div');
          icon.className = 'badge-icon';
          icon.setAttribute('aria-hidden', 'true');
          icon.textContent = badge.icon;
          const info = document.createElement('div');
          info.className = 'badge-info';
          const name = document.createElement('h4');
          name.className = 'badge-name';
          name.textContent = badge.name;
          const description = document.createElement('p');
          description.className = 'badge-description';
          description.textContent = badge.description;
          const state = document.createElement('p');
          state.textContent = badge.earned ? 'Earned on this device' : `${Math.min(badge.value, badge.target)} of ${badge.target}`;
          info.append(name, description, state);
          card.append(icon, info);
          grid.append(card);
        });
        section.append(title, grid);
        target.append(section);
      }
    }
  }
  const init = () => {
    const page = new BadgesPage();
    page.init();
    window.badgesPageInstance = page;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
