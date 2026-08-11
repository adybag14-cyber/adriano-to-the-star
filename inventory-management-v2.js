/**
 * Inventory Management v2
 * Advanced inventory management system
 */

class InventoryManagementV2 {
    constructor() {
        this.products = new Map();
        this.movements = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Inventory Management v2 initialized' };
    }

    addProduct(productId, quantity, location) {
        if (quantity < 0) {
            throw new Error('Quantity must be non-negative');
        }
        const product = {
            productId,
            quantity,
            location,
            updatedAt: new Date()
        };
        this.products.set(productId, product);
        return product;
    }

    adjustInventory(productId, change, reason) {
        const product = this.products.get(productId);
        if (!product) {
            throw new Error('Product not found');
        }
        const newQuantity = product.quantity + change;
        if (newQuantity < 0) {
            throw new Error('Insufficient inventory');
        }
        product.quantity = newQuantity;
        const movement = {
            productId,
            change,
            reason,
            newQuantity,
            movedAt: new Date()
        };
        this.movements.push(movement);
        return movement;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = InventoryManagementV2;
}

