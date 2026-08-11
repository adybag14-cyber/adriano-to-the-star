class AiModelVersioning {
  constructor() {
    this.versions = new Map();
  }
  async init() {}
  add(modelId, version, meta) {
    const id = String(modelId);
    const v = String(version);
    const arr = this.versions.get(id) || [];
    arr.push({ version:v, meta:meta||{}, ts:Date.now() });
    this.versions.set(id, arr);
  }
  latest(modelId) {
    const arr = this.versions.get(String(modelId)) || [];
    return arr.length ? arr[arr.length-1] : null;
  }
}
window.AiModelVersioning = AiModelVersioning;
