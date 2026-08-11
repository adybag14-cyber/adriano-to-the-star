/**
 * Shopping Cart
 * Shopping cart functionality
 */

class ShoppingCart {
    constructor() {
        this.items = [];
        this.init();
    }
    
    init() {
        this.loadCart();
    }
    
    loadCart() {
        // Load cart from storage
        try {
            const saved = localStorage.getItem('cart');
            if (saved) {
                this.items = JSON.parse(saved);
            }
        } catch (e) {
            this.items = [];
        }
    }
    
    saveCart() {
        // Save cart to storage
        try {
            localStorage.setItem('cart', JSON.stringify(this.items));
        } catch (e) {
            console.warn('Could not save cart:', e);
        }
    }
    
    addItem(productId, quantity = 1) {
        // Add item to cart
        const existing = this.items.find(item => item.productId === productId);
        if (existing) {
            existing.quantity += quantity;
        } else {
            this.items.push({ productId, quantity });
        }
        this.saveCart();
    }
    
    removeItem(productId) {
        // Remove item from cart
        this.items = this.items.filter(item => item.productId !== productId);
        this.saveCart();
    }
    
    getTotal() {
        // Calculate total
        return this.items.reduce((total, item) => {
            // Would fetch product price
            return total + (item.quantity * 0); // Placeholder
        }, 0);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.shoppingCart = new ShoppingCart(); });
} else {
    window.shoppingCart = new ShoppingCart();
}

