class AutomlPlatform {
  constructor() {}
  async init() {}
  select(models) {
    const arr = Array.isArray(models) ? models : [];
    let best = null;
    for (const m of arr) {
      if (!best || Number(m.metric||0) > Number(best.metric||0)) best = m;
    }
    return best;
  }
}
window.AutomlPlatform = AutomlPlatform;
