class SecurityThreatIntelligence {
  constructor() {
    this.indicators = new Set();
  }
  async init() {}
  ingest(list) {
    (list||[]).forEach(i => this.indicators.add(String(i).toLowerCase()));
  }
  lookup(value) {
    return this.indicators.has(String(value).toLowerCase());
  }
}
window.SecurityThreatIntelligence = SecurityThreatIntelligence;
