class SwipeableCardComponents {
  constructor() {}
  async init() {}
  attach(id, onSwipeLeft, onSwipeRight) {
    const el = document.getElementById(String(id));
    if (!el) return false;
    let sx=null;
    el.addEventListener('touchstart',(e)=>{ sx=e.touches[0].clientX; });
    el.addEventListener('touchend',(e)=>{ const dx=e.changedTouches[0].clientX - (sx||0); if (dx<-50 && typeof onSwipeLeft==='function') onSwipeLeft(); if (dx>50 && typeof onSwipeRight==='function') onSwipeRight(); sx=null; });
    return true;
  }
}
window.SwipeableCardComponents = SwipeableCardComponents;
