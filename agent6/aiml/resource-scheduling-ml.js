class ResourceSchedulingMl {
  constructor() {}
  async init() {}
  greedilyAssign(tasks, workers) {
    const t=Array.isArray(tasks)?tasks.map(Number):[]; const W=Math.max(1,Number(workers||1)); const buckets=Array.from({length:W},()=>({load:0,tasks:[]}));
    t.sort((a,b)=>b-a);
    for(const job of t){ let idx=0; for(let i=1;i<W;i++) if(buckets[i].load<buckets[idx].load) idx=i; buckets[idx].load+=job; buckets[idx].tasks.push(job); }
    return buckets;
  }
}
window.ResourceSchedulingMl = ResourceSchedulingMl;
