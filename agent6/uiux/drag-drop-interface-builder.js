class DragDropInterfaceBuilder {
  constructor() { this.components=[]; }
  async init() {}
  addComponent(type, props) { this.components.push({ type:String(type), props:props||{} }); }
  render(canvasId) {
    const c=document.getElementById(String(canvasId)); if(!c) return false; c.innerHTML='';
    for (const comp of this.components) {
      const el=document.createElement('div'); el.textContent=comp.type; el.style.padding='4px 6px'; el.style.border='1px solid #ddd'; el.style.margin='4px 0'; c.appendChild(el);
    }
    return true;
  }
}
window.DragDropInterfaceBuilder = DragDropInterfaceBuilder;
