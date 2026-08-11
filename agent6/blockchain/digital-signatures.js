class DigitalSignatures {
  constructor() {
    this.privateKey = null;
    this.publicKey = null;
  }
  async init() {}
  async generate() {
    const kp = await crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]);
    this.privateKey = kp.privateKey;
    this.publicKey = kp.publicKey;
    return true;
  }
  async sign(message) {
    const te = new TextEncoder();
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, this.privateKey, te.encode(String(message)));
    return new Uint8Array(sig);
  }
  async verify(message, signature) {
    const te = new TextEncoder();
    return await crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, this.publicKey, signature, te.encode(String(message)));
  }
}
window.DigitalSignatures = DigitalSignatures;
