class DragDropFileUpload {
  constructor() {}
  async init() {}
  attach(zoneId, onFiles) {
    const z = document.getElementById(String(zoneId));
    if (!z) return false;
    z.addEventListener('dragover', (e) => { e.preventDefault(); z.style.background='#eef'; });
    z.addEventListener('dragleave', () => { z.style.background=''; });
    z.addEventListener('drop', (e) => { e.preventDefault(); z.style.background=''; const files = Array.from(e.dataTransfer.files||[]); if (typeof onFiles==='function') onFiles(files); });
    return true;
  }
}
window.DragDropFileUpload = DragDropFileUpload;
