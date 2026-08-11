class Spinner {
  constructor(element) { this.element = element; this.size = 'medium'; this.color = '#333'; this.speed = 'normal'; this.visible = false; }
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
      <div class="spinner ${sizeClass} ${speedClass}">
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
        <div class="spinner-blade"></div>
      </div>
    ` : '';
  }
}
window.Spinner = Spinner;