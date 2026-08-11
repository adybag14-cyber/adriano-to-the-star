/**
 * Cryptocurrency Payment
 * Cryptocurrency payment processing
 */

class CryptocurrencyPayment {
    constructor() {
        this.payments = new Map();
        this.wallets = new Map();
        this.transactions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('crypto_payment_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`crypto_payment_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    createWallet(walletId, walletData) {
        const wallet = {
            id: walletId,
            ...walletData,
            name: walletData.name || walletId,
            address: walletData.address || this.generateAddress(),
            currency: walletData.currency || 'BTC',
            balance: walletData.balance || 0,
            createdAt: new Date()
        };
        
        this.wallets.set(walletId, wallet);
        console.log(`Wallet created: ${walletId}`);
        return wallet;
    }

    async processPayment(paymentId, paymentData) {
        const payment = {
            id: paymentId,
            ...paymentData,
            from: paymentData.from || null,
            to: paymentData.to || null,
            amount: paymentData.amount || 0,
            currency: paymentData.currency || 'BTC',
            status: 'pending',
            createdAt: new Date()
        };
        
        this.payments.set(paymentId, payment);
        
        if (payment.from) {
            const fromWallet = this.wallets.get(payment.from);
            if (fromWallet && fromWallet.balance >= payment.amount) {
                fromWallet.balance -= payment.amount;
                payment.status = 'processing';
            } else {
                payment.status = 'failed';
                payment.error = 'Insufficient balance';
                return payment;
            }
        }
        
        if (payment.to) {
            const toWallet = this.wallets.get(payment.to);
            if (toWallet) {
                toWallet.balance += payment.amount;
            }
        }
        
        const transaction = {
            id: `tx_${Date.now()}`,
            paymentId,
            hash: this.generateHash(),
            status: 'confirmed',
            confirmedAt: new Date(),
            createdAt: new Date()
        };
        
        this.transactions.set(transaction.id, transaction);
        
        payment.status = 'completed';
        payment.completedAt = new Date();
        payment.transactionId = transaction.id;
        
        return payment;
    }

    generateAddress() {
        return '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    generateHash() {
        return Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getPayment(paymentId) {
        return this.payments.get(paymentId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.cryptocurrencyPayment = new CryptocurrencyPayment();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CryptocurrencyPayment;
}
