class PaymentProcessing {
    constructor() {
        this.gateways = new Map();
        this.transactions = [];
    }
    register(name, handler) {
        if (typeof handler !== 'function') return false;
        this.gateways.set(name, handler);
        return true;
    }
    async charge({ amount, currency = 'USD', source = {}, gateway = 'mock' }) {
        const h = this.gateways.get(gateway) || (async () => ({ success: true, id: Date.now().toString(36) }));
        const result = await Promise.resolve(h({ amount, currency, source }));
        const tx = { id: Date.now().toString(36) + Math.random().toString(36).slice(2), amount, currency, gateway, success: !!result?.success, meta: result, timestamp: new Date() };
        this.transactions.push(tx);
        return tx;
    }
    recent(limit = 20) {
        return this.transactions.slice(-limit).reverse();
    }
}
const paymentProcessing = new PaymentProcessing();
if (typeof window !== 'undefined') {
    window.paymentProcessing = paymentProcessing;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PaymentProcessing;
}
