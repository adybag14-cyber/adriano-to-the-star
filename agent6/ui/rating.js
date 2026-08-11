class Rating {
  constructor(element) { this.element = element; this.max = 5; this.value = 0; this.readonly = false; this.size = 'medium'; }
  setMax(max) { this.max = max; this.render(); }
  setValue(value) { this.value = Math.max(0, Math.min(value, this.max)); this.render(); }
  setReadonly(readonly) { this.readonly = readonly; this.render(); }
  setSize(size) { this.size = size; this.render(); }
  getValue() { return this.value; }
  getMax() { return this.max; }
  isReadonly() { return this.readonly; }
  rate(value) {
    if (this.readonly) return false;
    this.setValue(value);
    if (this.changeCallback) this.changeCallback(this.value);
    return true;
  }
  clear() { this.setValue(0); }
  onChange(callback) { this.changeCallback = callback; }
  onHover(callback) { this.hoverCallback = callback; }
  render() {
    if (!this.element) return;
    const sizeClass = `rating-${this.size}`;
    const stars = Array(this.max).fill(0).map((_, i) => {
      const filled = i < Math.floor(this.value) ? 'filled' : i < this.value ? 'half' : 'empty';
      const clickable = this.readonly ? '' : 'clickable';
      return `<span class="rating-star ${filled} ${clickable}" data-value="${i + 1}" 
                     onclick="this.parentElement.rating.rate(${i + 1})"
                     onmouseenter="this.parentElement.rating.handleHover(${i + 1})">★</span>`;
    }).join('');
    this.element.innerHTML = `<div class="rating-container ${sizeClass}">${stars}</div>`;
    this.element.rating = this;
  }
  handleHover(value) {
    if (this.hoverCallback) this.hoverCallback(value);
  }
}
window.Rating = Rating;