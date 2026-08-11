class NaturalLanguageProcessing {
  tokenize(text) { return text.split(/\s+/); }
  sentiment(text) { return { score: 0.5, label: 'positive' }; }
  entities(text) { return [{ text: 'Apple', label: 'ORG', start: 0, end: 5 }]; }
  keywords(text) { return [{ word: 'important', score: 0.8 }]; }
  summarize(text, sentences=3) { return text.split('.').slice(0,sentences).join('.'); }
}
window.NaturalLanguageProcessing = NaturalLanguageProcessing;