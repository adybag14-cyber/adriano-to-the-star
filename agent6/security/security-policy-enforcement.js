class SecurityPolicyEnforcement {
  constructor() {}
  async init() {}
  decide(request) {
    const r = request || {};
    if (String(r.role||'') === 'guest' && String(r.action||'') === 'admin') return { allow:false, reason:'role' };
    if (Number(r.size||0) > 10*1024*1024) return { allow:false, reason:'size' };
    return { allow:true };
  }
}
window.SecurityPolicyEnforcement = SecurityPolicyEnforcement;
