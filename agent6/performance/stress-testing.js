class StressTesting {
  constructor() {}
  async init() {}
  async run(workFn, concurrency, durationMs) {
    const c = Math.max(1, Number(concurrency||1));
    const end = Date.now() + Number(durationMs||1000);
    let ops = 0;
    const worker = async () => {
      while (Date.now() < end) {
        const r = workFn();
        if (r && typeof r.then === 'function') await r;
        ops++;
      }
    };
    await Promise.all(Array.from({length:c}).map(()=>worker()));
    return { ops, opsPerSec: ops / ((Number(durationMs||1000))/1000) };
  }
}
window.StressTesting = StressTesting;
