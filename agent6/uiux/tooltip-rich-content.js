class TooltipRichContent {
  constructor() { this.el = null; }
  async init() {}
  show(targetId, html) {
    const t = document.getElementById(String(targetId));
    if (!t) return false;
    const rect = t.getBoundingClientRect();
    const el = this.el || document.createElement('div');
    el.className = 'tooltip-rich';
    el.style.position = 'fixed';
    el.style.left = (rect.left) + 'px';
    el.style.top = (rect.bottom + 8) + 'px';
    el.style.background = '#222';
    el.style.color = '#fff';
    el.style.padding = '8px 10px';
    el.style.borderRadius = '4px';
    el.innerHTML = String(html||'');
    document.body.appendChild(el);
    this.el = el;
    return true;
  }
  hide() { if (this.el) this.el.remove(); this.el = null; }
}
window.TooltipRichContent = TooltipRichContent;
