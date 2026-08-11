class LoadingSpinner {
  constructor(element) { this.element = element; this.size = 'medium'; this.color = '#000'; this.speed = 'normal'; this.visible = false; }
  setSize(size) { this.size = size; this.render(); }
  setColor(color) { this.color = color; this.render(); }
  setSpeed(speed) { this.speed = speed; this.render(); }
  show() { this.visible = true; this.render(); }
  hide() { this.visible = false; this.render(); }
  toggle() { this.visible = !this.visible; this.render(); }
  isVisible() { return this.visible; }
  render() {
    if (!this.element) return;
    const sizeClass = `spinner-${this.size}`;
    const speedClass = `spinner-${this.speed}`;
    this.element.innerHTML = this.visible ? `
      <div class="loading-spinner ${sizeClass} ${speedClass}">
        <div class="spinner-circle" style="border-color: ${this.color} transparent transparent transparent"></div>
      </div>
    ` : '';
  }
}
window.LoadingSpinner = LoadingSpinner;