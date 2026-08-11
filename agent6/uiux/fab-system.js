class FabSystem {
  constructor() {}
  async init() {}
  create(id, text, onClick) {
    const el = document.getElementById(String(id)) || document.body;
    const b = document.createElement('button');
    b.textContent = String(text||'+');
    b.style.position='fixed'; b.style.right='16px'; b.style.bottom='16px'; b.style.borderRadius='50%'; b.style.width='44px'; b.style.height='44px'; b.style.background='#f43f5e'; b.style.color='#fff';
    b.addEventListener('click', ()=>{ if(typeof onClick==='function') onClick(); });
    el.appendChild(b);
    return true;
  }
}
window.FabSystem = FabSystem;
