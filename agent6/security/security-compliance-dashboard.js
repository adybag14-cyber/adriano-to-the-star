class SecurityComplianceDashboard {
  constructor() {
    this.items = [];
  }
  async init() {}
  add(name, status) {
    this.items.push({ name:String(name), status:String(status) });
  }
  summary() {
    const counts = { passed:0, failed:0, pending:0 };
    for (const it of this.items) {
      if (it.status === 'passed') counts.passed++;
      else if (it.status === 'failed') counts.failed++;
      else counts.pending++;
    }
    return counts;
  }
}
window.SecurityComplianceDashboard = SecurityComplianceDashboard;
