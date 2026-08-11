/**
 * ERC-20 Token
 * ERC-20 token standard implementation
 */

class ERC20Token {
    constructor() {
        this.tokens = new Map();
        this.balances = new Map();
        this.transfers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('e_rc20t_ok_en_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("e_rc20t_ok_en_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    deployToken(tokenId, tokenData) {
        const token = {
            id: tokenId,
            ...tokenData,
            name: tokenData.name || tokenId,
            symbol: tokenData.symbol || 'TKN',
            decimals: tokenData.decimals || 18,
            totalSupply: tokenData.totalSupply || 0,
            address: tokenData.address || this.generateAddress(),
            createdAt: new Date()
        };
        
        this.tokens.set(tokenId, token);
        
        if (tokenData.initialHolder) {
            this.balances.set(`${tokenId}_${tokenData.initialHolder}`, token.totalSupply);
        }
        
        console.log(`ERC-20 token deployed: ${tokenId}`);
        return token;
    }

    async transfer(tokenId, from, to, amount) {
        const token = this.tokens.get(tokenId);
        if (!token) {
            throw new Error('Token not found');
        }
        
        const fromBalance = this.balanceOf(tokenId, from);
        if (fromBalance < amount) {
            throw new Error('Insufficient balance');
        }
        
        const fromKey = `${tokenId}_${from}`;
        const toKey = `${tokenId}_${to}`;
        
        this.balances.set(fromKey, fromBalance - amount);
        this.balances.set(toKey, (this.balances.get(toKey) || 0) + amount);
        
        const transfer = {
            id: `transfer_${Date.now()}`,
            tokenId,
            from,
            to,
            amount,
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.transfers.set(transfer.id, transfer);
        
        return transfer;
    }

    balanceOf(tokenId, address) {
        const key = `${tokenId}_${address}`;
        return this.balances.get(key) || 0;
    }

    totalSupply(tokenId) {
        const token = this.tokens.get(tokenId);
        return token ? token.totalSupply : 0;
    }

    generateAddress() {
        return '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }

    getToken(tokenId) {
        return this.tokens.get(tokenId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.erc20Token = new ERC20Token();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ERC20Token;
}


