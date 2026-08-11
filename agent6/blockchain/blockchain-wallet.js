class BlockchainWallet {
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
  async exportPublicKeyRaw() {
    if (!this.publicKey) return null;
    const spki = await crypto.subtle.exportKey("raw", this.publicKey);
    return new Uint8Array(spki);
  }
  async sign(data) {
    if (!this.privateKey) return null;
    const te = new TextEncoder();
    const sig = await crypto.subtle.sign({ name: "ECDSA", hash: { name: "SHA-256" } }, this.privateKey, te.encode(String(data)));
    return new Uint8Array(sig);
  }
  async verify(data, signature) {
    if (!this.publicKey) return false;
    const te = new TextEncoder();
    return await crypto.subtle.verify({ name: "ECDSA", hash: { name: "SHA-256" } }, this.publicKey, signature, te.encode(String(data)));
  }
}
window.BlockchainWallet = BlockchainWallet;
