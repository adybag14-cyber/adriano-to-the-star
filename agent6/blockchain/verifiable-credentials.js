class VerifiableCredentials {
  constructor() {
    this.issued = [];
  }
  async init() {}
  async issue(issuer, subject, claims) {
    const te = new TextEncoder();
    const data = JSON.stringify({ issuer, subject, claims, iat: Date.now() });
    const d = await crypto.subtle.digest('SHA-256', te.encode(data));
    const id = Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
    const vc = { id, issuer, subject, claims, iat: Date.now() };
    this.issued.push(vc);
    return vc;
  }
  verify(vc) {
    return !!(vc && vc.id && vc.issuer && vc.subject && vc.claims);
  }
}
window.VerifiableCredentials = VerifiableCredentials;
