class DataLossPrevention {
  constructor() {}
  async init() {}
  scan(text) {
    const s = String(text||'');
    const findings = [];
    const email = s.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
    email.forEach(e => findings.push({ type:'email', value:e }));
    const ssn = s.match(/\b\d{3}-\d{2}-\d{4}\b/g) || [];
    ssn.forEach(e => findings.push({ type:'ssn', value:e }));
    return findings;
  }
}
window.DataLossPrevention = DataLossPrevention;
