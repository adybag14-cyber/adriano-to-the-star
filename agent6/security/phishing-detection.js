class PhishingDetection {
  constructor() { }
  async init() { }
  check(url) {
    const u = String(url || '').toLowerCase();
    // eslint-disable-next-line security/detect-unsafe-regex
    const suspicious = /login|verify|account|secure/.test(u) && /\d{1,3}(\.\d{1,3}){3}/.test(u);
    return { suspicious };
  }
}
window.PhishingDetection = PhishingDetection;
