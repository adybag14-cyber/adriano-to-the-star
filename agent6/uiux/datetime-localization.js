class DatetimeLocalization {
  constructor() {
    this.locale = 'en';
    this.options = { year:'numeric', month:'short', day:'2-digit', hour:'2-digit', minute:'2-digit' };
  }
  async init() {}
  setLocale(loc) { this.locale = String(loc||'en'); }
  setOptions(opts) { this.options = Object.assign({}, this.options, opts || {}); }
  format(ts) {
    return new Intl.DateTimeFormat(this.locale, this.options).format(new Date(Number(ts||Date.now())));
  }
}
window.DatetimeLocalization = DatetimeLocalization;
