class EventOracle {
  constructor() {
    this.events = new Map();
  }
  async init() {}
  submit(eventId, value) {
    const e = this.events.get(String(eventId)) || [];
    e.push(value);
    this.events.set(String(eventId), e);
  }
  finalize(eventId) {
    const e = this.events.get(String(eventId)) || [];
    if (e.length === 0) return null;
    const counts = new Map();
    for (const v of e) counts.set(String(v), (counts.get(String(v))||0)+1);
    let best = null, max = -1;
    counts.forEach((c, v) => { if (c > max) { max = c; best = v; } });
    return best;
  }
}
window.EventOracle = EventOracle;
