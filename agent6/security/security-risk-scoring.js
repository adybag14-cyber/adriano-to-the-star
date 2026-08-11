class SecurityRiskScoring {
  constructor() {}
  async init() {}
  score({ vulnerabilities, criticalFindings, exposureLevel }) {
    const v = Number(vulnerabilities||0);
    const c = Number(criticalFindings||0);
    const e = Number(exposureLevel||0);
    const s = v*1 + c*5 + e*2;
    const tier = s >= 50 ? 'high' : s >= 20 ? 'medium' : 'low';
    return { score: s, tier };
  }
}
window.SecurityRiskScoring = SecurityRiskScoring;
