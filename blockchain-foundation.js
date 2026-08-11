/**
 * Blockchain Foundation - Web3 Integration
 * 
 * Foundation code for blockchain and NFT features.
 * Provides Web3 connection, wallet detection, and basic NFT utilities.
 * 
 * Note: This is foundation code. Full implementation requires:
 * - Smart contract deployment
 * - IPFS integration
 * - Gas fee handling
 * - User education
 * 
 * @class BlockchainFoundation
 * @example
 * const blockchain = new BlockchainFoundation();
 * await blockchain.init();
 * if (blockchain.isWalletConnected()) {
 *   // Wallet is connected
 * }
 */
class BlockchainFoundation {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.account = null;
        this.chainId = null;
        this.isInitialized = false;
        this.supportedChains = {
            // Ethereum Mainnet
            1: { name: 'Ethereum', rpc: 'https://mainnet.infura.io/v3/YOUR_KEY' },
            // Polygon
            137: { name: 'Polygon', rpc: 'https://polygon-rpc.com' },
            // Mumbai Testnet (Polygon)
            80001: { name: 'Mumbai', rpc: 'https://rpc-mumbai.maticvigil.com' }
        };
    }

    /**
     * Initialize blockchain connection
     * @returns {Promise<boolean>} True if initialized successfully
     */
    async init() {
        if (this.isInitialized) return true;

        // Check if Web3 is available
        if (typeof window.ethereum === 'undefined') {
            console.log('⚠️ Web3 wallet not detected (MetaMask, etc.)');
            return false;
        }

        try {
            this.provider = window.ethereum;
            
            // Get current account
            const accounts = await this.provider.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                this.account = accounts[0];
            }

            // Get chain ID
            this.chainId = await this.provider.request({ method: 'eth_chainId' });

            // Listen for account changes
            this.provider.on('accountsChanged', (accounts) => {
                this.account = accounts[0] || null;
                this.onAccountChange();
            });

            // Listen for chain changes
            this.provider.on('chainChanged', (chainId) => {
                this.chainId = chainId;
                window.location.reload(); // Reload on chain change
            });

            this.isInitialized = true;
            console.log('✅ Blockchain foundation initialized');
            this.trackEvent('blockchain_initialized', { chainId: this.chainId });
            return true;
        } catch (error) {
            console.error('❌ Failed to initialize blockchain:', error);
            this.trackEvent('blockchain_init_failed', { error: error.message });
            return false;
        }
    }

    /**
     * Connect wallet
     * @returns {Promise<string|null>} Connected account address or null
     */
    async connectWallet() {
        if (!this.provider) {
            await this.init();
            if (!this.provider) {
                alert('Please install MetaMask or another Web3 wallet');
                return null;
            }
        }

        try {
            const accounts = await this.provider.request({
                method: 'eth_requestAccounts'
            });

            if (accounts.length > 0) {
                this.account = accounts[0];
                this.onAccountChange();
                this.trackEvent('wallet_connected', { address: this.account });
                return this.account;
            }

            return null;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
            this.trackEvent('wallet_connection_failed', { error: error.message });
            if (error.code === 4001) {
                alert('Wallet connection rejected');
            }
            return null;
        }
    }

    /**
     * Check if wallet is connected
     * @returns {boolean} True if wallet is connected
     */
    isWalletConnected() {
        return this.account !== null;
    }

    /**
     * Get current account
     * @returns {string|null} Account address or null
     */
    getAccount() {
        return this.account;
    }

    /**
     * Switch to a supported network
     * @param {number} chainId - Chain ID to switch to
     * @returns {Promise<boolean>} True if switched successfully
     */
    async switchNetwork(chainId) {
        if (!this.provider) return false;

        const chain = this.supportedChains[chainId];
        if (!chain) {
            console.error('Unsupported chain:', chainId);
            return false;
        }

        try {
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: `0x${chainId.toString(16)}` }]
            });
            return true;
        } catch (error) {
            // Chain not added, try to add it
            if (error.code === 4902) {
                return await this.addNetwork(chainId);
            }
            console.error('Failed to switch network:', error);
            return false;
        }
    }

    /**
     * Add network to wallet
     * @param {number} chainId - Chain ID to add
     * @returns {Promise<boolean>} True if added successfully
     */
    async addNetwork(chainId) {
        const chain = this.supportedChains[chainId];
        if (!chain) return false;

        try {
            await this.provider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: `0x${chainId.toString(16)}`,
                    chainName: chain.name,
                    rpcUrls: [chain.rpc]
                }]
            });
            return true;
        } catch (error) {
            console.error('Failed to add network:', error);
            return false;
        }
    }

    /**
     * Handle account change
     */
    onAccountChange() {
        // Override in implementation
        console.log('Account changed:', this.account);
    }

    /**
     * Create wallet connection button
     * @param {HTMLElement} container - Container to add button to
     */
    createWalletButton(container) {
        const button = document.createElement('button');
        button.className = 'wallet-connect-btn';
        button.innerHTML = this.isWalletConnected() 
            ? `🔗 ${this.formatAddress(this.account)}`
            : '🔗 Connect Wallet';
        button.style.cssText = `
            padding: 0.75rem 1.5rem;
            background: rgba(186, 148, 79, 0.2);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 8px;
            color: #ba944f;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            transition: all 0.3s ease;
        `;

        button.addEventListener('click', async () => {
            if (!this.isWalletConnected()) {
                await this.connectWallet();
                button.innerHTML = this.isWalletConnected()
                    ? `🔗 ${this.formatAddress(this.account)}`
                    : '🔗 Connect Wallet';
            }
        });

        container.appendChild(button);
    }

    /**
     * Format Ethereum address for display
     * @param {string} address - Ethereum address
     * @returns {string} Formatted address (0x1234...5678)
     */
    formatAddress(address) {
        if (!address) return '';
        return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }

    /**
     * Get network name
     * @returns {string} Network name
     */
    getNetworkName() {
        const chain = this.supportedChains[parseInt(this.chainId, 16)];
        return chain ? chain.name : 'Unknown';
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`blockchain:${eventName}`, 1, {
                    source: 'blockchain-foundation',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record blockchain event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Blockchain Event', { event: eventName, ...data });
        }
    }
}

// Initialize blockchain foundation
let blockchainInstance = null;

function initBlockchain() {
    if (!blockchainInstance) {
        blockchainInstance = new BlockchainFoundation();
    }
    return blockchainInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        initBlockchain().init();
    });
} else {
    initBlockchain().init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlockchainFoundation;
}

// Make available globally
window.BlockchainFoundation = BlockchainFoundation;
window.blockchain = () => blockchainInstance;

