class Web3Provider {
  constructor() {
    this.provider = null;
    this.chainId = null;
    this.accounts = [];
  }
  async init() {}
  detect() {
    const w = typeof window !== 'undefined' ? window : {};
    this.provider = w.ethereum || w.web3 || null;
    return !!this.provider;
  }
  async requestChainId() {
    if (!this.provider || !this.provider.request) return null;
    const id = await this.provider.request({ method: 'eth_chainId' }).catch(() => null);
    this.chainId = id;
    return id;
  }
  async requestAccounts() {
    if (!this.provider || !this.provider.request) return [];
    const acc = await this.provider.request({ method: 'eth_requestAccounts' }).catch(() => []);
    this.accounts = Array.isArray(acc) ? acc : [];
    return this.accounts;
  }
}
window.Web3Provider = Web3Provider;
