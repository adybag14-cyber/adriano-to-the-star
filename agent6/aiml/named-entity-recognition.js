class NamedEntityRecognition {
  constructor() {}
  async init() {}
  recognize(text) {
    const words = String(text||'').split(/\s+/);
    const ents = [];
    for (const w of words) if (/^[A-Z][a-z]+$/.test(w)) ents.push({ text:w, type:'ProperNoun' });
    return ents;
  }
}
window.NamedEntityRecognition = NamedEntityRecognition;
