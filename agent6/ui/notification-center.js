class NotificationCenter {
  constructor() { this.notifications = []; this.maxVisible = 5; this.position = 'top-right'; this.autoHide = 3000; }
  show(message, type='info', options={}) {
    const notification = {
      id: Date.now() + Math.random(),
      message,
      type,
      timestamp: Date.now(),
      autoHide: options.autoHide !== undefined ? options.autoHide : this.autoHide,
      persistent: options.persistent || false,
      actions: options.actions || [],
      data: options.data || null
    };
    this.notifications.unshift(notification);
    if (this.notifications.length > this.maxVisible && !notification.persistent) {
      this.notifications = this.notifications.slice(0, this.maxVisible);
    }
    this.render();
    if (notification.autoHide > 0 && !notification.persistent) {
      setTimeout(() => this.hide(notification.id), notification.autoHide);
    }
    return notification.id;
  }
  hide(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.render();
  }
  hideAll() {
    this.notifications = [];
    this.render();
  }
  success(message, options) { return this.show(message, 'success', options); }
  error(message, options) { return this.show(message, 'error', options); }
  warning(message, options) { return this.show(message, 'warning', options); }
  info(message, options) { return this.show(message, 'info', options); }
  setPosition(position) { this.position = position; this.render(); }
  setMaxVisible(max) { this.maxVisible = max; this.render(); }
  setAutoHide(delay) { this.autoHide = delay; }
  getNotifications() { return this.notifications; }
  getNotification(id) { return this.notifications.find(n => n.id === id); }
  onAction(notificationId, actionId, callback) {
    const notification = this.getNotification(notificationId);
    if (notification) {
      notification.actions = notification.actions || [];
      notification.actions.push({ id: actionId, callback });
    }
  }
  render() {
    let container = document.getElementById('notification-center');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-center';
      container.className = `notification-center notification-${this.position}`;
      document.body.appendChild(container);
    }
    container.innerHTML = this.notifications.map(n => `
      <div class="notification notification-${n.type}" data-id="${n.id}">
        <div class="notification-content">${n.message}</div>
        <div class="notification-actions">
          ${n.actions.map(a => `<button onclick="notificationCenter.handleAction(${n.id}, '${a.id}')">${a.id}</button>`).join('')}
          <button onclick="notificationCenter.hide(${n.id})">×</button>
        </div>
      </div>
    `).join('');
  }
  handleAction(notificationId, actionId) {
    const notification = this.getNotification(notificationId);
    if (notification) {
      const action = notification.actions.find(a => a.id === actionId);
      if (action && action.callback) {
        action.callback(notification);
      }
    }
  }
}
window.NotificationCenter = NotificationCenter;
window.notificationCenter = new NotificationCenter();