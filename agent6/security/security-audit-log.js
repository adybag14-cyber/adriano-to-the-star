class SecurityAuditLog {
  constructor() { this.logs = []; this.maxSize = 1000; this.retentionDays = 30; }
  log(event, user, details={}) {
    const entry = {
      id: Date.now() + Math.random(),
      timestamp: Date.now(),
      event,
      user,
      details,
      severity: this.getSeverity(event)
    };
    this.logs.unshift(entry);
    if (this.logs.length > this.maxSize) {
      this.logs = this.logs.slice(0, this.maxSize);
    }
    return entry.id;
  }
  getSeverity(event) {
    const severities = {
      'login': 'info',
      'logout': 'info',
      'failed_login': 'warning',
      'permission_denied': 'warning',
      'admin_action': 'critical',
      'data_access': 'info',
      'data_modification': 'warning',
      'security_breach': 'critical'
    };
    return severities[event] || 'info';
  }
  query(filters={}) {
    return this.logs.filter(log => {
      if (filters.user && log.user !== filters.user) return false;
      if (filters.event && log.event !== filters.event) return false;
      if (filters.severity && log.severity !== filters.severity) return false;
      if (filters.startDate && log.timestamp < filters.startDate) return false;
      if (filters.endDate && log.timestamp > filters.endDate) return false;
      return true;
    });
  }
  getByUser(user) {
    return this.logs.filter(log => log.user === user);
  }
  getByEvent(event) {
    return this.logs.filter(log => log.event === event);
  }
  getBySeverity(severity) {
    return this.logs.filter(log => log.severity === severity);
  }
  getRecent(hours=24) {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000);
    return this.logs.filter(log => log.timestamp > cutoff);
  }
  cleanup() {
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);
    const before = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp > cutoff);
    return before - this.logs.length;
  }
  getStats() {
    const stats = {
      total: this.logs.length,
      bySeverity: {},
      byEvent: {},
      byUser: {}
    };
    this.logs.forEach(log => {
      stats.bySeverity[log.severity] = (stats.bySeverity[log.severity] || 0) + 1;
      stats.byEvent[log.event] = (stats.byEvent[log.event] || 0) + 1;
      stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
    });
    return stats;
  }
}
window.SecurityAuditLog = SecurityAuditLog;