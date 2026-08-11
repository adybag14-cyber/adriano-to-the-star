class ProgressBar {
  constructor(element) { this.element = element; this.value = 0; this.max = 100; this.min = 0; this.showLabel = true; this.animated = false; }
  setValue(value) { this.value = Math.max(this.min, Math.min(value, this.max)); this.render(); }
  setMax(max) { this.max = max; this.render(); }
  setMin(min) { this.min = min; this.render(); }
  setShowLabel(show) { this.showLabel = show; this.render(); }
  setAnimated(animated) { this.animated = animated; this.render(); }
  getValue() { return this.value; }
  getPercentage() { return ((this.value - this.min) / (this.max - this.min)) * 100; }
  increment(amount=1) { this.setValue(this.value + amount); }
  decrement(amount=1) { this.setValue(this.value - amount); }
  complete() { this.setValue(this.max); }
  reset() { this.setValue(this.min); }
  isComplete() { return this.value >= this.max; }
  onComplete(callback) { this.completeCallback = callback; }
  render() {
    if (!this.element) return;
    const percentage = this.getPercentage();
    const label = this.showLabel ? `${Math.round(percentage)}%` : '';
    this.element.innerHTML = `
      <div class="progress-bar-container">
        <div class="progress-bar ${this.animated ? 'animated' : ''}" style="width: ${percentage}%;"></div>
        <span class="progress-label">${label}</span>
      </div>
    `;
    if (this.isComplete() && this.completeCallback) {
      this.completeCallback();
    }
  }
}
window.ProgressBar = ProgressBar;