class SecurityMetricsDashboard {
  constructor() {
    this.metrics = [];
  }
  async init() {}
  add(name, value) { this.metrics.push({ name:String(name), value:Number(value||0) }); }
  average() {
    if (this.metrics.length===0) return 0;
    return this.metrics.reduce((s,m)=>s+m.value,0)/this.metrics.length;
  }
}
window.SecurityMetricsDashboard = SecurityMetricsDashboard;
