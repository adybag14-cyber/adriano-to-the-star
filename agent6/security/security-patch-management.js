class SecurityPatchManagement {
  constructor() {
    this.patches = [];
  }
  async init() {}
  add({ id, component, version }) {
    this.patches.push({ id:String(id), component:String(component||''), version:String(version||''), applied:false, ts:Date.now() });
  }
  apply(id) { const p=this.patches.find(x=>x.id===String(id)); if (p) p.applied=true; }
  list(applied) { if (applied==null) return this.patches.slice(); return this.patches.filter(x=>!!applied===x.applied); }
}
window.SecurityPatchManagement = SecurityPatchManagement;
