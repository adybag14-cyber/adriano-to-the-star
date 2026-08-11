class RandomNumberGenerator {
  constructor() {}
  async init() {}
  int() {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] >>> 0;
  }
  float() {
    return (this.int() / 0xffffffff);
  }
  bytes(n) {
    const u = new Uint8Array(Math.max(0, Number(n || 0)));
    crypto.getRandomValues(u);
    return u;
  }
}
window.RandomNumberGenerator = RandomNumberGenerator;
