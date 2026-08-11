class LeadScoring {
  constructor() {}
  async init() {}
  score(lead, weights) {
    const w = weights || { activity:0.4, fit:0.3, intent:0.3 };
    const a = Number(lead?.activity||0), f = Number(lead?.fit||0), i = Number(lead?.intent||0);
    return a*w.activity + f*w.fit + i*w.intent;
  }
}
window.LeadScoring = LeadScoring;
