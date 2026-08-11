class MultiSignatureWallet {
  constructor() {
    this.owners = new Set();
    this.threshold = 2;
    this.proposals = new Map();
  }
  async init() {}
  addOwner(addr) {
    this.owners.add(String(addr));
  }
  setThreshold(n) {
    this.threshold = Math.max(1, Number(n||1));
  }
  propose(id, data) {
    this.proposals.set(String(id), { data, approvals: new Set(), executed: false });
  }
  approve(id, owner) {
    const p = this.proposals.get(String(id));
    if (!p || p.executed || !this.owners.has(String(owner))) return false;
    p.approvals.add(String(owner));
    if (p.approvals.size >= this.threshold) p.executed = true;
    return true;
  }
  status(id) {
    const p = this.proposals.get(String(id));
    return p ? { executed: p.executed, approvals: p.approvals.size } : null;
  }
}
window.MultiSignatureWallet = MultiSignatureWallet;
