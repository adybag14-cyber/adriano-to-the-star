class SecurityGovernance {
  constructor() {
    this.policies = new Map();
  }
  async init() {}
  addPolicy(name, details) { this.policies.set(String(name), { details: details || {}, status:'draft' }); }
  approve(name) { const p=this.policies.get(String(name)); if (p) p.status='approved'; }
  list(status) { const out=[]; this.policies.forEach((v,k)=>{ if(!status || v.status===String(status)) out.push({ name:k, status:v.status }); }); return out; }
}
window.SecurityGovernance = SecurityGovernance;
