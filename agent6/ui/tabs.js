class Tabs {
  constructor(element) { this.element = element; this.tabs = []; this.active = 0; }
  addTab(label, content) { this.tabs.push({ label, content }); this.render(); }
  removeTab(index) { this.tabs.splice(index, 1); if(this.active >= this.tabs.length) this.active = Math.max(0, this.tabs.length-1); this.render(); }
  setActive(index) { this.active = index; this.render(); }
  getActive() { return this.active; }
  getActiveContent() { return this.tabs[this.active]?.content || ''; }
  onTabChange(callback) { this.changeCallback = callback; }
  render() {
    if(!this.element) return;
    const headers = this.tabs.map((tab, i) => 
      `<button class="tab ${i===this.active?'active':''}" data-index="${i}">${tab.label}</button>`
    ).join('');
    const content = this.tabs[this.active]?.content || '';
    this.element.innerHTML = `<div class="tab-headers">${headers}</div><div class="tab-content">${content}</div>`;
  }
}
window.Tabs = Tabs;