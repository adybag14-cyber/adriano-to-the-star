class ProgressIndicators {
  constructor() {}
  async init() {}
  create(targetId) {
    const t = document.getElementById(String(targetId));
    if (!t) return null;
    const bar = document.createElement('div');
    bar.style.height = '6px';
    bar.style.background = '#eee';
    const fill = document.createElement('div');
    fill.style.height = '100%';
    fill.style.width = '0%';
    fill.style.background = '#0b74de';
    fill.style.transition = 'width 0.2s';
    bar.appendChild(fill);
    t.appendChild(bar);
    return { bar, fill };
  }
  update(handle, pct) {
    if (!handle || !handle.fill) return false;
    handle.fill.style.width = Math.max(0, Math.min(100, Number(pct||0))) + '%';
    return true;
  }
}
window.ProgressIndicators = ProgressIndicators;
