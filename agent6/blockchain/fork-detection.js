class ForkDetection {
  constructor() {
    this.tips = new Map();
  }
  async init() {}
  reportTip(height, hash) {
    const h = Number(height);
    const arr = this.tips.get(h) || new Set();
    arr.add(String(hash));
    this.tips.set(h, arr);
  }
  competing(height) {
    const arr = this.tips.get(Number(height));
    return arr ? arr.size : 0;
  }
}
window.ForkDetection = ForkDetection;
