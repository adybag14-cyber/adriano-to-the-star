class NetworkSecurityMonitoring {
  constructor() {
    this.records = [];
  }
  async init() {}
  record({ bytesIn, bytesOut }) {
    this.records.push({ bytesIn:Number(bytesIn||0), bytesOut:Number(bytesOut||0), ts:Date.now() });
  }
  summary() {
    let inSum=0, outSum=0;
    for (const r of this.records) { inSum+=r.bytesIn; outSum+=r.bytesOut; }
    return { bytesIn: inSum, bytesOut: outSum };
  }
}
window.NetworkSecurityMonitoring = NetworkSecurityMonitoring;
