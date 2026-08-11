class EscrowSystem {
  constructor() {
    this.items = new Map();
  }
  async init() {}
  create(id, depositor, beneficiary, amount) {
    const esc = { id:String(id), depositor:String(depositor), beneficiary:String(beneficiary), amount:Number(amount||0), released:false };
    this.items.set(esc.id, esc);
    return esc;
  }
  deposit(id, amount) {
    const e = this.items.get(String(id));
    if (!e || e.released) return false;
    e.amount += Number(amount||0);
    return true;
  }
  release(id) {
    const e = this.items.get(String(id));
    if (!e || e.released) return false;
    e.released = true;
    e.releasedAt = Date.now();
    return true;
  }
  get(id) {
    return this.items.get(String(id)) || null;
  }
}
window.EscrowSystem = EscrowSystem;
