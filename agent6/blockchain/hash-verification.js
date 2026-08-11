class HashVerification {
  constructor() {}
  async init() {}
  async sha256(data) {
    const enc = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", enc.encode(String(data)));
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2, "0")).join("");
  }
}
window.HashVerification = HashVerification;
