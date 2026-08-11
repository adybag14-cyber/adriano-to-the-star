class RtlSupport {
  constructor() {}
  async init() {}
  set(enabled) {
    document.documentElement.dir = enabled ? 'rtl' : 'ltr';
  }
}
window.RtlSupport = RtlSupport;
