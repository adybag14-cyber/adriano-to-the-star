class FileUploadProgress {
  constructor() {}
  async init() {}
  simulate(targetId, totalMs) {
    const t = document.getElementById(String(targetId));
    if (!t) return false;
    let p = 0;
    const bar = document.createElement('div');
    bar.style.height='6px'; bar.style.background='#eee';
    const fill = document.createElement('div');
    fill.style.height='100%'; fill.style.width='0%'; fill.style.background='#3b82f6';
    bar.appendChild(fill); t.appendChild(bar);
    const step = Math.max(50, Math.floor(Number(totalMs||1000)/20));
    const id = setInterval(()=>{ p+=5; fill.style.width=p+'%'; if (p>=100){ clearInterval(id); } }, step);
    return true;
  }
}
window.FileUploadProgress = FileUploadProgress;
