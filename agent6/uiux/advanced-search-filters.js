class AdvancedSearchFilters {
  constructor() {
    this.filters = [];
  }
  async init() {}
  add(fn) {
    if (typeof fn === 'function') this.filters.push(fn);
  }
  apply(items) {
    let out = Array.isArray(items) ? items.slice() : [];
    for (const f of this.filters) out = out.filter(f);
    return out;
  }
}
window.AdvancedSearchFilters = AdvancedSearchFilters;
