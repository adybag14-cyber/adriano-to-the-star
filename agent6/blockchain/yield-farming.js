class YieldFarming {
  constructor() { this.pools=new Map(); }
  async init() {}
  deposit(pool, user, amount) { const p=this.pools.get(pool)||new Map(); const v=(p.get(user)||0)+Number(amount||0); p.set(user,v); this.pools.set(pool,p); }
  accrue(pool, rate) { const p=this.pools.get(pool)||new Map(); p.forEach((val,user)=>{ p.set(user, val*(1+Number(rate||0))); }); this.pools.set(pool,p); }
  balance(pool, user) { const p=this.pools.get(pool)||new Map(); return p.get(user)||0; }
}
window.YieldFarming = YieldFarming;
