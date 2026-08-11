/**
 * Multiple Payment Methods
 * Support for multiple payment methods
 */

class MultiplePaymentMethods {
    constructor() {
        this.methods = ['credit_card', 'paypal', 'bank_transfer', 'crypto'];
        this.init();
    }
    
    init() {
        this.setupPaymentMethods();
    }
    
    setupPaymentMethods() {
        // Setup payment methods
    }
    
    async processPayment(method, amount, details) {
        if (window.paymentGatewayIntegrations) {
            return await window.paymentGatewayIntegrations.processPayment(
                method === 'paypal' ? 'paypal' : 'stripe',
                amount,
                'USD',
                details
            );
        }
        return { success: false };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.multiplePaymentMethods = new MultiplePaymentMethods(); });
} else {
    window.multiplePaymentMethods = new MultiplePaymentMethods();
}
