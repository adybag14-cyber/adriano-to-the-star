class ShoppingCartSystem {
    constructor() {
        this.carts = new Map();
        this.discounts = new Map();
    }
    createCart(id) {
        if (!id) id = Date.now().toString(36) + Math.random().toString(36).slice(2);
        if (!this.carts.has(id)) this.carts.set(id, { id, items: [], discount: 0, currency: 'USD', updatedAt: new Date() });
        return this.carts.get(id);
    }
    addItem(id, itemId, price, qty = 1, meta = {}) {
        const cart = this.createCart(id);
        const existing = cart.items.find(i => i.itemId === itemId);
        if (existing) existing.qty += qty;
        else cart.items.push({ itemId, price, qty, meta });
        cart.updatedAt = new Date();
        return cart;
    }
    removeItem(id, itemId, qty = null) {
        const cart = this.createCart(id);
        const idx = cart.items.findIndex(i => i.itemId === itemId);
        if (idx >= 0) {
            if (qty && cart.items[idx].qty > qty) cart.items[idx].qty -= qty;
            else cart.items.splice(idx, 1);
        }
        cart.updatedAt = new Date();
        return cart;
    }
    clear(id) {
        const cart = this.createCart(id);
        cart.items = [];
        cart.updatedAt = new Date();
        return cart;
    }
    applyDiscount(id, code) {
        const cart = this.createCart(id);
        const d = this.discounts.get(code) || 0;
        cart.discount = Math.max(0, Math.min(100, d));
        cart.updatedAt = new Date();
        return cart;
    }
    setDiscount(code, percent) {
        this.discounts.set(code, percent);
        return percent;
    }
    total(id) {
        const cart = this.createCart(id);
        const subtotal = cart.items.reduce((sum, i) => sum + i.price * i.qty, 0);
        const discountValue = subtotal * (cart.discount / 100);
        const total = Math.max(0, subtotal - discountValue);
        return { subtotal, discountPercent: cart.discount, discountValue, total, currency: cart.currency };
    }
    snapshot(id) {
        const cart = this.createCart(id);
        return { id: cart.id, items: [...cart.items], discount: cart.discount, currency: cart.currency, updatedAt: cart.updatedAt };
    }
}
const shoppingCartSystem = new ShoppingCartSystem();
if (typeof window !== 'undefined') {
    window.shoppingCartSystem = shoppingCartSystem;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShoppingCartSystem;
}
