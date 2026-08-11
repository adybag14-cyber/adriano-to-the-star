class StatisticalTests {
  constructor() {}
  async init() {}
  chiSquare(observed, expected) {
    const o = Array.isArray(observed) ? observed.map(Number) : [];
    const e = Array.isArray(expected) ? expected.map(Number) : [];
    const n = Math.min(o.length, e.length);
    let chi = 0;
    for (let i=0;i<n;i++) {
      const diff = o[i] - e[i];
      if (e[i] > 0) chi += (diff*diff) / e[i];
    }
    const df = n - 1;
    return { chi, df };
  }
}
window.StatisticalTests = StatisticalTests;
