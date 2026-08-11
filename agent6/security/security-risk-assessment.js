class SecurityRiskAssessment {
  constructor() {}
  async init() {}
  assess(items) {
    let score = 0;
    for (const it of (items||[])) {
      const sev = String(it.severity||'low');
      score += sev === 'high' ? 10 : sev === 'medium' ? 5 : 1;
    }
    const tier = score >= 50 ? 'high' : score >= 20 ? 'medium' : 'low';
    return { score, tier };
  }
}
window.SecurityRiskAssessment = SecurityRiskAssessment;
