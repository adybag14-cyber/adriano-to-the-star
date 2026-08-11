class NlpAnalytics {
  constructor() {}
  async init() {}
  tokens(text) {
    return String(text||'').toLowerCase().match(/[a-z0-9']+/g) || [];
  }
  freq(text) {
    const t = this.tokens(text);
    const m = new Map();
    for (const tok of t) m.set(tok, (m.get(tok)||0)+1);
    return m;
  }
  topK(text, k) {
    const m = this.freq(text);
    return Array.from(m.entries()).sort((a,b)=>b[1]-a[1]).slice(0, Math.max(0, Number(k||5)));
  }
}
window.NlpAnalytics = NlpAnalytics;
