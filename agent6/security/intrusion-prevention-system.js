class IntrusionPreventionSystem {
  constructor() {
    this.blocklist = new Set();
  }
  async init() {}
  block(ip) { this.blocklist.add(String(ip)); }
  unblock(ip) { this.blocklist.delete(String(ip)); }
  isBlocked(ip) { return this.blocklist.has(String(ip)); }
}
window.IntrusionPreventionSystem = IntrusionPreventionSystem;
