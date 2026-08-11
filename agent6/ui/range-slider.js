class RangeSlider {
  constructor(element) { this.element = element; this.min = 0; this.max = 100; this.start = 25; this.end = 75; this.step = 1; }
  setMin(min) { this.min = min; this.render(); }
  setMax(max) { this.max = max; this.render(); }
  setStart(start) { this.start = Math.max(this.min, Math.min(start, this.end)); this.render(); }
  setEnd(end) { this.end = Math.max(this.start, Math.min(end, this.max)); this.render(); }
  setStep(step) { this.step = step; this.render(); }
  getStart() { return this.start; }
  getEnd() { return this.end; }
  getRange() { return this.end - this.start; }
  onChange(callback) { this.changeCallback = callback; }
  onInput(callback) { this.inputCallback = callback; }
  render() {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="range-slider-container">
        <input type="range" min="${this.min}" max="${this.max}" value="${this.start}" step="${this.step}"
               onchange="this.parentElement.slider.handleStartChange(this.value)"
               oninput="this.parentElement.slider.handleStartInput(this.value)">
        <input type="range" min="${this.min}" max="${this.max}" value="${this.end}" step="${this.step}"
               onchange="this.parentElement.slider.handleEndChange(this.value)"
               oninput="this.parentElement.slider.handleEndInput(this.value)">
        <span class="range-values">${this.start} - ${this.end}</span>
      </div>
    `;
    this.element.slider = this;
  }
  handleStartChange(value) {
    this.start = parseFloat(value);
    this.render();
    if (this.changeCallback) this.changeCallback({ start: this.start, end: this.end });
  }
  handleStartInput(value) {
    this.start = parseFloat(value);
    this.render();
    if (this.inputCallback) this.inputCallback({ start: this.start, end: this.end });
  }
  handleEndChange(value) {
    this.end = parseFloat(value);
    this.render();
    if (this.changeCallback) this.changeCallback({ start: this.start, end: this.end });
  }
  handleEndInput(value) {
    this.end = parseFloat(value);
    this.render();
    if (this.inputCallback) this.inputCallback({ start: this.start, end: this.end });
  }
}
window.RangeSlider = RangeSlider;