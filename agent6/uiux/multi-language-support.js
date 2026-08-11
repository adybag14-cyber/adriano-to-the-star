class MultiLanguageSupport {
  constructor() {
    this.locale = 'en';
    this.dicts = new Map();
  }
  async init() {}
  setLocale(loc) { this.locale = String(loc||'en'); }
  addDict(loc, d) { this.dicts.set(String(loc), d || {}); }
  t(key) {
    const d = this.dicts.get(this.locale) || {};
    return String(d[key] || key);
  }
}
window.MultiLanguageSupport = MultiLanguageSupport;
