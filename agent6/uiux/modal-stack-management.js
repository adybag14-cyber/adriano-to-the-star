class ModalStackManagement {
  constructor() {
    this.stack = [];
    this.container = null;
  }
  async init() {}
  open(content) {
    const c = this.ensureContainer();
    const overlay = document.createElement("div");
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "16px";
    box.style.borderRadius = "6px";
    box.textContent = String(content || "");
    overlay.appendChild(box);
    c.appendChild(overlay);
    this.stack.push(overlay);
    return true;
  }
  close() {
    const overlay = this.stack.pop();
    if (overlay) overlay.remove();
    return !!overlay;
  }
  count() {
    return this.stack.length;
  }
  ensureContainer() {
    if (this.container && document.body.contains(this.container)) return this.container;
    const c = document.getElementById("modal-stack-container") || document.createElement("div");
    c.id = "modal-stack-container";
    document.body.appendChild(c);
    this.container = c;
    return c;
  }
}
window.ModalStackManagement = ModalStackManagement;
