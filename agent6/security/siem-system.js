class SiemSystem {
  constructor() {
    this.events = [];
  }
  async init() {}
  add(event) {
    if (!event || typeof event !== "object") return false;
    this.events.push({
      type: String(event.type || "info"),
      severity: String(event.severity || "low"),
      message: String(event.message || ""),
      ts: Number(event.ts || Date.now()),
      meta: event.meta || null,
    });
    return true;
  }
  query({ type, severity, since, until }) {
    const t = type != null ? String(type) : null;
    const s = severity != null ? String(severity) : null;
    const a = Number(since || 0);
    const b = Number(until || Number.MAX_SAFE_INTEGER);
    return this.events.filter(e => {
      if (t && e.type !== t) return false;
      if (s && e.severity !== s) return false;
      return e.ts >= a && e.ts <= b;
    });
  }
  clear() {
    this.events = [];
  }
}
window.SiemSystem = SiemSystem;
