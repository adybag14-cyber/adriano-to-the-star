/**
 * Transaction History
 * Transaction history tracking and querying
 */

class TransactionHistory {
    constructor() {
        this.histories = new Map();
        this.transactions = new Map();
        this.init();
    }

    init() {
        this.trackEvent('t_ra_ns_ac_ti_on_hi_st_or_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_ra_ns_ac_ti_on_hi_st_or_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createHistory(address, networkId) {
        const history = {
            id: `history_${Date.now()}`,
            address,
            networkId,
            transactions: [],
            balance: 0,
            createdAt: new Date()
        };
        
        this.histories.set(history.id, history);
        console.log(`Transaction history created for: ${address}`);
        return history;
    }

    addTransaction(historyId, transactionData) {
        const history = this.histories.get(historyId);
        if (!history) {
            throw new Error('History not found');
        }
        
        const transaction = {
            id: `tx_${Date.now()}`,
            historyId,
            ...transactionData,
            hash: transactionData.hash || this.generateHash(),
            from: transactionData.from,
            to: transactionData.to,
            value: transactionData.value || 0,
            timestamp: transactionData.timestamp || new Date(),
            status: transactionData.status || 'pending',
            createdAt: new Date()
        };
        
        this.transactions.set(transaction.id, transaction);
        history.transactions.push(transaction.id);
        
        if (transaction.from === history.address) {
            history.balance -= transaction.value;
        } else if (transaction.to === history.address) {
            history.balance += transaction.value;
        }
        
        return transaction;
    }

    getHistory(address, networkId) {
        return Array.from(this.histories.values())
            .find(h => h.address === address && h.networkId === networkId);
    }

    getTransactions(historyId, startDate = null, endDate = null) {
        const history = this.histories.get(historyId);
        if (!history) {
            throw new Error('History not found');
        }
        
        let transactions = history.transactions.map(txId => this.transactions.get(txId))
            .filter(tx => tx !== undefined);
        
        if (startDate) {
            transactions = transactions.filter(tx => tx.timestamp >= startDate);
        }
        
        if (endDate) {
            transactions = transactions.filter(tx => tx.timestamp <= endDate);
        }
        
        return transactions.sort((a, b) => b.timestamp - a.timestamp);
    }

    generateHash() {
        return '0x' + Array.from({ length: 64 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getHistoryById(historyId) {
        return this.histories.get(historyId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.transactionHistory = new TransactionHistory();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TransactionHistory;
}


