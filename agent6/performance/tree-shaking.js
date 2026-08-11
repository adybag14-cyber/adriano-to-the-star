class TreeShaking {
  constructor() {}
  async init() {}
  shake(exports, used) {
    const u = new Set((used||[]).map(String));
    const out = {};
    Object.keys(exports||{}).forEach(k => { if (u.has(k)) out[k] = exports[k]; });
    return out;
  }
}
window.TreeShaking = TreeShaking;
