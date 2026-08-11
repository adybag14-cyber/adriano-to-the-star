class LanguageTranslation {
  constructor() { this.dict = new Map(); }
  async init() {}
  addDictionary(lang, entries) { this.dict.set(String(lang), entries || {}); }
  translate(lang, text) {
    const d = this.dict.get(String(lang)) || {};
    return String(text||'').split(/\s+/).map(w => d[w] || w).join(' ');
  }
}
window.LanguageTranslation = LanguageTranslation;
