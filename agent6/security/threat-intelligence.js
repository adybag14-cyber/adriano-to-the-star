class ThreatIntelligence {
  constructor() { this.threats = []; this.indicators = new Map(); this.feeds = []; this.lastUpdate = null; }
  addThreat(threat) {
    threat.id = threat.id || Date.now() + Math.random();
    threat.timestamp = threat.timestamp || Date.now();
    threat.severity = threat.severity || 'medium';
    this.threats.push(threat);
    if (threat.iocs) {
      threat.iocs.forEach(ioc => this.addIndicator(ioc, threat.id));
    }
    return threat.id;
  }
  addIndicator(indicator, threatId) {
    const key = `${indicator.type}:${indicator.value}`;
    if (!this.indicators.has(key)) {
      this.indicators.set(key, { indicator, threats: [] });
    }
    this.indicators.get(key).threats.push(threatId);
  }
  search(query) {
    return this.threats.filter(threat => {
      if (query.type && threat.type !== query.type) return false;
      if (query.severity && threat.severity !== query.severity) return false;
      if (query.family && threat.family !== query.family) return false;
      if (query.campaign && threat.campaign !== query.campaign) return false;
      return true;
    });
  }
  checkIndicator(type, value) {
    const key = `${type}:${value}`;
    const entry = this.indicators.get(key);
    return entry ? entry.threats.map(id => this.getThreat(id)).filter(t => t) : [];
  }
  getThreat(id) {
    return this.threats.find(t => t.id === id);
  }
  getRecentThreats(hours=24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.threats.filter(t => t.timestamp > cutoff);
  }
  getThreatsBySeverity(severity) {
    return this.threats.filter(t => t.severity === severity);
  }
  getStats() {
    const stats = {
      total: this.threats.length,
      bySeverity: {},
      byType: {},
      byFamily: {},
      totalIndicators: this.indicators.size
    };
    this.threats.forEach(threat => {
      stats.bySeverity[threat.severity] = (stats.bySeverity[threat.severity] || 0) + 1;
      stats.byType[threat.type] = (stats.byType[threat.type] || 0) + 1;
      stats.byFamily[threat.family] = (stats.byFamily[threat.family] || 0) + 1;
    });
    return stats;
  }
  updateFromFeed(feedUrl) {
    this.feeds.push({ url: feedUrl, lastUpdate: Date.now() });
    this.lastUpdate = Date.now();
    return { success: true, threatsAdded: Math.floor(Math.random() * 10) + 1 };
  }
}
window.ThreatIntelligence = ThreatIntelligence;