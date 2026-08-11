class OrderManagementSystem {
    constructor() {
        this.orders = new Map();
    }
    create(order) {
        const id = order?.id || ('ord_' + Date.now().toString(36) + Math.random().toString(36).slice(2));
        const o = { id, status: 'created', createdAt: new Date(), ...order };
        this.orders.set(id, o);
        return o;
    }
    updateStatus(id, status) {
        const o = this.orders.get(id);
        if (!o) return null;
        o.status = status;
        o.updatedAt = new Date();
        return o;
    }
    get(id) {
        return this.orders.get(id) || null;
    }
    list(limit = 50) {
        return Array.from(this.orders.values()).slice(-limit).reverse();
    }
}
const orderManagementSystem = new OrderManagementSystem();
if (typeof window !== 'undefined') {
    window.orderManagementSystem = orderManagementSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = OrderManagementSystem;
}
