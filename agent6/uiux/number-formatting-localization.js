class NumberFormattingLocalization {
  constructor() {
    this.locale = 'en';
  }
  async init() {}
  setLocale(loc) { this.locale = String(loc||'en'); }
  format(n, opts) {
    return new Intl.NumberFormat(this.locale, opts || {}).format(Number(n));
  }
}
window.NumberFormattingLocalization = NumberFormattingLocalization;
