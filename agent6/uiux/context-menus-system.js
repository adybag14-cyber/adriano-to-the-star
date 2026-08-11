class ContextMenusSystem {
  constructor() { this.menu = null; }
  async init() {}
  attach(target) {
    const t = typeof target === 'string' ? document.getElementById(target) : target;
    if (!t) return false;
    t.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.show(e.clientX, e.clientY, ['Refresh','Settings']);
    });
    return true;
  }
  show(x, y, items) {
    const el = this.menu || document.createElement('div');
    el.style.position = 'fixed';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.style.background = '#fff';
    el.style.border = '1px solid #ccc';
    el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    el.style.zIndex = '9999';
    el.innerHTML = '';
    const list = document.createElement('ul');
    list.style.listStyle = 'none'; list.style.margin='0'; list.style.padding='6px';
    (items||[]).forEach(txt => { const li = document.createElement('li'); li.textContent = txt; li.style.padding='4px 8px'; list.appendChild(li); });
    el.appendChild(list);
    document.body.appendChild(el);
    this.menu = el;
  }
  hide() { if (this.menu) this.menu.remove(); this.menu = null; }
}
window.ContextMenusSystem = ContextMenusSystem;
