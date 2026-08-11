class HardwareWalletIntegration {
  constructor() {
    this.connected = false;
  }
  async init() {}
  async connect() {
    this.connected = true;
    return true;
  }
  async disconnect() {
    this.connected = false;
    return true;
  }
  async sign(data) {
    if (!this.connected) return null;
    const te = new TextEncoder();
    const d = await crypto.subtle.digest('SHA-256', te.encode(String(data)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
}
window.HardwareWalletIntegration = HardwareWalletIntegration;
