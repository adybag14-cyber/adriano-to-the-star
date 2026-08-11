class AssetBundling {
  constructor() {}
  async init() {}
  bundle(contents) {
    const arr = Array.isArray(contents) ? contents : [];
    return arr.join('\n');
  }
}
window.AssetBundling = AssetBundling;
