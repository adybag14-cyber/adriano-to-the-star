class TransactionValidation {
  constructor() {}
  async init() {}
  async hash(tx) {
    const te = new TextEncoder();
    const d = await crypto.subtle.digest('SHA-256', te.encode(JSON.stringify(tx)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  isValid(tx) {
    if (!tx) return false;
    if (!tx.from || !tx.to) return false;
    if (Number(tx.value) <= 0) return false;
    return true;
  }
}
window.TransactionValidation = TransactionValidation;
