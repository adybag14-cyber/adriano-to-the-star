class IntrusionDetectionSystem {
  constructor() {
    this.events = [];
    this.thresholds = { high: 3 };
  }
  async init() {}
  record({ type, severity }) {
    this.events.push({ type:String(type||'unknown'), severity:String(severity||'low'), ts:Date.now() });
  }
  alerts() {
    const counts = { high:0, medium:0, low:0 };
    for (const e of this.events) if (counts[e.severity] != null) counts[e.severity]++;
    const out = [];
    if (counts.high >= this.thresholds.high) out.push({ severity:'high', count:counts.high });
    return out;
  }
  clear() { this.events = []; }
}
window.IntrusionDetectionSystem = IntrusionDetectionSystem;
