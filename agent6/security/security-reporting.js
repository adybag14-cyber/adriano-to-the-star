class SecurityReporting {
  constructor() {
    this.entries = [];
  }
  async init() {}
  add(entry) {
    if (!entry || typeof entry !== "object") return;
    this.entries.push({
      type: entry.type || "info",
      message: String(entry.message || ""),
      timestamp: entry.timestamp || Date.now(),
    });
  }
  getAll() {
    return this.entries.slice();
  }
  clear() {
    this.entries = [];
  }
}
window.SecurityReporting = SecurityReporting;
