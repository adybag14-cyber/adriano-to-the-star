class Accordion {
  constructor(element) { this.element = element; this.items = []; this.allowMultiple = false; }
  addItem(title, content, expanded=false) { 
    this.items.push({ title, content, expanded }); 
    this.render(); 
  }
  removeItem(index) { 
    this.items.splice(index, 1); 
    this.render(); 
  }
  expand(index) { 
    if (!this.allowMultiple) this.items.forEach((item, i) => item.expanded = i === index);
    else this.items[index].expanded = true;
    this.render(); 
  }
  collapse(index) { 
    this.items[index].expanded = false; 
    this.render(); 
  }
  toggle(index) { 
    this.items[index].expanded = !this.items[index].expanded;
    if (!this.allowMultiple && this.items[index].expanded) {
      this.items.forEach((item, i) => item.expanded = i === index);
    }
    this.render(); 
  }
  expandAll() { 
    this.items.forEach(item => item.expanded = true); 
    this.render(); 
  }
  collapseAll() { 
    this.items.forEach(item => item.expanded = false); 
    this.render(); 
  }
  onToggle(callback) { this.toggleCallback = callback; }
  render() {
    if (!this.element) return;
    this.element.innerHTML = this.items.map((item, i) => 
      `<div class="accordion-item">
        <div class="accordion-header" data-index="${i}">${item.title}</div>
        <div class="accordion-content" style="display:${item.expanded?'block':'none'}">${item.content}</div>
       </div>`
    ).join('');
  }
}
window.Accordion = Accordion;