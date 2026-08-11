class ZeroKnowledgeProofs {
  constructor() {}
  async init() {}
  params() {
    return { p: 23n, q: 11n, g: 2n };
  }
  mod(a, n) {
    a = a % n;
    return a < 0n ? a + n : a;
  }
  modPow(b, e, m) {
    let r = 1n;
    b = this.mod(b, m);
    while (e > 0n) {
      if (e & 1n) r = this.mod(r * b, m);
      e >>= 1n;
      b = this.mod(b * b, m);
    }
    return r;
  }
  randomBelow(n) {
    const bytes = new Uint8Array(32);
    crypto.getRandomValues(bytes);
    let bi = 0n;
    for (let i = 0; i < bytes.length; i++) bi = (bi << 8n) | BigInt(bytes[i]);
    return this.mod(bi, n - 1n) + 1n;
  }
  keyGen(params) {
    const x = this.randomBelow(params.q);
    const y = this.modPow(params.g, x, params.p);
    return { x, y };
  }
  async hashToC(t, y, q) {
    const te = new TextEncoder();
    const buf = await crypto.subtle.digest("SHA-256", te.encode(t.toString() + "|" + y.toString()));
    const arr = new Uint8Array(buf);
    let bi = 0n;
    for (let i = 0; i < arr.length; i++) bi = (bi << 8n) | BigInt(arr[i]);
    return this.mod(bi, q);
  }
  async prove(params, y, x) {
    const k = this.randomBelow(params.q);
    const t = this.modPow(params.g, k, params.p);
    const c = await this.hashToC(t, y, params.q);
    const r = this.mod(k + c * x, params.q);
    return { t, c, r };
  }
  verify(params, y, proof) {
    const left = this.modPow(params.g, proof.r, params.p);
    const right = this.mod(proof.t * this.modPow(y, proof.c, params.p), params.p);
    return left === right;
  }
}
window.ZeroKnowledgeProofs = ZeroKnowledgeProofs;
