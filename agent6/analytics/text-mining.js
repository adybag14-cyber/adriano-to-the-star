class TextMining {
  constructor() {}
  async init() {}
  tf(text) {
    const t=String(text||'').toLowerCase().match(/[a-z0-9']+/g)||[];
    const m=new Map(); for(const tok of t) m.set(tok,(m.get(tok)||0)+1); return m;
  }
}
window.TextMining = TextMining;
