class CurrencyFormatting {
  constructor() {
    this.locale = 'en';
    this.currency = 'USD';
  }
  async init() {}
  setLocale(loc) { this.locale = String(loc||'en'); }
  setCurrency(cur) { this.currency = String(cur||'USD'); }
  format(amount) {
    return new Intl.NumberFormat(this.locale, { style:'currency', currency:this.currency }).format(Number(amount));
  }
}
window.CurrencyFormatting = CurrencyFormatting;
