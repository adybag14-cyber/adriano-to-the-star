/**
 * Blockchain Verification System for Planet Claims
 * Prepares for future blockchain integration with verification infrastructure
 */

class BlockchainVerificationSystem {
    constructor() {
        this.verifications = [];
        this.currentUser = null;
        this.isInitialized = false;
        this.provider = null;
        this.signer = null;
        this.walletAddress = null;
        this.blockchainEnabled = true;

        this.init();
    }

    async init() {
        try {
            if (window.supabase && window.supabase.auth && typeof window.supabase.auth.getUser === 'function') {
                const result = await window.supabase.auth.getUser();
                const user = result && result.data ? result.data.user : null;
                if (user) {
                    this.currentUser = user;
                }
            }
        } catch (e) {
            console.warn('BlockchainVerificationSystem: Supabase auth not available, continuing without user context');
        }

        // Initialize ethers if available
        if (window.ethers) {
            console.log('✅ Ethers.js detected. Blockchain features ready.');
        } else {
            console.warn('⚠️ Ethers.js not found. Blockchain features disabled.');
            this.blockchainEnabled = false;
        }

        this.loadData();
        this.isInitialized = true;
        this.trackEvent('bc_verify_sys_initialized');
    }

    loadData() {
        try {
            const verificationsData = localStorage.getItem('blockchain-verifications');
            if (verificationsData) {
                this.verifications = JSON.parse(verificationsData);
            }
        } catch (error) {
            console.error('Error loading verification data:', error);
        }
    }

    saveData() {
        try {
            localStorage.setItem('blockchain-verifications', JSON.stringify(this.verifications));
        } catch (error) {
            console.error('Error saving verification data:', error);
        }
    }

    /**
     * Connect to Ethereum wallet (e.g. MetaMask)
     */
    async connectWallet() {
        if (!window.ethereum) {
            this.notify('Please install MetaMask to use blockchain features!', 'error');
            return false;
        }

        try {
            this.provider = new ethers.BrowserProvider(window.ethereum);
            this.signer = await this.provider.getSigner();
            this.walletAddress = await this.signer.getAddress();
            console.log('✅ Wallet connected:', this.walletAddress);
            this.notify('Wallet connected successfully!', 'success');
            return this.walletAddress;
        } catch (error) {
            console.error('User denied wallet access:', error);
            this.notify('Wallet connection failed or rejected.', 'error');
            return null;
        }
    }

