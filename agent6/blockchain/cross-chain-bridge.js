class CrossChainBridge {
  constructor() {
    this.transfers = [];
  }
  async init() {}
  enqueue(fromChain, toChain, amount, address) {
    const t = { id: this.transfers.length + 1, from:String(fromChain), to:String(toChain), amount:Number(amount||0), address:String(address||''), status:'queued', ts:Date.now() };
    this.transfers.push(t);
    return t;
  }
  complete(id) {
    const t = this.transfers.find(x => x.id === Number(id));
    if (!t) return false;
    t.status = 'completed';
    t.completedAt = Date.now();
    return true;
  }
  list() {
    return this.transfers.slice();
  }
}
window.CrossChainBridge = CrossChainBridge;
