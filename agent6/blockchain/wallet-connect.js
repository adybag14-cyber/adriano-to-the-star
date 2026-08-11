class WalletConnect {
  constructor() {
    this.sessions = new Map();
  }
  async init() {}
  createSession(id, peer) {
    const s = { id:String(id), peer:String(peer||''), status:'pending', ts:Date.now() };
    this.sessions.set(s.id, s);
    return s;
  }
  approve(id) {
    const s = this.sessions.get(String(id));
    if (!s) return false;
    s.status = 'approved';
    s.ts = Date.now();
    return true;
  }
  get(id) {
    return this.sessions.get(String(id)) || null;
  }
}
window.WalletConnect = WalletConnect;
