class ConsensusAlgorithm {
  constructor() {}
  async init() {}
  async hash(s) {
    const te = new TextEncoder();
    const d = await crypto.subtle.digest('SHA-256', te.encode(String(s)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async mine(prefix, data) {
    const target = String(prefix || '0000');
    let nonce = 0;
    while (true) {
      const h = await this.hash(JSON.stringify({ data, nonce }));
      if (h.startsWith(target)) return { nonce, hash: h };
      nonce++;
    }
  }
}
window.ConsensusAlgorithm = ConsensusAlgorithm;
