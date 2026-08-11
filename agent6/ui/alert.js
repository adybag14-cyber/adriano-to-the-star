class Alert {
  constructor() { this.alerts = []; this.position = 'top-right'; this.autoClose = 5000; this.maxAlerts = 5; }
  show(message, type='info', options={}) {
    const alert = {
      id: Date.now() + Math.random(),
      message,
      type,
      autoClose: options.autoClose !== undefined ? options.autoClose : this.autoClose,
      persistent: options.persistent || false,
      actions: options.actions || [],
      timestamp: Date.now()
    };
    this.alerts.unshift(alert);
    if (this.alerts.length > this.maxAlerts) {
      this.alerts = this.alerts.slice(0, this.maxAlerts);
    }
    this.render();
    if (alert.autoClose > 0 && !alert.persistent) {
      setTimeout(() => this.close(alert.id), alert.autoClose);
    }
    return alert.id;
  }
  success(message, options) { return this.show(message, 'success', options); }
  error(message, options) { return this.show(message, 'error', options); }
  warning(message, options) { return this.show(message, 'warning', options); }
  info(message, options) { return this.show(message, 'info', options); }
  close(id) {
    this.alerts = this.alerts.filter(a => a.id !== id);
    this.render();
  }
  closeAll() {
    this.alerts = [];
    this.render();
  }
  setPosition(position) { this.position = position; this.render(); }
  setAutoClose(delay) { this.autoClose = delay; }
  setMaxAlerts(max) { this.maxAlerts = max; this.render(); }
  getAlerts() { return this.alerts; }
  getAlert(id) { return this.alerts.find(a => a.id === id); }
  onAction(alertId, actionId, callback) {
    const alert = this.getAlert(alertId);
    if (alert) {
      alert.actions = alert.actions || [];
      alert.actions.push({ id: actionId, callback });
    }
  }
  render() {
    let container = document.getElementById('alert-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'alert-container';
      container.className = `alert-container alert-${this.position}`;
      document.body.appendChild(container);
    }
    container.innerHTML = this.alerts.map(alert => `
      <div class="alert alert-${alert.type}" data-id="${alert.id}">
        <div class="alert-content">${alert.message}</div>
        <div class="alert-actions">
          ${alert.actions.map(a => `<button onclick="alertSystem.handleAction(${alert.id}, '${a.id}')">${a.id}</button>`).join('')}
          <button onclick="alertSystem.close(${alert.id})">×</button>
        </div>
      </div>
    `).join('');
  }
  handleAction(alertId, actionId) {
    const alert = this.getAlert(alertId);
    if (alert) {
      const action = alert.actions.find(a => a.id === actionId);
      if (action && action.callback) {
        action.callback(alert);
      }
    }
  }
}
window.Alert = Alert;
window.alertSystem = new Alert();