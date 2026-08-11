class SecurityAutomation {
  constructor() {
    this.tasks = [];
  }
  async init() {}
  schedule(name, fn) {
    this.tasks.push({ name:String(name), fn });
  }
  async runAll() {
    const results = [];
    for (const t of this.tasks) {
      try { const r = t.fn(); if (r && typeof r.then === 'function') await r; results.push({ name:t.name, ok:true }); }
      catch (e) { results.push({ name:t.name, ok:false, error:String(e&&e.message||e) }); }
    }
    return results;
  }
}
window.SecurityAutomation = SecurityAutomation;
