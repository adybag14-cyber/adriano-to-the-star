class DefiIntegration {
  constructor() {}
  async init() {}
  aggregateBalances(balances) { const arr=Array.isArray(balances)?balances:[]; return arr.reduce((s,b)=>s+Number(b||0),0); }
}
window.DefiIntegration = DefiIntegration;
