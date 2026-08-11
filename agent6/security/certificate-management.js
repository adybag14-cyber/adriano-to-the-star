class CertificateManagement {
  constructor() {}
  async init() {}
  expiresSoon(expiryTs, days) {
    const now = Date.now();
    const diffDays = (Number(expiryTs||0) - now) / (1000*60*60*24);
    return diffDays <= Number(days||30);
  }
}
window.CertificateManagement = CertificateManagement;
