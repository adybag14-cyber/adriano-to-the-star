class EndpointSecurity {
  constructor() {
    this.processes = [];
  }
  async init() {}
  report(name, cpu) { this.processes.push({ name:String(name), cpu:Number(cpu||0), ts:Date.now() }); }
  topCpu(n) {
    const arr = this.processes.slice().sort((a,b)=>b.cpu-a.cpu);
    return arr.slice(0, Math.max(1, Number(n||5)));
  }
}
window.EndpointSecurity = EndpointSecurity;
