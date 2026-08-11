class MetamaskIntegration {
  constructor() {
    this.ethereum = null;
    this.accounts = [];
  }
  async init() {}
  detect() {
    this.ethereum = typeof window !== 'undefined' ? window.ethereum || null : null;
    return !!this.ethereum;
  }
  async connect() {
    if (!this.detect() || !this.ethereum.request) return [];
    const acc = await this.ethereum.request({ method: 'eth_requestAccounts' }).catch(() => []);
    this.accounts = Array.isArray(acc) ? acc : [];
    return this.accounts;
  }
}
window.MetamaskIntegration = MetamaskIntegration;
