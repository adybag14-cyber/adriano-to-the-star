class SecurityAnalytics {
  constructor() { this.events = []; this.anomalies = []; this.baselines = new Map(); }
  logEvent(event) {
    event.timestamp = event.timestamp || Date.now();
    this.events.push(event);
    this.checkAnomaly(event);
    return event.id || Date.now() + Math.random();
  }
  checkAnomaly(event) {
    const key = `${event.type}:${event.user}`;
    const baseline = this.baselines.get(key) || { count: 0, lastSeen: 0 };
    const timeDiff = event.timestamp - baseline.lastSeen;
    if (baseline.count > 0 && timeDiff < 60000) {
      this.anomalies.push({
        id: Date.now() + Math.random(),
        type: 'rapid_events',
        event,
        baseline,
        timestamp: event.timestamp
      });
    }
    baseline.count++;
    baseline.lastSeen = event.timestamp;
    this.baselines.set(key, baseline);
  }
  getAnomalies(filters={}) {
    return this.anomalies.filter(anomaly => {
      if (filters.type && anomaly.type !== filters.type) return false;
      if (filters.startTime && anomaly.timestamp < filters.startTime) return false;
      if (filters.endTime && anomaly.timestamp > filters.endTime) return false;
      return true;
    });
  }
  getEventStats(timeRange=24*60*60*1000) {
    const cutoff = Date.now() - timeRange;
    const recent = this.events.filter(e => e.timestamp > cutoff);
    const stats = {
      total: recent.length,
      byType: {},
      byUser: {},
      bySeverity: {},
      hourly: Array(24).fill(0)
    };
    recent.forEach(event => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
      stats.byUser[event.user] = (stats.byUser[event.user] || 0) + 1;
      stats.bySeverity[event.severity] = (stats.bySeverity[event.severity] || 0) + 1;
      const hour = new Date(event.timestamp).getHours();
      stats.hourly[hour]++;
    });
    return stats;
  }
  detectPatterns(timeWindow=3600000) {
    const patterns = [];
    const cutoff = Date.now() - timeWindow;
    const recent = this.events.filter(e => e.timestamp > cutoff);
    const failedLogins = recent.filter(e => e.type === 'failed_login');
    if (failedLogins.length > 5) {
      patterns.push({
        type: 'brute_force',
        count: failedLogins.length,
        users: [...new Set(failedLogins.map(e => e.user))],
        confidence: Math.min(failedLogins.length / 10, 1)
      });
    }
    return patterns;
  }
  generateReport(startTime, endTime) {
    const events = this.events.filter(e => e.timestamp >= startTime && e.timestamp <= endTime);
    const anomalies = this.anomalies.filter(a => a.timestamp >= startTime && a.timestamp <= endTime);
    return {
      period: { start: startTime, end: endTime },
      totalEvents: events.length,
      anomalies: anomalies.length,
      topUsers: this.getTopUsers(events, 5),
      topEventTypes: this.getTopEventTypes(events, 5),
      patterns: this.detectPatterns(endTime - startTime)
    };
  }
  getTopUsers(events, limit=10) {
    const userCounts = {};
    events.forEach(e => {
      userCounts[e.user] = (userCounts[e.user] || 0) + 1;
    });
    return Object.entries(userCounts).sort(([,a], [,b]) => b - a).slice(0, limit);
  }
  getTopEventTypes(events, limit=10) {
    const typeCounts = {};
    events.forEach(e => {
      typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
    });
    return Object.entries(typeCounts).sort(([,a], [,b]) => b - a).slice(0, limit);
  }
}
window.SecurityAnalytics = SecurityAnalytics;