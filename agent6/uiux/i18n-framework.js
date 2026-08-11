class I18nFramework {
  constructor() {
    this.locale = 'en';
    this.dict = new Map();
  }
  async init() {}
  setLocale(loc) {
    this.locale = String(loc || 'en');
  }
  addTranslations(loc, obj) {
    const l = String(loc || 'en');
    const m = this.dict.get(l) || new Map();
    Object.keys(obj || {}).forEach(k => m.set(String(k), String(obj[k])));
    this.dict.set(l, m);
  }
  t(key) {
    const k = String(key);
    const m = this.dict.get(this.locale);
    if (m && m.has(k)) return m.get(k);
    const en = this.dict.get('en');
    if (en && en.has(k)) return en.get(k);
    return k;
  }
}
window.I18nFramework = I18nFramework;
