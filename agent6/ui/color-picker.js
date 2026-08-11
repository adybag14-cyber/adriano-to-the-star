class ColorPicker {
  constructor(element) { this.element = element; this.color = '#000000'; this.format = 'hex'; this.presetColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff']; }
  setColor(color) { this.color = color; this.render(); if (this.changeCallback) this.changeCallback(this.color); }
  getColor() { return this.color; }
  setFormat(format) { this.format = format; this.render(); }
  getFormat() { return this.format; }
  setPresetColors(colors) { this.presetColors = colors; this.render(); }
  addPresetColor(color) { if (!this.presetColors.includes(color)) { this.presetColors.push(color); this.render(); } }
  removePresetColor(color) { this.presetColors = this.presetColors.filter(c => c !== color); this.render(); }
  toHex() { return this.color; }
  toRgb() { const hex = this.color.replace('#', ''); return { r: parseInt(hex.substr(0, 2), 16), g: parseInt(hex.substr(2, 2), 16), b: parseInt(hex.substr(4, 2), 16) }; }
  toHsl() { const rgb = this.toRgb(); const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255; const max = Math.max(r, g, b), min = Math.min(r, g, b); let h, s, l = (max + min) / 2; if (max === min) { h = s = 0; } else { const d = max - min; s = l > 0.5 ? d / (2 - max - min) : d / (max + min); switch (max) { case r: h = (g - b) / d + (g < b ? 6 : 0); break; case g: h = (b - r) / d + 2; break; case b: h = (r - g) / d + 4; break; } h /= 6; } return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) }; }
  onChange(callback) { this.changeCallback = callback; }
  render() {
    if (!this.element) return;
    this.element.innerHTML = `
      <div class="color-picker">
        <div class="color-display" style="background-color: ${this.color}"></div>
        <input type="color" value="${this.color}" onchange="this.parentElement.colorPicker.setColor(this.value)">
        <div class="preset-colors">
          ${this.presetColors.map(color => `<div class="preset-color" style="background-color: ${color}" onclick="this.parentElement.parentElement.colorPicker.setColor('${color}')"></div>`).join('')}
        </div>
      </div>
    `;
    this.element.colorPicker = this;
  }
}
window.ColorPicker = ColorPicker;