class TokenSwap {
  constructor() {
    this.rates = new Map();
  }
  async init() {}
  setRate(from, to, rate) {
    this.rates.set(`${String(from)}->${String(to)}`, Number(rate));
  }
  swap(from, to, amount) {
    const r = this.rates.get(`${String(from)}->${String(to)}`);
    if (!r) return 0;
    return Number(amount || 0) * r;
  }
}
window.TokenSwap = TokenSwap;
