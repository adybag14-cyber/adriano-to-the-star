class DataQualityMetrics {
  constructor() {}
  async init() {}
  completeness(arr) {
    const a = Array.isArray(arr) ? arr : [];
    let filled = 0;
    for (let i = 0; i < a.length; i++) if (a[i] != null && a[i] !== "") filled++;
    const rate = a.length === 0 ? 0 : filled / a.length;
    return { filled, total: a.length, rate };
  }
  uniqueness(arr) {
    const a = Array.isArray(arr) ? arr.map(v => String(v)) : [];
    const set = new Set(a);
    const rate = a.length === 0 ? 0 : set.size / a.length;
    return { unique: set.size, total: a.length, rate };
  }
  validity(arr, predicate) {
    const a = Array.isArray(arr) ? arr : [];
    let valid = 0;
    for (let i = 0; i < a.length; i++) if (predicate(a[i])) valid++;
    const rate = a.length === 0 ? 0 : valid / a.length;
    return { valid, total: a.length, rate };
  }
}
window.DataQualityMetrics = DataQualityMetrics;
