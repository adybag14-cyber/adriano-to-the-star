class DataTransformationTools {
  constructor() {}
  async init() {}
  apply(data, steps) {
    let out = Array.isArray(data) ? data.slice() : [];
    for (const s of (steps||[])) {
      if (s.type === 'filter' && typeof s.fn === 'function') out = out.filter(s.fn);
      else if (s.type === 'map' && typeof s.fn === 'function') out = out.map(s.fn);
      else if (s.type === 'select') {
        const keys = Array.isArray(s.keys) ? s.keys : [];
        out = out.map(row => {
          const o = {}; keys.forEach(k => o[k] = row[k]); return o;
        });
      }
    }
    return out;
  }
}
window.DataTransformationTools = DataTransformationTools;
