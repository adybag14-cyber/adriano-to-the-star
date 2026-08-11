class KeyboardNavigationEnhancement {
  constructor() {}
  async init() {}
  attachList(listId) {
    const list = document.getElementById(String(listId));
    if (!list) return false;
    const items = Array.from(list.querySelectorAll('[data-nav-item]'));
    let idx = 0;
    const select = i => { items.forEach((el,j)=>{ el.classList.toggle('active', j===i); }); };
    select(idx);
    list.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { idx = Math.min(items.length-1, idx+1); select(idx); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { idx = Math.max(0, idx-1); select(idx); e.preventDefault(); }
    });
    list.tabIndex = 0;
    list.focus();
    return true;
  }
}
window.KeyboardNavigationEnhancement = KeyboardNavigationEnhancement;
