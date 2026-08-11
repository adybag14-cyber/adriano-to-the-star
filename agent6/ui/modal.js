class Modal {
  constructor() { this.isOpen = false; this.content = ''; this.title = ''; }
  open(title, content) {
    this.title = title;
    this.content = content;
    this.isOpen = true;
    this.render();
  }
  close() {
    this.isOpen = false;
    this.render();
  }
  setContent(content) {
    this.content = content;
    if (this.isOpen) this.render();
  }
  setTitle(title) {
    this.title = title;
    if (this.isOpen) this.render();
  }
  onClose(callback) { this.closeCallback = callback; }
  onOpen(callback) { this.openCallback = callback; }
  render() {
    let modal = document.getElementById('modal-overlay');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-overlay';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.display = 'none';
      modal.style.justifyContent = 'center';
      modal.style.alignItems = 'center';
      document.body.appendChild(modal);
    }
    if (this.isOpen) {
      modal.innerHTML = `
        <div style="background:white;padding:20px;border-radius:8px;max-width:500px;">
          <h3>${this.title}</h3>
          <div>${this.content}</div>
          <button onclick="window.modal.close()">Close</button>
        </div>
      `;
      modal.style.display = 'flex';
      if (this.openCallback) this.openCallback();
    } else {
      modal.style.display = 'none';
      if (this.closeCallback) this.closeCallback();
    }
  }
}
window.Modal = Modal;
window.modal = new Modal();