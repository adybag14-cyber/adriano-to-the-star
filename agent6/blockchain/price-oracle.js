class PriceOracle {
  constructor() {
    this.feeds = new Map();
  }
  async init() {}
  register(symbol, fn) {
    this.feeds.set(String(symbol), fn);
  }
  async getLatest(symbol) {
    const fn = this.feeds.get(String(symbol));
    if (!fn) return null;
    try {
      return await fn();
    } catch {
      return null;
    }
  }
}
window.PriceOracle = PriceOracle;
