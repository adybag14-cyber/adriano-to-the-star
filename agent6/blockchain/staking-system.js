class StakingSystem {
  constructor() {
    this.stakes = new Map();
    this.ratePerMs = 0.0001; // reward per ms per unit staked
  }
  async init() {}
  stake(user, amount) {
    const u = String(user);
    const s = this.stakes.get(u) || { amount:0, since:Date.now(), accrued:0 };
    // accrue current rewards before updating amount
    const now = Date.now();
    s.accrued += (s.amount * this.ratePerMs) * (now - s.since);
    s.amount += Number(amount||0);
    s.since = now;
    this.stakes.set(u, s);
  }
  claim(user) {
    const u = String(user);
    const s = this.stakes.get(u);
    if (!s) return 0;
    const now = Date.now();
    s.accrued += (s.amount * this.ratePerMs) * (now - s.since);
    s.since = now;
    const r = s.accrued;
    s.accrued = 0;
    return r;
  }
}
window.StakingSystem = StakingSystem;
