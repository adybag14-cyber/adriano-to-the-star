/* I.T.A Systems Atlas — shared navigation for the public website */
(() => {
  'use strict';
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.__navigationJsLoaded) return;
  window.__navigationJsLoaded = true;

  const selfScript = document.currentScript;
  const assetBase = selfScript?.src ? new URL('.', selfScript.src) : new URL('.', window.location.href);
  const asset = path => new URL(path, assetBase).href;

  const SECTORS = [
    {
      key: 'mission', title: 'Mission systems',
      links: [
        ['index.html', 'Home'], ['database.html', 'World Database'], ['star-maps.html', 'Star Maps'],
        ['stellar-ai.html', 'Stellar AI'], ['projects.html', 'Projects'], ['education.html', 'Education'],
        ['about.html', 'About'], ['business-promise.html', 'Business Promise'], ['mechgen.html', 'MechGen']
      ]
    },
    {
      key: 'intelligence', title: 'Intelligence',
      links: [
        ['analytics-dashboard.html', 'Analytics'], ['space-dashboard.html', 'Space Dashboard'],
        ['ai-metrics-dashboard.html', 'AI Metrics'], ['ai-fairness.html', 'AI & Fairness'],
        ['database-analytics.html', 'Database Analytics'], ['dashboard.html', 'Mission Dashboard'], ['api.html', 'Developer API']
      ]
    },
    {
      key: 'community', title: 'Community',
      links: [
        ['messaging.html', 'Direct Messages'], ['secure-chat.html', 'Secure Chat'], ['groups.html', 'Groups'],
        ['members.html', 'Members'], ['followers.html', 'Followers'], ['forum.html', 'Forum'],
        ['badges.html', 'Badges & Achievements'], ['event-calendar.html', 'Events Calendar'],
        ['newsletter.html', 'Newsletter']
      ]
    },
    {
      key: 'services', title: 'Services & exchange',
      links: [
        ['marketplace.html', 'Marketplace'], ['service-page/galaxy-object-trading.html', 'Galaxy Object Trading'],
        ['tracker.html', 'Tracker'], ['file-storage.html', 'File Storage'], ['book-online.html', 'Book Online'],
        ['loyalty.html', 'Loyalty'], ['shop.html', 'Shop'], ['events.html', 'Events']
      ]
    },
    {
      key: 'experiences', title: 'Experiences & research',
      links: [
        ['games.html', 'Games'], ['starsector.html', 'Starsector'], ['total-war-2.html', 'Total War II'],
        ['gta-6-videos.html', 'GTA 6 Videos'], ['broadband-checker.html', 'Broadband Checker'],
        ['blog.html', 'Blog'], ['hiv-market-analysis.html', 'HIV Market Analysis']
      ]
    }
  ];

  const allLinks = SECTORS.flatMap(sector => sector.links);
  const currentPath = decodeURIComponent(location.pathname).replace(/^\/+/, '').toLowerCase() || 'index.html';

  function ensureSharedAssets() {
    if (!document.querySelector('link[data-ita-universe-shell]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = asset('ita-universe-shell.css');
      link.dataset.itaUniverseShell = '1';
      document.head.appendChild(link);
    }
    if (!document.querySelector('script[data-ita-universe-shell]') && !window.__itaUniverseShellLoaded) {
      const script = document.createElement('script');
      script.src = asset('ita-universe-shell.js');
      script.defer = true;
      script.dataset.itaUniverseShell = '1';
      document.head.appendChild(script);
    }
    if (!document.querySelector('link[href*="i18n-styles.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = asset('i18n-styles.css');
      document.head.appendChild(link);
    }
    const i18nPresent = window.__itaI18nLoaded || document.querySelector('script[src$="i18n.js"],script[src*="/i18n.js?"]');
    if (!i18nPresent) {
      const script = document.createElement('script');
      script.src = asset('i18n.js');
      script.defer = true;
      document.head.appendChild(script);
    }
  }

  function routeHref(route) { return asset(route); }
  function routeIsCurrent(route) {
    const normalized = route.toLowerCase();
    if (normalized === 'index.html') return currentPath === 'index.html' || currentPath === '';
    return currentPath.endsWith(normalized);
  }

  class NavigationMenu {
    constructor() {
      this.isOpen = false;
      this.overlay = null;
      this.search = null;
      this.lastFocus = null;
      this.triggers = [];
      this.onKeyDown = this.onKeyDown.bind(this);
      this.init();
    }

    init() {
      ensureSharedAssets();
      this.createMenuOverlay();
      this.installTriggers();
      this.setupEventListeners();
      this.markCurrentRoute();
      this.reapplyTranslations();
    }

    createMenuButton() { this.installTriggers(); }

    installTriggers() {
      const existing = document.getElementById('menu-toggle');
      if (existing) {
        existing.classList.add('ita-atlas-trigger', 'ita-atlas-trigger--floating');
        existing.type = 'button';
        existing.dataset.atlasTrigger = '1';
        existing.dataset.label = 'Systems';
        existing.setAttribute('aria-label', 'Open systems atlas');
        existing.setAttribute('aria-haspopup', 'dialog');
        existing.setAttribute('aria-expanded', 'false');
      }

      const explicitTrigger = document.querySelector('[data-atlas-trigger]');
      if (!existing) {
        const desktopNav = document.querySelector('.desktop-nav');
        if (desktopNav && !desktopNav.querySelector('[data-atlas-trigger]')) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ita-atlas-trigger ita-atlas-trigger--compact';
          button.dataset.atlasTrigger = '1';
          button.dataset.i18n = 'atlas.open';
          button.textContent = 'All systems';
          desktopNav.appendChild(button);
        }
        const mobileMenu = document.querySelector('.mobile-menu');
        if (mobileMenu && !mobileMenu.querySelector('[data-atlas-trigger]')) {
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'ita-atlas-trigger';
          button.dataset.atlasTrigger = '1';
          button.dataset.i18n = 'atlas.open';
          button.textContent = 'All systems';
          mobileMenu.appendChild(button);
        }
        if (!desktopNav && !mobileMenu && !explicitTrigger) {
          const button = document.createElement('button');
          button.type = 'button';
          button.id = 'menu-toggle';
          button.className = 'ita-atlas-trigger ita-atlas-trigger--floating';
          button.dataset.atlasTrigger = '1';
          button.dataset.label = 'Systems';
          button.setAttribute('aria-label', 'Open systems atlas');
          button.setAttribute('aria-haspopup', 'dialog');
          button.setAttribute('aria-expanded', 'false');
          document.body.appendChild(button);
        }
      }
      this.triggers = [...document.querySelectorAll('[data-atlas-trigger], #menu-toggle')];
    }

    createMenuOverlay() {
      document.getElementById('menu-overlay')?.remove();
      document.getElementById('ita-atlas-overlay')?.remove();
      const overlay = document.createElement('div');
      overlay.id = 'ita-atlas-overlay';
      overlay.className = 'ita-atlas-overlay';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-label', 'I.T.A systems atlas');
      overlay.innerHTML = `
        <div class="ita-atlas-shell">
          <div class="ita-atlas-topbar">
            <div class="ita-atlas-brand">
              <span class="ita-atlas-kicker" data-i18n="atlas.kicker">I.T.A navigation matrix</span>
              <strong data-i18n="atlas.title">Systems Atlas</strong>
            </div>
            <div class="ita-atlas-search-wrap">
              <input id="ita-atlas-search" class="ita-atlas-search" type="search" autocomplete="off"
                     placeholder="Search destinations, systems and services…" data-i18n-placeholder="atlas.search"
                     aria-label="Search website systems" data-i18n-aria-label="atlas.searchAria">
              <span class="ita-atlas-search-icon" aria-hidden="true">⌕</span>
            </div>
            <button class="ita-atlas-close" type="button" aria-label="Close systems atlas" data-i18n-aria-label="atlas.close">×</button>
          </div>
          <div class="ita-atlas-status">
            <span><i class="ita-atlas-status-dot"></i><b>${allLinks.length}</b> <span data-i18n="atlas.systemsOnline">public systems indexed</span></span>
            <span data-i18n="atlas.hint">Type to filter · Esc to close</span>
          </div>
          <div class="ita-atlas-grid">
            ${SECTORS.map((sector, index) => `
              <section class="ita-atlas-sector" data-sector="${sector.key}">
                <div class="ita-atlas-sector-head">
                  <span class="ita-atlas-sector-index">0${index + 1}</span>
                  <h2 data-i18n="atlas.sectors.${sector.key}">${sector.title}</h2>
                </div>
                <div class="ita-atlas-links">
                  ${sector.links.map(([route, label]) => `<a class="ita-atlas-link" href="${routeHref(route)}" data-route="${route}" data-search="${label.toLowerCase()}"${routeIsCurrent(route) ? ' aria-current="page"' : ''}>${label}</a>`).join('')}
                </div>
              </section>`).join('')}
          </div>
          <div class="ita-atlas-empty" data-i18n="atlas.empty">No systems match that search.</div>
        </div>`;
      document.body.appendChild(overlay);
      this.overlay = overlay;
      this.search = overlay.querySelector('#ita-atlas-search');
    }

    setupEventListeners() {
      this.triggers.forEach(trigger => trigger.addEventListener('click', event => {
        event.preventDefault();
        this.toggleMenu();
      }));
      this.overlay.querySelector('.ita-atlas-close')?.addEventListener('click', () => this.closeMenu());
      this.overlay.addEventListener('click', event => { if (event.target === this.overlay) this.closeMenu(); });
      this.search?.addEventListener('input', () => this.filter(this.search.value));
      document.addEventListener('keydown', this.onKeyDown);
      document.addEventListener('i18n:ready', () => this.reapplyTranslations());
      document.addEventListener('i18n:language-changed', () => this.reapplyTranslations());
    }

    onKeyDown(event) {
      if (!this.isOpen) return;
      if (event.key === 'Escape') { event.preventDefault(); this.closeMenu(); return; }
      if (event.key !== 'Tab') return;
      const focusable = [...this.overlay.querySelectorAll('button:not([disabled]),input:not([disabled]),a[href]')]
        .filter(node => !node.closest('[hidden]') && node.offsetParent !== null);
      if (!focusable.length) return;
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    filter(rawQuery) {
      const query = String(rawQuery || '').trim().toLocaleLowerCase();
      let visible = 0;
      this.overlay.querySelectorAll('.ita-atlas-sector').forEach(section => {
        let sectionVisible = 0;
        section.querySelectorAll('.ita-atlas-link').forEach(link => {
          const matches = !query || link.dataset.search.includes(query) || link.textContent.toLocaleLowerCase().includes(query);
          link.hidden = !matches;
          if (matches) { sectionVisible++; visible++; }
        });
        section.hidden = sectionVisible === 0;
      });
      this.overlay.querySelector('.ita-atlas-empty')?.classList.toggle('is-visible', visible === 0);
    }

    openMenu() {
      if (!this.overlay || this.isOpen) return;
      this.lastFocus = document.activeElement;
      this.isOpen = true;
      this.overlay.classList.add('is-open');
      document.body.classList.add('ita-atlas-open');
      this.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'true'));
      this.search?.focus({ preventScroll: true });
    }

    closeMenu() {
      if (!this.overlay || !this.isOpen) return;
      this.isOpen = false;
      this.overlay.classList.remove('is-open');
      document.body.classList.remove('ita-atlas-open');
      this.triggers.forEach(trigger => trigger.setAttribute('aria-expanded', 'false'));
      if (this.search) { this.search.value = ''; this.filter(''); }
      this.lastFocus?.focus?.({ preventScroll: true });
    }

    toggleMenu() { this.isOpen ? this.closeMenu() : this.openMenu(); }

    markCurrentRoute() {
      this.overlay.querySelectorAll('.ita-atlas-link').forEach(link => {
        if (routeIsCurrent(link.dataset.route)) link.setAttribute('aria-current', 'page');
      });
    }

    reapplyTranslations() {
      const i18n = window.i18n?.();
      if (i18n?.applyTranslations) i18n.applyTranslations(this.overlay);
      const label = i18n?.t?.('atlas.trigger') || 'Systems';
      this.triggers.forEach(trigger => {
        trigger.dataset.label = label;
        if (trigger.id === 'menu-toggle') trigger.setAttribute('aria-label', i18n?.t?.('atlas.openAria') || 'Open systems atlas');
      });
    }

    cleanup() {
      document.removeEventListener('keydown', this.onKeyDown);
      this.overlay?.remove();
      document.body.classList.remove('ita-atlas-open');
    }
  }

  function initNavigation() {
    if (window.navigationMenuInstance) return window.navigationMenuInstance;
    if (!document.body) return null;
    window.navigationMenuInstance = new NavigationMenu();
    return window.navigationMenuInstance;
  }

  ensureSharedAssets();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initNavigation, { once: true });
  else initNavigation();

  window.NavigationMenu = NavigationMenu;
  window.initNavigation = initNavigation;
})();
