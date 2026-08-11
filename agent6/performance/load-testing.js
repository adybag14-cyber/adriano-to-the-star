class LoadTesting {
  constructor() {}
  async init() {}
  async simulate(workFn, users, durationMs) {
    const u = Math.max(1, Number(users||1));
    const end = Date.now() + Number(durationMs||500);
    let ops = 0;
    const runUser = async () => {
      while (Date.now() < end) {
        const r = workFn();
        if (r && typeof r.then === 'function') await r;
        ops++;
      }
    };
    await Promise.all(Array.from({length:u}).map(()=>runUser()));
    const opsPerSec = (ops / (Number(durationMs||500)/1000));
    return { ops, opsPerSec };
  }
}
window.LoadTesting = LoadTesting;
