class AbTestAnalysis {
  constructor() {}
  async init() {}
  evaluate(a, b) {
    const aRate = this.rate(a);
    const bRate = this.rate(b);
    return { aRate, bRate, winner: bRate > aRate ? "B" : "A" };
  }
  rate(group) {
    const conversions = Number(group?.conversions || 0);
    const visitors = Number(group?.visitors || 0);
    if (visitors <= 0) return 0;
    return conversions / visitors;
  }
}
window.AbTestAnalysis = AbTestAnalysis;
