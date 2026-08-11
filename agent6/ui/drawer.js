class Drawer {
  constructor(element) { this.element = element; this.opened = false; this.position = 'left'; }
  open() { this.opened = true; this.render(); }
  close() { this.opened = false; this.render(); }
  toggle() { this.opened = !this.opened; this.render(); }
  setPosition(pos) { this.position = pos; this.render(); }
  setContent(content) { this.content = content; this.render(); }
  onOpen(callback) { this.openCallback = callback; }
  onClose(callback) { this.closeCallback = callback; }
  render() {
    if(!this.element) return;
    this.element.className = `drawer drawer-${this.position} ${this.opened ? 'open' : ''}`;
    if(this.content) this.element.innerHTML = this.content;
  }
}
window.Drawer = Drawer;