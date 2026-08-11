class DeadCodeElimination {
  constructor() {}
  async init() {}
  eliminate(code) {
    const lines = String(code||'').split('\n');
    return lines.filter(l => !/\/\/\s*dead-code/.test(l)).join('\n');
  }
}
window.DeadCodeElimination = DeadCodeElimination;
