class ToggleSwitch {
  constructor(element) { this.element = element; this.checked = false; this.disabled = false; this.size = 'medium'; this.onText = 'ON'; this.offText = 'OFF'; }
  setChecked(checked) { this.checked = checked; this.render(); if (this.changeCallback) this.changeCallback(this.checked); }
  isChecked() { return this.checked; }
  setDisabled(disabled) { this.disabled = disabled; this.render(); }
  isDisabled() { return this.disabled; }
  setSize(size) { this.size = size; this.render(); }
  getSize() { return this.size; }
  setOnText(text) { this.onText = text; this.render(); }
  getOnText() { return this.onText; }
  setOffText(text) { this.offText = text; this.render(); }
  getOffText() { return this.offText; }
  toggle() { if (!this.disabled) this.setChecked(!this.checked); }
  onChange(callback) { this.changeCallback = callback; }
  render() {
    if (!this.element) return;
    const sizeClass = `toggle-${this.size}`;
    const checkedClass = this.checked ? 'checked' : '';
    const disabledClass = this.disabled ? 'disabled' : '';
    this.element.innerHTML = `
      <label class="toggle-switch ${sizeClass} ${checkedClass} ${disabledClass}">
        <input type="checkbox" ${this.checked ? 'checked' : ''} ${this.disabled ? 'disabled' : ''} 
               onchange="this.parentElement.toggleSwitch.handleChange(this.checked)">
        <span class="toggle-slider"></span>
        <span class="toggle-text">${this.checked ? this.onText : this.offText}</span>
      </label>
    `;
    this.element.toggleSwitch = this;
  }
  handleChange(checked) {
    this.checked = checked;
    this.render();
    if (this.changeCallback) this.changeCallback(this.checked);
  }
}
window.ToggleSwitch = ToggleSwitch;