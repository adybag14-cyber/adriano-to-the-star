class ResourceAllocation {
  constructor() {}
  async init() {}
  schedule(tasks, workers) {
    const t = Array.isArray(tasks) ? tasks.slice() : [];
    const w = Math.max(1, Number(workers||1));
    const buckets = Array.from({length:w}, ()=>[]);
    for (let i=0;i<t.length;i++) buckets[i%w].push(t[i]);
    return buckets;
  }
}
window.ResourceAllocation = ResourceAllocation;
