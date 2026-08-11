class PrivilegedAccessManagement {
  constructor() {
    this.users = new Set();
  }
  async init() {}
  grant(userId) { this.users.add(String(userId)); }
  revoke(userId) { this.users.delete(String(userId)); }
  isPrivileged(userId) { return this.users.has(String(userId)); }
}
window.PrivilegedAccessManagement = PrivilegedAccessManagement;
