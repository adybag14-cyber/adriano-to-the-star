(() => {
  'use strict';
  if (window.__itaI18nLoaded) return;
  window.__itaI18nLoaded = true;

  const sourceScript = document.currentScript;
  const assetBase = sourceScript?.src ? new URL('.', sourceScript.src) : new URL('.', window.location.href);
  const LANGUAGES = [
    { code: 'en', name: 'English' }, { code: 'es', name: 'Español' }, { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' }, { code: 'it', name: 'Italiano' }, { code: 'pt', name: 'Português' },
    { code: 'ru', name: 'Русский' }, { code: 'zh', name: '中文' }, { code: 'ja', name: '日本語' }, { code: 'ko', name: '한국어' }
  ];
  const SUPPORTED = new Set(LANGUAGES.map(language => language.code));

  const COMMON_TEXT_KEYS = new Map([
    ['Home','common.home'], ['Database','common.database'], ['World Database','nav.database'], ['Games','common.games'],
    ['Shop','common.shop'], ['About','common.about'], ['About me','common.about'], ['Blog','common.blog'],
    ['Login','common.login'], ['Log In','common.login'], ['Login to Save','common.login'], ['Logout','common.logout'],
    ['Register','common.register'], ['Search','common.search'], ['Filter','common.filter'], ['Submit','common.submit'],
    ['Cancel','common.cancel'], ['Save','common.save'], ['Delete','common.delete'], ['Edit','common.edit'],
    ['Close','common.close'], ['Loading...','common.loading'], ['Loading…','common.loading'], ['Error','common.error'],
    ['Success','common.success'], ['Back','common.back'], ['Next','common.next'], ['Previous','common.previous'],
    ['Education','education.title'], ['Projects','nav.projects'], ['Star Maps','nav.maps'], ['Marketplace','marketplace.title'],
    ['Newsletter','newsletter.title'], ['Members','common.members'], ['Groups','common.groups'], ['Followers','common.followers'],
    ['Events','common.events'], ['Forum','common.forum'], ['Book Online','common.bookOnline'], ['Loyalty','common.loyalty']
  ]);
  const COMMON_PLACEHOLDER_KEYS = new Map([
    ['Search...','common.search'], ['Search…','common.search'], ['Search planets...','database.searchPlaceholder'],
    ['Type a message...','messaging.typeMessage'], ['Ask Stellar AI anything...','stellarAI.askAnything']
  ]);

  const PAGE_META_KEYS = {
    'business-promise.html': 'businessPromise', 'education.html': 'educationExperience', 'projects.html': 'projectsExperience',
    'about.html': 'aboutExperience', 'mechgen.html': 'mechgenExperience', 'secure-chat.html': 'secureChat',
    'tracker.html': 'trackerExperience', 'file-storage.html': 'fileStorage', 'games.html': 'gamesArchive',
    'starsector.html': 'starsectorExperience', 'total-war-2.html': 'totalWar2', 'gta-6-videos.html': 'gta6Videos',
    'broadband-checker.html': 'broadbandChecker', 'book-online.html': 'bookOnlineExperience', 'loyalty.html': 'loyaltyExperience',
    'events.html': 'eventsExperience', 'shop.html': 'shopExperience', 'groups.html': 'groupsExperience',
    'members.html': 'membersExperience', 'followers.html': 'followersExperience', 'dashboard.html': 'dashboardExperience',
    'forum.html': 'forumExperience', 'blog.html': 'blogExperience', 'hiv-market-analysis.html': 'hivMarket',
    'star-maps.html': 'starMapsExperience', 'space-dashboard.html': 'spaceDashboard', 'ai-metrics-dashboard.html': 'aiMetrics',
    'ai-fairness.html': 'aiFairnessExperience', 'database-analytics.html': 'databaseAnalyticsExperience',
    'galaxy-object-trading.html': 'galaxyTrading'
  };

  const PAGE_BINDINGS = {
    'education.html': [
      ['.page-title','education.title'], ['.page-hero .page-subtitle','education.subtitle']
    ],
    'stellar-ai.html': [
      ['.page-title','stellarAI.title'], ['.page-hero .page-subtitle','stellarAI.subtitle'],
      ['.chat-history h3','stellarAI.chatHistory'], ['#message-input','stellarAI.askAnything','placeholder'],
      ['.welcome-message h2','stellarAI.welcome']
    ],
    'marketplace.html': [
      ['.page-title','marketplace.title'], ['.page-hero .page-subtitle','marketplace.subtitle']
    ],
    'messaging.html': [
      ['.page-title','messaging.title'], ['.page-hero .page-subtitle','messaging.subtitle'],
      ['.login-required h2','messaging.loginRequired'], ['.conversations-header h3','messaging.conversations'],
      ['#message-input','messaging.typeMessage','placeholder'], ['#send-message-btn','messaging.send']
    ],
    'badges.html': [
      ['.page-title','badges.title'], ['.page-hero .page-subtitle','badges.subtitle']
    ],
    'analytics-dashboard.html': [
      ['.page-title','analytics.title'], ['.page-hero .page-subtitle','analytics.subtitle']
    ],
    'newsletter.html': [
      ['.page-title','newsletter.title'], ['.page-hero .page-subtitle','newsletter.subtitle']
    ],
    'event-calendar.html': [
      ['.page-title','calendar.title'], ['.page-hero .page-subtitle','calendar.subtitle']
    ],
    'database.html': [
      ['.page-title','database.title'], ['.page-hero .page-subtitle','database.subtitle']
    ]
  };

  function currentFile() {
    const path = decodeURIComponent(location.pathname).replace(/\/+$/, '');
    return path.split('/').pop() || 'index.html';
  }

  class I18n {
    constructor() {
      this.fallbackLanguage = 'en';
      this.translations = {};
      this.currentLanguage = this.detectInitialLanguage();
      this.switcher = null;
      this.observer = null;
      this.observerScheduled = false;
      this.ready = this.init();
    }

    detectInitialLanguage() {
      const saved = localStorage.getItem('language-preference');
      if (saved && SUPPORTED.has(saved)) return saved;
      const browser = String(navigator.language || 'en').split('-')[0].toLowerCase();
      return SUPPORTED.has(browser) ? browser : this.fallbackLanguage;
    }

    async init() {
      await Promise.all([this.loadTranslations(this.fallbackLanguage), this.loadTranslations(this.currentLanguage)]);
      this.bindLegacyContent(document);
      this.applyTranslations(document);
      this.createLanguageSwitcher();
      this.observeDynamicContent();
      document.documentElement.lang = this.currentLanguage;
      document.documentElement.dir = 'ltr';
      document.dispatchEvent(new CustomEvent('i18n:ready', { detail: { language: this.currentLanguage } }));
      return this;
    }

    async loadTranslations(language) {
      if (this.translations[language]) return this.translations[language];
      try {
        const url = new URL(`translations/${language}.json`, assetBase);
        const response = await fetch(url.href, { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        this.translations[language] = data && typeof data === 'object' ? data : {};
      } catch (error) {
        console.warn(`[ITA i18n] Could not load ${language}; using English fallback.`, error?.message || error);
        this.translations[language] = language === this.fallbackLanguage ? {} : (this.translations[this.fallbackLanguage] || {});
      }
      return this.translations[language];
    }

    resolve(object, key) {
      if (!object || !key) return undefined;
      return key.split('.').reduce((value, segment) => value && Object.prototype.hasOwnProperty.call(value, segment) ? value[segment] : undefined, object);
    }

    t(key, params = {}) {
      let value = this.resolve(this.translations[this.currentLanguage], key);
      if (value == null) value = this.resolve(this.translations[this.fallbackLanguage], key);
      if (value == null) return null;
      value = String(value);
      for (const [name, replacement] of Object.entries(params)) value = value.replaceAll(`{{${name}}}`, String(replacement));
      return value;
    }

    bindLegacyContent(root = document) {
      const file = currentFile();
      const pageBindings = PAGE_BINDINGS[file] || [];
      for (const [selector, key, mode] of pageBindings) {
        const elements = root === document ? document.querySelectorAll(selector) : root.querySelectorAll?.(selector) || [];
        elements.forEach(element => {
          if (mode === 'placeholder') element.dataset.i18nPlaceholder ||= key;
          else element.dataset.i18n ||= key;
        });
      }

      const pageMetaKey = PAGE_META_KEYS[file];
      if (pageMetaKey && root === document) {
        const title = document.querySelector('.page-title') || document.querySelector('main h1') || document.querySelector('#loading-screen .loading-logo') || document.querySelector('h1');
        const subtitle = document.querySelector('.page-subtitle') || document.querySelector('#loading-screen .launch-copy');
        if (title && !title.dataset.i18n) title.dataset.i18n = `pages.${pageMetaKey}.title`;
        if (subtitle && !subtitle.dataset.i18n) subtitle.dataset.i18n = `pages.${pageMetaKey}.subtitle`;
      }

      const candidates = root === document
        ? document.querySelectorAll('button,a,label,h2,h3,option,[role="button"]')
        : root.querySelectorAll?.('button,a,label,h2,h3,option,[role="button"]') || [];
      candidates.forEach(element => {
        if (element.dataset.i18n || element.children.length > 0) return;
        const raw = element.textContent?.trim();
        const key = COMMON_TEXT_KEYS.get(raw);
        if (key) element.dataset.i18n = key;
      });

      const inputs = root === document
        ? document.querySelectorAll('input[placeholder],textarea[placeholder]')
        : root.querySelectorAll?.('input[placeholder],textarea[placeholder]') || [];
      inputs.forEach(element => {
        if (element.dataset.i18nPlaceholder) return;
        const key = COMMON_PLACEHOLDER_KEYS.get(element.getAttribute('placeholder')?.trim());
        if (key) element.dataset.i18nPlaceholder = key;
      });
    }

    applyTranslations(root = document) {
      const queryAll = (selector) => {
        const list = [];
        if (root?.matches?.(selector)) list.push(root);
        root?.querySelectorAll?.(selector)?.forEach(node => list.push(node));
        return list;
      };
      queryAll('[data-i18n]').forEach(element => {
        const translation = this.t(element.dataset.i18n);
        if (translation != null && element.textContent !== translation) element.textContent = translation;
      });
      queryAll('[data-i18n-placeholder]').forEach(element => {
        const translation = this.t(element.dataset.i18nPlaceholder);
        if (translation != null && element.getAttribute('placeholder') !== translation) element.setAttribute('placeholder', translation);
      });
      queryAll('[data-i18n-aria-label]').forEach(element => {
        const translation = this.t(element.dataset.i18nAriaLabel);
        if (translation != null && element.getAttribute('aria-label') !== translation) element.setAttribute('aria-label', translation);
      });
      queryAll('[data-i18n-title]').forEach(element => {
        const translation = this.t(element.dataset.i18nTitle);
        if (translation != null && element.getAttribute('title') !== translation) element.setAttribute('title', translation);
      });
      document.documentElement.lang = this.currentLanguage;
    }

    observeDynamicContent() {
      if (!('MutationObserver' in window) || !document.body) return;
      this.observer = new MutationObserver(mutations => {
        if (this.observerScheduled) return;
        const hasAddedNodes = mutations.some(mutation => mutation.addedNodes?.length);
        if (!hasAddedNodes) return;
        this.observerScheduled = true;
        requestAnimationFrame(() => {
          this.observerScheduled = false;
          this.bindLegacyContent(document);
          this.applyTranslations(document);
        });
      });
      this.observer.observe(document.body, { childList: true, subtree: true });
    }

    async setLanguage(language) {
      if (!SUPPORTED.has(language)) return false;
      await this.loadTranslations(language);
      this.currentLanguage = language;
      localStorage.setItem('language-preference', language);
      this.bindLegacyContent(document);
      this.applyTranslations(document);
      this.updateLanguageSwitcher();
      document.dispatchEvent(new CustomEvent('languageChanged', { detail: { language } }));
      document.dispatchEvent(new CustomEvent('i18n:language-changed', { detail: { language } }));
      return true;
    }

    getCurrentLanguage() { return this.currentLanguage; }
    getAvailableLanguages() { return LANGUAGES.map(language => ({ ...language })); }

    createLanguageSwitcher() {
      document.querySelectorAll('.ita-language-switcher').forEach(node => node.remove());
      const container = document.createElement('div');
      container.className = 'ita-language-switcher';
      container.innerHTML = `
        <button class="ita-language-toggle" type="button" aria-haspopup="listbox" aria-expanded="false" aria-label="Change language" data-i18n-aria-label="atlas.changeLanguage">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9M12 3c-2.6 2.5-4 5.5-4 9s1.4 6.5 4 9"></path></svg>
          <span class="ita-language-code">${this.currentLanguage.toUpperCase()}</span>
          <span class="ita-language-chevron" aria-hidden="true"></span>
        </button>
        <div class="ita-language-menu" role="listbox" aria-label="Language" hidden>
          ${LANGUAGES.map(language => `<button class="ita-language-option" type="button" role="option" data-lang="${language.code}" aria-selected="${language.code === this.currentLanguage}"><span>${language.name}</span><small>${language.code.toUpperCase()}</small></button>`).join('')}
        </div>`;
      const slot = document.querySelector('.ita-language-slot');
      const host = slot || document.querySelector('.nav-actions') || document.querySelector('.site-header .nav-shell') || document.querySelector('.site-header') || document.body;
      host.appendChild(container);
      const toggle = container.querySelector('.ita-language-toggle');
      const menu = container.querySelector('.ita-language-menu');
      const close = () => { menu.hidden = true; toggle.setAttribute('aria-expanded','false'); container.classList.remove('is-open'); };
      const open = () => { menu.hidden = false; toggle.setAttribute('aria-expanded','true'); container.classList.add('is-open'); menu.querySelector('[aria-selected="true"]')?.focus({ preventScroll: true }); };
      toggle.addEventListener('click', event => { event.preventDefault(); event.stopPropagation(); menu.hidden ? open() : close(); });
      container.querySelectorAll('.ita-language-option').forEach(option => option.addEventListener('click', async () => {
        await this.setLanguage(option.dataset.lang); close(); toggle.focus({ preventScroll: true });
      }));
      document.addEventListener('click', event => { if (!container.contains(event.target)) close(); });
      document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
      this.switcher = container;
      this.applyTranslations(container);
      this.updateLanguageSwitcher();
    }

    updateLanguageSwitcher() {
      if (!this.switcher) return;
      const code = this.switcher.querySelector('.ita-language-code');
      if (code) code.textContent = this.currentLanguage.toUpperCase();
      this.switcher.querySelectorAll('.ita-language-option').forEach(option => {
        const selected = option.dataset.lang === this.currentLanguage;
        option.setAttribute('aria-selected', String(selected));
        option.classList.toggle('is-active', selected);
      });
    }

    subscribe(callback) {
      const listener = event => callback(event.detail.language);
      document.addEventListener('i18n:language-changed', listener);
      return () => document.removeEventListener('i18n:language-changed', listener);
    }
  }

  let instance;
  const boot = () => {
    if (!instance) instance = new I18n();
    return instance;
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();

  window.I18n = I18n;
  window.i18n = () => instance || boot();
  window.t = (key, params) => (instance || boot()).t(key, params) ?? key;
})();
