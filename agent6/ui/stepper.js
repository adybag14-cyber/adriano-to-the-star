class Stepper {
  constructor(element) { this.element = element; this.steps = []; this.current = 0; this.orientation = 'horizontal'; }
  addStep(label, content='') { this.steps.push({ label, content, completed: false }); this.render(); }
  removeStep(index) { this.steps.splice(index, 1); if (this.current >= this.steps.length) this.current = Math.max(0, this.steps.length - 1); this.render(); }
  next() { if (this.current < this.steps.length - 1) { this.current++; this.render(); } }
  previous() { if (this.current > 0) { this.current--; this.render(); } }
  goTo(index) { if (index >= 0 && index < this.steps.length) { this.current = index; this.render(); } }
  completeStep(index=this.current) { if (index >= 0 && index < this.steps.length) { this.steps[index].completed = true; this.render(); } }
  uncompleteStep(index) { if (index >= 0 && index < this.steps.length) { this.steps[index].completed = false; this.render(); } }
  completeAll() { this.steps.forEach(step => step.completed = true); this.render(); }
  reset() { this.steps.forEach(step => step.completed = false); this.current = 0; this.render(); }
  getCurrent() { return this.current; }
  getCurrentStep() { return this.steps[this.current]; }
  getCompletedSteps() { return this.steps.filter(step => step.completed); }
  getProgress() { return this.steps.filter(step => step.completed).length / this.steps.length; }
  isComplete() { return this.steps.every(step => step.completed); }
  onStepChange(callback) { this.stepChangeCallback = callback; }
  onComplete(callback) { this.completeCallback = callback; }
  setOrientation(orientation) { this.orientation = orientation; this.render(); }
  render() {
    if (!this.element) return;
    const orientationClass = `stepper-${this.orientation}`;
    const stepsHtml = this.steps.map((step, i) => `
      <div class="step ${i === this.current ? 'active' : ''} ${step.completed ? 'completed' : ''}" data-index="${i}">
        <div class="step-indicator">${step.completed ? '✓' : i + 1}</div>
        <div class="step-label">${step.label}</div>
        <div class="step-content" style="display:${i === this.current ? 'block' : 'none'}">${step.content}</div>
      </div>
    `).join('');
    this.element.innerHTML = `<div class="stepper ${orientationClass}">${stepsHtml}</div>`;
    if (this.stepChangeCallback) this.stepChangeCallback(this.current, this.getCurrentStep());
    if (this.isComplete() && this.completeCallback) this.completeCallback();
  }
}
window.Stepper = Stepper;