class OnboardingWizardSystem {
  constructor() {
    this.steps = [];
    this.index = 0;
  }
  async init() {}
  setSteps(ids) { this.steps = (ids||[]).map(String); this.index = 0; this.render(); }
  next() { if (this.index < this.steps.length-1) { this.index++; this.render(); } }
  prev() { if (this.index > 0) { this.index--; this.render(); } }
  render() {
    this.steps.forEach((id,i)=>{ const el=document.getElementById(id); if (el) el.style.display = i===this.index ? 'block' : 'none'; });
  }
}
window.OnboardingWizardSystem = OnboardingWizardSystem;
