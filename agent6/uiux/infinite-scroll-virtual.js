class InfiniteScrollVirtual {
  constructor() { this.start=0; this.size=20; this.data=[]; this.container=null; }
  async init() {}
  mount(containerId, data) {
    this.container = document.getElementById(String(containerId));
    this.data = Array.isArray(data)?data:[];
    if (!this.container) return false;
    window.addEventListener('scroll', ()=> this.render());
    this.render();
    return true;
  }
  render() {
    if (!this.container) return;
    const idx = Math.floor(window.scrollY/50);
    this.start = Math.max(0, Math.min(this.data.length-this.size, idx));
    this.container.innerHTML='';
    for (let i=this.start;i<Math.min(this.start+this.size, this.data.length);i++) {
      const d=document.createElement('div'); d.textContent=String(this.data[i]); d.style.padding='4px 8px'; this.container.appendChild(d);
    }
  }
}
window.InfiniteScrollVirtual = InfiniteScrollVirtual;