    /**
     * Generate verification hash for a planet claim
     * This prepares the data structure for blockchain integration
     */
    generateVerificationHash(claimData) {
        // Create a deterministic string to hash
        const dataString = JSON.stringify({
            kepid: claimData.kepid,
            userId: claimData.userId,
            claimDate: claimData.claimDate,
            planetName: claimData.planetName
        });

        // Use standard SHA-256 via Web Crypto API if available, else simple fallback
        // For Proof of Existence, a simple hash is sufficient unique ID
        if (window.ethers) {
            return ethers.id(dataString);
        }

        // Fallback for simple unique ID
        let hash = 0;
        for (let i = 0; i < dataString.length; i++) {
            const char = dataString.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }

    /**
     * Create verification record for a planet claim
     */
    async createVerification(claimData) {
        // Just-in-time user fetch
        if (!this.currentUser && window.supabase && typeof window.supabase.auth.getUser === 'function') {
            try {
                const { data } = await window.supabase.auth.getUser();
                if (data && data.user) {
                    this.currentUser = data.user;
                }
            } catch (e) {
                console.warn('JIT user fetch failed in createVerification:', e);
            }
        }

        if (!this.currentUser) {
            this.notify('Please log in to create verifications', 'warning');
            return null;
        }

        const verificationHash = this.generateVerificationHash(claimData);
        const verificationId = `verify-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const verification = {
            id: verificationId,
            claimId: claimData.claimId || claimData.kepid,
            kepid: claimData.kepid,
            userId: this.currentUser.id,
            verificationHash: verificationHash,
            status: 'prepared', // prepared -> pending (minting) -> verified (on-chain)
            createdAt: new Date().toISOString(),
            blockchainTxHash: null,
            blockchainNetwork: null,
            metadata: {
                planetName: claimData.planetName,
                claimDate: claimData.claimDate,
                owner: this.currentUser.email || 'Unknown'
            }
        };

        this.verifications.push(verification);
        this.saveData();

        console.log('✅ Verification prepared:', verification.id);

        // Auto-prompt to mint if wallet is ready
        if (this.walletAddress) {
            if (confirm('Verification prepared. Mint to blockchain now?')) {
                this.mintVerification(verification.id);
            }
        }

        return verification;
    }

    /**
     * Mint the verification to the blockchain (Proof of Existence)
     * Sends a 0 ETH transaction to self with the hash in data field.
     */
    async mintVerification(verificationId) {
        const verification = this.verifications.find(v => v.id === verificationId);
        if (!verification) return;

        if (!this.walletAddress) {
            const connected = await this.connectWallet();
            if (!connected) return;
        }

        try {
            verification.status = 'pending';
            this.saveData();

            // Create transaction: Send 0 ETH to self, with data = verificationHash
            const tx = {
                to: this.walletAddress,
                value: 0,
                data: verification.verificationHash
            };

            const txResponse = await this.signer.sendTransaction(tx);
            console.log('Transaction sent:', txResponse.hash);

            verification.blockchainTxHash = txResponse.hash;
            // Get network name 
            try {
                const network = await this.provider.getNetwork();
                verification.blockchainNetwork = network.name;
            } catch (e) {
                console.warn('Could not fetch network name');
            }

            this.saveData();
            this.notify(`Verification transaction sent! Hash: ${txResponse.hash}`, 'info', 'Transaction Sent', 8000);

            // Wait for 1 confirmation
            await txResponse.wait(1);

            verification.status = 'verified';
            verification.verifiedAt = new Date().toISOString();
            this.saveData();

            this.notify('Blockchain Verification Confirmed!', 'success');
            return true;

        } catch (error) {
            console.error('Minting failed:', error);
            verification.status = 'failed';
            this.saveData();
            this.notify('Minting failed. See console for details.', 'error');
            return false;
        }
    }

    /**
     * Verify a claim's blockchain record by looking up the transaction
     */
    async verifyClaim(verificationId) {
        const verification = this.verifications.find(v => v.id === verificationId);
        if (!verification) {
            this.notify('Verification not found', 'error');
            return false;
        }

        if (!verification.blockchainTxHash) {
            this.notify('This claim has not been minted to the blockchain yet.', 'info');
            return false;
        }

        if (!this.provider) {
            // Try to connect read-only or prompt wallet
            if (window.ethereum) {
                this.provider = new ethers.BrowserProvider(window.ethereum);
            } else {
                this.notify('No blockchain provider found.', 'error');
                return false;
            }
        }

        try {
            const tx = await this.provider.getTransaction(verification.blockchainTxHash);

            if (tx && tx.data === verification.verificationHash) {
                console.log('✅ On-Chain Match Confirmed!');
                verification.status = 'verified'; // Re-confirm status
                this.saveData();
                this.notify(`Verified! Claim anchored on blockchain.\nTx: ${verification.blockchainTxHash.substring(0, 10)}...`, 'success', 'Verified', 6000);
                return true;
            } else {
                console.warn('❌ Hash Mismatch or Tx Not Found');
                this.notify('Verification failed: Blockchain data does not match this claim.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Verification lookup failed:', error);
            this.notify('Error looking up transaction.', 'error');
            return false;
        }
    }

    /**
     * Get verifications for a user
     */
    getMyVerifications() {
        if (!this.currentUser) return [];
        return this.verifications.filter(v => v.userId === this.currentUser.id);
    }

    /**
     * Get verification by claim ID
     */
    getVerificationByClaim(claimId) {
        return this.verifications.find(v => v.claimId === claimId);
    }

    /**
     * Get verification status
     */
    getVerificationStatus(claimId) {
        const verification = this.getVerificationByClaim(claimId);
        if (!verification) return 'not_verified';
        return verification.status;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`bc_verify_sys_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    notify(msg, type = 'info', title = null, duration = 5000) {
        if (window.notifications) {
            window.notifications.show(msg, type, title, duration);
        } else {
            console.log(`[${type.toUpperCase()}] ${msg}`);
        }
    }
}

if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.blockchainVerificationSystem) {
            // Wait a moment for ethers
            setTimeout(() => {
                window.blockchainVerificationSystem = new BlockchainVerificationSystem();
            }, 500);
        }
    });
}

