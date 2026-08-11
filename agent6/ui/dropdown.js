class Dropdown {
  constructor(element) { this.element = element; this.items = []; this.selected = null; this.isOpen = false; }
  addItem(label, value) { this.items.push({ label, value }); this.render(); }
  removeItem(index) { this.items.splice(index, 1); this.render(); }
  setItems(items) { this.items = items; this.render(); }
  select(index) { 
    this.selected = index; 
    this.isOpen = false; 
    this.render(); 
    if (this.changeCallback) this.changeCallback(this.items[index]);
  }
  selectByValue(value) {
    const index = this.items.findIndex(item => item.value === value);
    if (index !== -1) this.select(index);
  }
  getSelected() { return this.selected !== null ? this.items[this.selected] : null; }
  getSelectedValue() { return this.selected !== null ? this.items[this.selected].value : null; }
  getSelectedLabel() { return this.selected !== null ? this.items[this.selected].label : null; }
  toggle() { this.isOpen = !this.isOpen; this.render(); }
  open() { this.isOpen = true; this.render(); }
  close() { this.isOpen = false; this.render(); }
  onChange(callback) { this.changeCallback = callback; }
  render() {
    if (!this.element) return;
    const selected = this.selected !== null ? this.items[this.selected] : { label: 'Select...', value: null };
    this.element.innerHTML = `
      <div class="dropdown-toggle" onclick="this.parentElement.dropdown.toggle()">${selected.label}</div>
      <div class="dropdown-menu" style="display:${this.isOpen?'block':'none'}">
        ${this.items.map((item, i) => `<div class="dropdown-item" onclick="this.parentElement.parentElement.dropdown.select(${i})">${item.label}</div>`).join('')}
      </div>
    `;
    this.element.dropdown = this;
  }
}
window.Dropdown = Dropdown;