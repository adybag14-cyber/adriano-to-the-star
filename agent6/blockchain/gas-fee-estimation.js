class GasFeeEstimation {
  constructor() {
    this.samples = [];
    this.window = 20;
  }
  async init() {}
  addSample(gwei) {
    this.samples.push(Number(gwei));
    if (this.samples.length > this.window) this.samples.shift();
  }
  median() {
    if (this.samples.length === 0) return 0;
    const a = this.samples.slice().sort((x,y)=>x-y);
    const n = a.length;
    const mid = Math.floor(n/2);
    return n % 2 ? a[mid] : (a[mid-1] + a[mid]) / 2;
  }
}
window.GasFeeEstimation = GasFeeEstimation;
