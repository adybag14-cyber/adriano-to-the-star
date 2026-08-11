class NodeManagement {
  constructor() {
    this.nodes = new Map();
  }
  async init() {}
  register(id, info) {
    this.nodes.set(String(id), { status:'online', info:info||{}, ts:Date.now() });
  }
  setStatus(id, status) {
    const n = this.nodes.get(String(id));
    if (!n) return false;
    n.status = String(status);
    n.ts = Date.now();
    return true;
  }
  get(id) {
    return this.nodes.get(String(id)) || null;
  }
}
window.NodeManagement = NodeManagement;
