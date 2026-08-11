class SentimentAnalysisAdvanced {
  constructor() {
    this.lex = { pos: new Set(['good','great','excellent','happy','love']), neg: new Set(['bad','terrible','sad','hate','poor']) };
  }
  async init() {}
  score(text) {
    const tokens = String(text||'').toLowerCase().match(/[a-z']+/g) || [];
    let s = 0;
    for (const t of tokens) { if (this.lex.pos.has(t)) s++; else if (this.lex.neg.has(t)) s--; }
    return s;
  }
}
window.SentimentAnalysisAdvanced = SentimentAnalysisAdvanced;
