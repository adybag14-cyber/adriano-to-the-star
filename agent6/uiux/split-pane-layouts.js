class SplitPaneLayouts {
  constructor() {}
  async init() {}
  create(leftId, rightId, handleId) {
    const l=document.getElementById(String(leftId)), r=document.getElementById(String(rightId)), h=document.getElementById(String(handleId));
    if (!l||!r||!h) return false;
    let dragging=false;
    h.addEventListener('mousedown',()=>{ dragging=true; });
    window.addEventListener('mouseup',()=>{ dragging=false; });
    window.addEventListener('mousemove',(e)=>{ if(!dragging) return; const x=e.clientX; l.style.width=x+'px'; r.style.left=x+'px'; });
    return true;
  }
}
window.SplitPaneLayouts = SplitPaneLayouts;
