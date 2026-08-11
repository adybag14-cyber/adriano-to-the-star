class IpfsIntegration {
  constructor() { this.cids = {}; this.gateway = 'https://ipfs.io'; }
  async add(data) {
    const content = JSON.stringify(data);
    const hash = await this.cid(content);
    this.cids[hash] = content;
    return hash;
  }
  async get(cid) {
    return this.cids[cid] ? JSON.parse(this.cids[cid]) : null;
  }
  async cid(data) {
    const str = typeof data === 'string' ? data : JSON.stringify(data);
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return 'Qm' + Math.abs(hash).toString(16).padStart(44, '0');
  }
  pin(cid) {
    return { cid, pinned: true, timestamp: Date.now() };
  }
  unpin(cid) {
    return { cid, pinned: false, timestamp: Date.now() };
  }
  listPins() {
    return Object.keys(this.cids).map(cid => ({ cid, pinned: true }));
  }
  async cat(cid) {
    return this.cids[cid] || null;
  }
  url(cid) {
    return `${this.gateway}/ipfs/${cid}`;
  }
}
window.IpfsIntegration = IpfsIntegration;