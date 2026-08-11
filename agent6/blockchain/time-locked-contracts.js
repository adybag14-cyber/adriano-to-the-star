class TimeLockedContracts {
  constructor() {
    this.locks = new Map();
  }
  async init() {}
  lock(id, untilTs, amount) {
    this.locks.set(String(id), { until:Number(untilTs), amount:Number(amount||0), released:false });
  }
  release(id) {
    const l = this.locks.get(String(id));
    if (!l || l.released) return false;
    if (Date.now() < l.until) return false;
    l.released = true;
    l.releasedAt = Date.now();
    return true;
  }
  get(id) {
    return this.locks.get(String(id)) || null;
  }
}
window.TimeLockedContracts = TimeLockedContracts;
