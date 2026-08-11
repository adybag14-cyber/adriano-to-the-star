class LiquidityPoolManagement {
  constructor() {
    this.pools = new Map();
  }
  async init() {}
  addPool(name, tokenA, tokenB) {
    this.pools.set(String(name), { tokenA:String(tokenA), tokenB:String(tokenB), reserveA:0, reserveB:0 });
  }
  addLiquidity(name, amountA, amountB) {
    const p = this.pools.get(String(name));
    if (!p) return false;
    p.reserveA += Number(amountA||0);
    p.reserveB += Number(amountB||0);
    return true;
  }
  priceAtoB(name) {
    const p = this.pools.get(String(name));
    if (!p || p.reserveA === 0) return 0;
    return p.reserveB / p.reserveA;
  }
}
window.LiquidityPoolManagement = LiquidityPoolManagement;
