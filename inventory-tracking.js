class InventoryTracking {
    constructor() {
        this.stock = new Map();
        this.reserved = new Map();
    }
    setStock(sku, qty) {
        this.stock.set(sku, Math.max(0, qty || 0));
        return this.stock.get(sku);
    }
    available(sku) {
        const have = this.stock.get(sku) || 0;
        const r = this.reserved.get(sku) || 0;
        return Math.max(0, have - r);
    }
    reserve(sku, qty) {
        const a = this.available(sku);
        if (qty > a) return false;
        const r = this.reserved.get(sku) || 0;
        this.reserved.set(sku, r + qty);
        return true;
    }
    release(sku, qty) {
        const r = this.reserved.get(sku) || 0;
        this.reserved.set(sku, Math.max(0, r - qty));
        return this.reserved.get(sku);
    }
    consume(sku, qty) {
        const r = this.reserved.get(sku) || 0;
        if (qty > r) return false;
        this.reserved.set(sku, r - qty);
        const have = this.stock.get(sku) || 0;
        this.stock.set(sku, Math.max(0, have - qty));
        return true;
    }
}
const inventoryTracking = new InventoryTracking();
if (typeof window !== 'undefined') {
    window.inventoryTracking = inventoryTracking;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryTracking;
}
