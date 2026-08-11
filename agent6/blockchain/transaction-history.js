class TransactionHistory {
  constructor() {
    this.list = [];
  }
  async init() {}
  add(tx) {
    if (!tx || !tx.hash) return false;
    this.list.push({ hash:String(tx.hash), from:String(tx.from||''), to:String(tx.to||''), value:Number(tx.value||0), time:Number(tx.time||Date.now()) });
    return true;
  }
  byAddress(addr) {
    const a = String(addr||'');
    return this.list.filter(t => t.from===a || t.to===a);
  }
}
window.TransactionHistory = TransactionHistory;
