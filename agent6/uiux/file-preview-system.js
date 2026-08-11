class FilePreviewSystem {
  constructor() {}
  async init() {}
  previewText(targetId, text) {
    const t = document.getElementById(String(targetId));
    if (!t) return false;
    const pre = document.createElement('pre');
    pre.textContent = String(text||'');
    t.appendChild(pre);
    return true;
  }
}
window.FilePreviewSystem = FilePreviewSystem;
