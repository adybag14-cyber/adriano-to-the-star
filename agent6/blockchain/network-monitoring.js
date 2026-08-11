class NetworkMonitoring {
  constructor() {
    this.metrics = new Map();
  }
  async init() {}
  record(nodeId, { latencyMs, peers }) {
    this.metrics.set(String(nodeId), { latencyMs:Number(latencyMs||0), peers:Number(peers||0), ts:Date.now() });
  }
  get(nodeId) {
    return this.metrics.get(String(nodeId)) || null;
  }
}
window.NetworkMonitoring = NetworkMonitoring;
