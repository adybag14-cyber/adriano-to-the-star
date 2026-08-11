class PerformanceBudget {
  constructor() {
    this.budgets = new Map();
  }
  async init() {}
  setBudget(metric, value) {
    this.budgets.set(String(metric), Number(value));
  }
  check(report) {
    const out = {};
    Object.keys(report || {}).forEach(k => {
      const limit = this.budgets.get(String(k));
      const v = Number(report[k]);
      out[k] = { value: v, limit: limit || null, within: limit == null ? true : v <= limit };
    });
    return out;
  }
}
window.PerformanceBudget = PerformanceBudget;
