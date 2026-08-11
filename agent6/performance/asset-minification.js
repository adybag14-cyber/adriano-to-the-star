class AssetMinification {
  constructor() {}
  async init() {}
  minifyCss(css) {
    return String(css||'').replace(/\s+/g,' ').replace(/\s*([{}:;,])\s*/g,'$1').trim();
  }
  minifyJs(js) {
    return String(js||'').replace(/\/\/.*$/mg,'').replace(/\s+/g,' ').trim();
  }
}
window.AssetMinification = AssetMinification;
