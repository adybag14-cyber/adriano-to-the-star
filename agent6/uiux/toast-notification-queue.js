class ToastNotificationQueue {
  constructor() {
    this.queue = [];
    this.active = false;
  }
  async init() {}
  enqueue(text) {
    this.queue.push(String(text || ""));
    this.process();
  }
  process() {
    if (this.active) return;
    const next = this.queue.shift();
    if (next == null) return;
    this.active = true;
    const container = document.getElementById("toast-container") || this.createContainer();
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = next;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
      this.active = false;
      this.process();
    }, 3000);
  }
  createContainer() {
    const c = document.createElement("div");
    c.id = "toast-container";
    document.body.appendChild(c);
    return c;
  }
}
window.ToastNotificationQueue = ToastNotificationQueue;
