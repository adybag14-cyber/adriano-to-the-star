class Breadcrumb {
  constructor(element) { this.element = element; this.items = []; }
  setItems(items) { this.items = items; this.render(); }
  addItem(label, href='#') { this.items.push({ label, href }); this.render(); }
  removeItem(index) { this.items.splice(index, 1); this.render(); }
  clear() { this.items = []; this.render(); }
  onItemClick(callback) { this.clickCallback = callback; }
  render() {
    if(!this.element) return;
    this.element.innerHTML = this.items.map((item, i) => 
      `<span class="breadcrumb-item" data-index="${i}">${item.label}</span>${i < this.items.length-1 ? ' > ' : ''}`
    ).join('');
  }
}
window.Breadcrumb = Breadcrumb;