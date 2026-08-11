class SecurityAwarenessTraining {
  constructor() {
    this.progress = new Map();
  }
  async init() {}
  record(userId, percent) { this.progress.set(String(userId), Math.max(0, Math.min(100, Number(percent||0)))); }
  get(userId) { return this.progress.get(String(userId)) || 0; }
}
window.SecurityAwarenessTraining = SecurityAwarenessTraining;
