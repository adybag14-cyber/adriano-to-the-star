/**
 * Smart Contracts Integration for Planet Trading
 * Integrates with Ethereum/Polygon smart contracts for decentralized trading
 */

class SmartContractsIntegration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.contractAddress = null;
        this.abi = null;
        this.network = 'polygon'; // polygon, ethereum, etc.
        this.isConnected = false;
        this.isInitialized = false;

        // Contract ABIs (simplified - full ABI would be loaded from contract)
        this.contractABI = [
            "function listPlanet(uint256 tokenId, uint256 price) external returns (uint256)",
            "function cancelListing(uint256 listingId) external",
            "function createTradeOffer(uint256 listingId, uint256 offerPrice) external payable",
            "function acceptTradeOffer(uint256 listingId, uint256 offerId) external",
            "function buyPlanet(uint256 listingId) external payable",
            "function getUserListings(address user) external view returns (uint256[])",
            "function getTradeOffers(uint256 listingId) external view returns (tuple(uint256,address,uint256,bool,uint256)[])",
            "function listings(uint256) external view returns (uint256,address,uint256,bool,uint256)",
            "event PlanetListed(uint256 indexed listingId, uint256 indexed tokenId, address indexed seller, uint256 price)",
            "event TradeExecuted(uint256 indexed listingId, address indexed buyer, address indexed seller, uint256 price)"
        ];

        this.init();
    }

    async init() {
        // Check for Web3 provider
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            console.log('✅ Web3 provider detected');
        } else {
            console.warn('⚠️ No Web3 wallet detected. Smart contract features will be limited.');
        }

        // Load contract address from config (would be set after deployment)
        this.contractAddress = window.PLANET_TRADING_CONTRACT_ADDRESS || null;

        this.isInitialized = true;
        console.log('📜 Smart Contracts Integration initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ma_rt_co_nt_ra_ct_si_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Connect Web3 wallet
     */
    async connectWallet() {
        if (!this.provider) {
            throw new Error('Please install MetaMask or another Web3 wallet');
        }

        try {
            const accounts = await this.provider.request({ method: 'eth_requestAccounts' });

            if (accounts.length > 0) {
                // Initialize ethers.js if available, or use web3.js
                if (typeof ethers !== 'undefined') {
                    this.provider = new ethers.BrowserProvider(window.ethereum);
                    this.signer = await this.provider.getSigner();
                    this.isConnected = true;

                    if (this.contractAddress) {
                        this.contract = new ethers.Contract(
                            this.contractAddress,
                            this.contractABI,
                            this.signer
                        );
                    }
                } else {
                    // Fallback to web3.js if ethers not available
                    console.warn('ethers.js not found, using basic Web3');
                    this.isConnected = true;
                }

                console.log('✅ Wallet connected:', accounts[0]);
                return accounts[0];
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            throw error;
        }

        return null;
    }

    /**
     * Get connected address
     */
    async getConnectedAddress() {
        if (!this.isConnected || !this.provider) return null;

        try {
            if (this.signer) {
                return await this.signer.getAddress();
            } else {
                const accounts = await this.provider.request({ method: 'eth_accounts' });
                return accounts.length > 0 ? accounts[0] : null;
            }
        } catch (error) {
            console.error('Error getting address:', error);
            return null;
        }
    }

    /**
     * List a planet on the blockchain
     */
    async listPlanetOnChain(tokenId, price) {
        if (!this.isConnected) {
            await this.connectWallet();
        }

        if (!this.contract) {
            throw new Error('Contract not initialized. Please deploy contract first.');
        }

        try {
            // Convert price to wei (assuming price is in ETH/MATIC)
            const priceInWei = ethers.parseEther(price.toString());

            const tx = await this.contract.listPlanet(tokenId, priceInWei);
            console.log('📝 Transaction sent:', tx.hash);

            const receipt = await tx.wait();
            console.log('✅ Transaction confirmed:', receipt);

            // Parse events
            const listingEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'PlanetListed';
                } catch {
                    return false;
                }
            });

            if (listingEvent) {
                const parsed = this.contract.interface.parseLog(listingEvent);
                return {
                    listingId: parsed.args.listingId.toString(),
                    tokenId: parsed.args.tokenId.toString(),
                    seller: parsed.args.seller,
                    price: ethers.formatEther(parsed.args.price),
                    txHash: tx.hash
                };
            }

            return { txHash: tx.hash };
        } catch (error) {
            console.error('Error listing planet:', error);
            throw error;
        }
    }

    /**
     * Create a trade offer
     */
    async createTradeOffer(listingId, offerPrice) {
        if (!this.isConnected) {
            await this.connectWallet();
        }

        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const priceInWei = ethers.parseEther(offerPrice.toString());

            const tx = await this.contract.createTradeOffer(listingId, priceInWei, {
                value: priceInWei
            });

            console.log('📝 Trade offer transaction sent:', tx.hash);
            const receipt = await tx.wait();

            return {
                txHash: tx.hash,
                listingId: listingId,
                offerPrice: offerPrice
            };
        } catch (error) {
            console.error('Error creating trade offer:', error);
            throw error;
        }
    }

    /**
     * Buy planet directly
     */
    async buyPlanet(listingId, price) {
        if (!this.isConnected) {
            await this.connectWallet();
        }

        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const priceInWei = ethers.parseEther(price.toString());

            const tx = await this.contract.buyPlanet(listingId, {
                value: priceInWei
            });

            console.log('📝 Buy transaction sent:', tx.hash);
            const receipt = await tx.wait();

            // Parse trade executed event
            const tradeEvent = receipt.logs.find(log => {
                try {
                    const parsed = this.contract.interface.parseLog(log);
                    return parsed.name === 'TradeExecuted';
                } catch {
                    return false;
                }
            });

            if (tradeEvent) {
                const parsed = this.contract.interface.parseLog(tradeEvent);
                return {
                    listingId: parsed.args.listingId.toString(),
                    buyer: parsed.args.buyer,
                    seller: parsed.args.seller,
                    price: ethers.formatEther(parsed.args.price),
                    txHash: tx.hash
                };
            }

            return { txHash: tx.hash };
        } catch (error) {
            console.error('Error buying planet:', error);
            throw error;
        }
    }

    /**
     * Get user listings from blockchain
     */
    async getUserListings(userAddress = null) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const address = userAddress || await this.getConnectedAddress();
            if (!address) {
                throw new Error('No address provided');
            }

            const listingIds = await this.contract.getUserListings(address);

            // Fetch details for each listing
            const listings = [];
            for (const id of listingIds) {
                const listing = await this.contract.listings(id);
                listings.push({
                    listingId: id.toString(),
                    tokenId: listing[0].toString(),
                    seller: listing[1],
                    price: ethers.formatEther(listing[2]),
                    isActive: listing[3],
                    createdAt: listing[4].toString()
                });
            }

            return listings;
        } catch (error) {
            console.error('Error getting user listings:', error);
            throw error;
        }
    }

    /**
     * Get trade offers for a listing
     */
    async getTradeOffers(listingId) {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const offers = await this.contract.getTradeOffers(listingId);

            return offers.map((offer, index) => ({
                offerId: index,
                listingId: offer[0].toString(),
                buyer: offer[1],
                offerPrice: ethers.formatEther(offer[2]),
                isActive: offer[3],
                createdAt: offer[4].toString()
            }));
        } catch (error) {
            console.error('Error getting trade offers:', error);
            throw error;
        }
    }

    /**
     * Set contract address (after deployment)
     */
    setContractAddress(address) {
        this.contractAddress = address;

        if (this.signer) {
            this.contract = new ethers.Contract(
                address,
                this.contractABI,
                this.signer
            );
        }

        console.log('✅ Contract address set:', address);
    }

    /**
     * Check if contract is deployed
     */
    async checkContractDeployment() {
        if (!this.contractAddress) {
            return { deployed: false, message: 'Contract address not set' };
        }

        try {
            if (this.provider && typeof ethers !== 'undefined') {
                const code = await this.provider.getCode(this.contractAddress);
                return {
                    deployed: code !== '0x',
                    address: this.contractAddress
                };
            }
        } catch (error) {
            console.error('Error checking contract:', error);
        }

        return { deployed: false, message: 'Unable to check contract' };
    }

    /**
     * Render smart contract UI
     */
    renderContractUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="smart-contracts-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📜 Smart Contracts Integration</h3>
                
                <div id="wallet-status" class="wallet-status" style="margin-bottom: 1.5rem;">
                    ${this.renderWalletStatus()}
                </div>

                <div id="contract-status" class="contract-status" style="margin-bottom: 1.5rem;">
                    ${this.renderContractStatus()}
                </div>

                <div class="contract-actions" style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    <button id="connect-wallet-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        🔗 Connect Wallet
                    </button>
                    <button id="check-contract-btn" class="btn-secondary" style="padding: 0.75rem 1.5rem; background: rgba(74, 144, 226, 0.2); border: 2px solid rgba(74, 144, 226, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        🔍 Check Contract
                    </button>
                </div>
            </div>
        `;

        // Add event listeners
        const connectBtn = document.getElementById('connect-wallet-btn');
        if (connectBtn) {
            connectBtn.addEventListener('click', async () => {
                try {
                    await this.connectWallet();
                    this.renderContractUI(containerId);
                } catch (error) {
                    alert('Error connecting wallet: ' + error.message);
                }
            });
        }

        const checkBtn = document.getElementById('check-contract-btn');
        if (checkBtn) {
            checkBtn.addEventListener('click', async () => {
                try {
                    const status = await this.checkContractDeployment();
                    alert(`Contract Status: ${status.deployed ? 'Deployed' : 'Not Deployed'}\n${status.message || ''}`);
                } catch (error) {
                    alert('Error checking contract: ' + error.message);
                }
            });
        }
    }

    renderWalletStatus() {
        if (this.isConnected) {
            return `
                <div style="padding: 1rem; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 10px; color: #4ade80;">
                    ✅ Wallet Connected
                </div>
            `;
        } else {
            return `
                <div style="padding: 1rem; background: rgba(251, 191, 36, 0.1); border: 1px solid rgba(251, 191, 36, 0.3); border-radius: 10px; color: #fbbf24;">
                    ⚠️ Wallet Not Connected
                </div>
            `;
        }
    }

    renderContractStatus() {
        if (this.contractAddress) {
            return `
                <div style="padding: 1rem; background: rgba(74, 144, 226, 0.1); border: 1px solid rgba(74, 144, 226, 0.3); border-radius: 10px;">
                    <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-bottom: 0.5rem;">Contract Address:</div>
                    <div style="color: #4a90e2; font-family: monospace; font-size: 0.85rem; word-break: break-all;">${this.contractAddress}</div>
                </div>
            `;
        } else {
            return `
                <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; color: #ef4444;">
                    ⚠️ Contract Address Not Set
                </div>
            `;
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.SmartContractsIntegration = SmartContractsIntegration;
    window.smartContractsIntegration = new SmartContractsIntegration();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SmartContractsIntegration;
}
