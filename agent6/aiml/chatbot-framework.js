class ChatbotFramework {
  constructor() { this.rules = []; }
  async init() {}
  addRule(pattern, response) { this.rules.push({ pattern: new RegExp(pattern, 'i'), response: String(response) }); }
  reply(text) {
    const t = String(text||'');
    for (const r of this.rules) if (r.pattern.test(t)) return r.response;
    return 'I\'m not sure, can you rephrase?';
  }
}
window.ChatbotFramework = ChatbotFramework;
