class ShippingIntegration {
    constructor() {
        this.carriers = new Map();
    }
    register(name, calcFn) {
        if (typeof calcFn !== 'function') return false;
        this.carriers.set(name, calcFn);
        return true;
    }
    rates({ carrier = 'mock', qty = 1, weight = 0 }) {
        const fn = this.carriers.get(carrier) || ((p) => [{ service: 'standard', amount: 5 + p.qty }]);
        return fn({ qty: Number(qty || 1), weight: Number(weight || 0) });
    }
}
const shippingIntegration = new ShippingIntegration();
if (typeof window !== 'undefined') {
    window.shippingIntegration = shippingIntegration;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingIntegration;
}
