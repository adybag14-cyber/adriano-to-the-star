class Slider {
  constructor(element) { this.element = element; this.min = 0; this.max = 100; this.value = 50; this.step = 1; }
  setMin(min) { this.min = min; this.render(); }
  setMax(max) { this.max = max; this.render(); }
  setValue(value) { this.value = Math.max(this.min, Math.min(value, this.max)); this.render(); }
  setStep(step) { this.step = step; this.render(); }
  getValue() { return this.value; }
  getPercentage() { return ((this.value - this.min) / (this.max - this.min)) * 100; }
  increase(step=this.step) { this.setValue(this.value + step); }
  decrease(step=this.step) { this.setValue(this.value - step); }
  onChange(callback) { this.changeCallback = callback; }
  onInput(callback) { this.inputCallback = callback; }
  render() {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="slider-container">
        <input type="range" min="${this.min}" max="${this.max}" value="${this.value}" step="${this.step}" 
               onchange="this.parentElement.slider.handleChange(this.value)" 
               oninput="this.parentElement.slider.handleInput(this.value)">
        <span class="slider-value">${this.value}</span>
      </div>
    `;
    this.element.slider = this;
  }
  handleChange(value) {
    this.value = parseFloat(value);
    this.render();
    if (this.changeCallback) this.changeCallback(this.value);
  }
  handleInput(value) {
    this.value = parseFloat(value);
    this.render();
    if (this.inputCallback) this.inputCallback(this.value);
  }
}
window.Slider = Slider;