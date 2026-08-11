class SmartContractMonitoring {
  constructor() {
    this.events = new Map();
  }
  async init() {}
  register(contractAddress, eventName) {
    const addr = String(contractAddress).toLowerCase();
    const ev = String(eventName);
    if (!this.events.has(addr)) this.events.set(addr, new Map());
    if (!this.events.get(addr).has(ev)) this.events.get(addr).set(ev, []);
    return true;
  }
  push(contractAddress, eventName, payload) {
    const addr = String(contractAddress).toLowerCase();
    const ev = String(eventName);
    const m = this.events.get(addr);
    if (!m || !m.has(ev)) return false;
    m.get(ev).push({ ts: Date.now(), payload });
    return true;
  }
  list(contractAddress, eventName) {
    const addr = String(contractAddress).toLowerCase();
    const ev = String(eventName);
    const m = this.events.get(addr);
    return m && m.get(ev) ? m.get(ev).slice() : [];
  }
}
window.SmartContractMonitoring = SmartContractMonitoring;
