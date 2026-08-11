class NetworkOptimization {
  constructor() {}
  async init() {}
  recommendChunkSize({ bandwidthMbps, latencyMs }) {
    const bw = Number(bandwidthMbps||10);
    const lt = Number(latencyMs||50);
    const bps = bw * 1024 * 1024 / 8;
    return Math.max(1024, Math.min(1024*1024, Math.round(bps * (lt/1000))));
  }
}
window.NetworkOptimization = NetworkOptimization;
