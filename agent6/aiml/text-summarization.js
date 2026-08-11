class TextSummarization {
  constructor() {}
  async init() {}
  summarize(text, maxSentences) {
    const sents = String(text||'').split(/(?<=[.!?])\s+/);
    return sents.slice(0, Math.max(1, Number(maxSentences||2))).join(' ');
  }
}
window.TextSummarization = TextSummarization;
