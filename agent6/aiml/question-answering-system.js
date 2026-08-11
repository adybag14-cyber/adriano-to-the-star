class QuestionAnsweringSystem {
  constructor() {}
  async init() {}
  answer(question, context) {
    const q = String(question||'').toLowerCase();
    const ctx = String(context||'');
    const idx = ctx.toLowerCase().indexOf(q.split(' ')[0]);
    if (idx >= 0) return ctx.slice(idx, idx+100);
    return ctx.slice(0, Math.min(100, ctx.length));
  }
}
window.QuestionAnsweringSystem = QuestionAnsweringSystem;
