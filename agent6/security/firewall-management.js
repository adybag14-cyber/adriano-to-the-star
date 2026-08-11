class FirewallManagement {
  constructor() {
    this.rules = [];
  }
  async init() {}
  addRule({ action, port, protocol }) {
    this.rules.push({ action:String(action||'allow'), port:Number(port||0), protocol:String(protocol||'tcp') });
  }
  check({ port, protocol }) {
    const p = Number(port||0);
    const proto = String(protocol||'tcp');
    for (const r of this.rules) {
      if (r.port === p && r.protocol === proto) return r.action === 'allow';
    }
    return true;
  }
}
window.FirewallManagement = FirewallManagement;
