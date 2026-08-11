/**
 * Blockchain & NFT Integration
 * NFT certificates for planet claims, blockchain verification, marketplace integration
 */

class BlockchainNFTIntegration {
    constructor() {
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.isConnected = false;
        this.network = 'polygon'; // polygon, ethereum, etc.
        this.isInitialized = false;

        this.init();
    }

    /**
     * Initialize blockchain integration
     */
    async init() {
        // Check for Web3 wallet (MetaMask, WalletConnect, etc.)
        if (typeof window.ethereum !== 'undefined') {
            this.provider = window.ethereum;
            console.log('✅ Web3 provider detected');
        } else {
            console.warn('⚠️ No Web3 wallet detected. NFT features will be limited.');
        }

        this.isInitialized = true;
        console.log('🔗 Blockchain & NFT Integration initialized');
    }

    /**
     * Connect wallet
     */
    async connectWallet() {
        if (!this.provider) {
            alert('Please install MetaMask or another Web3 wallet to use NFT features.');
            return false;
        }

        try {
            // Request account access
            const accounts = await this.provider.request({ method: 'eth_requestAccounts' });

            if (accounts.length > 0) {
                this.isConnected = true;
                console.log('✅ Wallet connected:', accounts[0]);
                return true;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            alert('Failed to connect wallet: ' + error.message);
            return false;
        }

        return false;
    }

    /**
     * Get connected address
     */
    async getConnectedAddress() {
        if (!this.isConnected || !this.provider) return null;

        try {
            const accounts = await this.provider.request({ method: 'eth_accounts' });
            return accounts.length > 0 ? accounts[0] : null;
        } catch (error) {
            console.error('Error getting address:', error);
            return null;
        }
    }

    /**
     * Create NFT certificate for planet claim
     */
    async createPlanetNFT(planetData, claimData) {
        if (!this.isConnected) {
            const connected = await this.connectWallet();
            if (!connected) {
                return null;
            }
        }

        try {
            // Generate NFT metadata
            const metadata = this.generateNFTMetadata(planetData, claimData);

            // Step 1: Upload metadata to IPFS
            const ipfsHash = await this.uploadToIPFS(metadata);
            if (!ipfsHash) {
                throw new Error('Failed to upload metadata to IPFS');
            }

            // Step 2: Mint NFT using smart contract
            const mintResult = await this.mintNFT(ipfsHash, planetData, claimData);

            if (!mintResult) {
                // Fallback: create local NFT if minting fails
                console.warn('Minting failed, creating local NFT');
                return await this.createLocalNFT(planetData, claimData, metadata, ipfsHash);
            }

            // Step 3: Create NFT object with blockchain data
            const nft = {
                tokenId: mintResult.tokenId,
                contractAddress: mintResult.contractAddress,
                metadata: metadata,
                ipfsHash: ipfsHash,
                ipfsUrl: `https://ipfs.io/ipfs/${ipfsHash}`,
                owner: await this.getConnectedAddress(),
                createdAt: new Date().toISOString(),
                transactionHash: mintResult.transactionHash,
                blockNumber: mintResult.blockNumber,
                network: this.network
            };

            // Step 4: Store in database
            await this.saveNFTToDatabase(nft);
            this.saveNFTLocally(nft);

            console.log('✅ NFT certificate created and minted:', nft.tokenId);
            this.trackEvent('nft_minted', { tokenId: nft.tokenId, network: this.network });
            return nft;
        } catch (error) {
            console.error('Error creating NFT:', error);
            this.trackEvent('nft_mint_failed', { error: error.message });
            // Fallback to local NFT
            return await this.createLocalNFT(planetData, claimData, this.generateNFTMetadata(planetData, claimData));
        }
    }

    /**
     * Upload metadata to IPFS
     */
    /**
     * Upload metadata to IPFS via Backend Proxy
     */
    async uploadToIPFS(metadata) {
        try {
            // Use backend secure proxy
            const response = await fetch('/api/ipfs/pinata/pinJSON', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(metadata)
            });

            if (!response.ok) throw new Error('Backend IPFS upload failed');

            const data = await response.json();
            return data.IpfsHash;
        } catch (error) {
            console.error('IPFS upload error:', error);
            // Fallback for development if backend fails
            console.warn('Backend upload failed, using mock hash');
            return `mock-ipfs-hash-${Date.now()}`;
        }
    }

    /**
     * Deprecated: Direct Pinata Upload (Removed for Security)
     */
    async uploadToPinata(metadata) {
        console.warn('Direct Pinata upload is deprecated. Use backend proxy.');
        return this.uploadToIPFS(metadata);
    }

    /**
     * Upload to Web3.Storage
     */
    async uploadToWeb3Storage(metadata) {
        const { Web3Storage } = await import('web3.storage');
        const client = new Web3Storage({ token: window.WEB3_STORAGE_API_KEY });

        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const file = new File([blob], 'metadata.json');

        const cid = await client.put([file]);
        return cid.toString();
    }

    /**
     * Upload to local IPFS node
     */
    async uploadToLocalIPFS(metadata) {
        const blob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
        const result = await window.ipfs.add(blob);
        return result.cid.toString();
    }

    /**
     * Mint NFT using smart contract
     */
    async mintNFT(ipfsHash, planetData, claimData) {
        if (!this.isConnected || !this.provider) {
            return null;
        }

        try {
            // Load smart contract ABI (ERC-721 standard)
            const contractABI = this.getNFTContractABI();
            const contractAddress = this.getContractAddress(); // Would be deployed contract address

            if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                console.warn('No contract address configured, skipping minting');
                return null;
            }

            // Get signer
            const ethers = await import('ethers');
            const provider = new ethers.BrowserProvider(this.provider);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(contractAddress, contractABI, signer);

            // Mint NFT
            const recipient = await signer.getAddress();
            const tx = await contract.mint(recipient, ipfsHash);

            // Wait for transaction
            const receipt = await tx.wait();

            // Get token ID from event
            const mintEvent = receipt.logs.find(log => {
                try {
                    const parsed = contract.interface.parseLog(log);
                    return parsed.name === 'Transfer' && parsed.args.from === '0x0000000000000000000000000000000000000000';
                } catch {
                    return false;
                }
            });

            const tokenId = mintEvent ? contract.interface.parseLog(mintEvent).args.tokenId.toString() : null;

            return {
                tokenId: tokenId || `planet-${planetData.kepid}-${Date.now()}`,
                contractAddress: contractAddress,
                transactionHash: receipt.hash,
                blockNumber: receipt.blockNumber
            };
        } catch (error) {
            console.error('Minting error:', error);
            return null;
        }
    }

    /**
     * Get NFT contract ABI (ERC-721)
     */
    getNFTContractABI() {
        return [
            "function mint(address to, string memory tokenURI) public returns (uint256)",
            "function ownerOf(uint256 tokenId) public view returns (address)",
            "function tokenURI(uint256 tokenId) public view returns (string memory)",
            "function transferFrom(address from, address to, uint256 tokenId) public",
            "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"
        ];
    }

    /**
     * Get contract address (would be from config or deployment)
     */
    getContractAddress() {
        // In production, this would be from config or environment variable
        return window.NFT_CONTRACT_ADDRESS || '0x0000000000000000000000000000000000000000';
    }

    /**
     * Create local NFT (fallback)
     */
    async createLocalNFT(planetData, claimData, metadata, ipfsHash = null) {
        const nft = {
            tokenId: `planet-${planetData.kepid}-${Date.now()}`,
            contractAddress: '0x0000000000000000000000000000000000000000',
            metadata: metadata,
            ipfsHash: ipfsHash,
            ipfsUrl: ipfsHash ? `https://ipfs.io/ipfs/${ipfsHash}` : null,
            owner: await this.getConnectedAddress(),
            createdAt: new Date().toISOString(),
            transactionHash: null,
            network: 'local'
        };

        this.saveNFTLocally(nft);
        return nft;
    }

    /**
     * Save NFT to database (Supabase)
     */
    async saveNFTToDatabase(nft) {
        if (!window.supabase) {
            console.warn('Supabase not available, skipping database save');
            return;
        }

        try {
            const { data, error } = await window.supabase
                .from('planet_nfts')
                .insert({
                    token_id: nft.tokenId,
                    contract_address: nft.contractAddress,
                    ipfs_hash: nft.ipfsHash,
                    ipfs_url: nft.ipfsUrl,
                    metadata: nft.metadata,
                    owner_address: nft.owner,
                    transaction_hash: nft.transactionHash,
                    network: nft.network,
                    created_at: nft.createdAt
                });

            if (error) throw error;
            console.log('✅ NFT saved to database');
        } catch (error) {
            console.error('Error saving NFT to database:', error);
        }
    }

    /**
     * Generate NFT metadata
     */
    generateNFTMetadata(planetData, claimData) {
        const name = planetData.kepler_name || planetData.kepoi_name || `KOI-${planetData.kepid}`;

        return {
            name: `Planet Certificate: ${name}`,
            description: `Official certificate of ownership for ${name}, a ${planetData.type || 'exoplanet'} discovered by the Kepler mission.`,
            image: this.generatePlanetImage(planetData),
            external_url: window.location.origin + `/database.html?planet=${planetData.kepid}`,
            attributes: [
                {
                    trait_type: 'Planet Name',
                    value: name
                },
                {
                    trait_type: 'KOI ID',
                    value: planetData.kepid.toString()
                },
                {
                    trait_type: 'Planet Type',
                    value: planetData.type || 'Unknown'
                },
                {
                    trait_type: 'Radius (Earth)',
                    value: (planetData.radius || 1).toFixed(2)
                },
                {
                    trait_type: 'Mass (Earth)',
                    value: (planetData.mass || 1).toFixed(2)
                },
                {
                    trait_type: 'Discovery Method',
                    value: planetData.discovery_method || 'Unknown'
                },
                {
                    trait_type: 'Claimed Date',
                    value: claimData.claimedAt || new Date().toISOString()
                },
                {
                    trait_type: 'Claimer',
                    value: claimData.claimerName || 'Unknown'
                }
            ]
        };
    }

    /**
     * Generate planet image for NFT
     */
    generatePlanetImage(planetData) {
        // In production, this would generate or fetch a planet image
        // For now, return a data URI or placeholder
        return `data:image/svg+xml;base64,${btoa(`
            <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <radialGradient id="planetGrad">
                        <stop offset="0%" stop-color="#${this.getPlanetColor(planetData)}"/>
                        <stop offset="100%" stop-color="#000"/>
                    </radialGradient>
                </defs>
                <circle cx="256" cy="256" r="200" fill="url(#planetGrad)"/>
                <text x="256" y="400" font-family="Arial" font-size="24" fill="#fff" text-anchor="middle">
                    ${planetData.kepler_name || `KOI-${planetData.kepid}`}
                </text>
            </svg>
        `)}`;
    }

    /**
     * Get planet color for NFT
     */
    getPlanetColor(planetData) {
        const type = (planetData.type || '').toLowerCase();
        if (type.includes('gas') || type.includes('giant')) return 'd4af37';
        if (type.includes('ice')) return '88aaff';
        if (type.includes('super') || type.includes('earth')) return '4a90e2';
        return '2288cc'; // Terrestrial
    }

    /**
     * Save NFT locally
     */
    saveNFTLocally(nft) {
        try {
            const nfts = JSON.parse(localStorage.getItem('user-nfts') || '[]');
            nfts.push(nft);
            localStorage.setItem('user-nfts', JSON.stringify(nfts));
        } catch (error) {
            console.error('Error saving NFT locally:', error);
        }
    }

    /**
     * Get user's NFTs
     */
    getUserNFTs() {
        try {
            return JSON.parse(localStorage.getItem('user-nfts') || '[]');
        } catch (error) {
            console.error('Error loading NFTs:', error);
            return [];
        }
    }

    /**
     * Verify NFT ownership
     */
    async verifyNFTOwnership(tokenId, address) {
        if (!this.isConnected || !this.provider) {
            // Fallback to local check
            const nfts = this.getUserNFTs();
            const nft = nfts.find(n => n.tokenId === tokenId);
            return nft?.owner?.toLowerCase() === address?.toLowerCase();
        }

        try {
            // Verify on-chain
            const contractAddress = this.getContractAddress();
            if (!contractAddress || contractAddress === '0x0000000000000000000000000000000000000000') {
                return this.verifyNFTOwnershipLocal(tokenId, address);
            }

            const ethers = await import('ethers');
            const provider = new ethers.BrowserProvider(this.provider);
            const contractABI = this.getNFTContractABI();
            const contract = new ethers.Contract(contractAddress, contractABI, provider);

            const owner = await contract.ownerOf(tokenId);
            return owner?.toLowerCase() === address?.toLowerCase();
        } catch (error) {
            console.error('On-chain verification failed, using local:', error);
            return this.verifyNFTOwnershipLocal(tokenId, address);
        }
    }

    /**
     * Verify NFT ownership locally
     */
    verifyNFTOwnershipLocal(tokenId, address) {
        const nfts = this.getUserNFTs();
        const nft = nfts.find(n => n.tokenId === tokenId);
        return nft?.owner?.toLowerCase() === address?.toLowerCase();
    }

    /**
     * Transfer NFT
     */
    async transferNFT(tokenId, toAddress) {
        if (!this.isConnected) {
            alert('Please connect your wallet first');
            return false;
        }

        try {
            // Verify ownership first
            const currentAddress = await this.getConnectedAddress();
            const isOwner = await this.verifyNFTOwnership(tokenId, currentAddress);

            if (!isOwner) {
                alert('You do not own this NFT');
                return false;
            }

            // Transfer on-chain if contract exists
            const contractAddress = this.getContractAddress();
            if (contractAddress && contractAddress !== '0x0000000000000000000000000000000000000000') {
                const ethers = await import('ethers');
                const provider = new ethers.BrowserProvider(this.provider);
                const signer = await provider.getSigner();
                const contractABI = this.getNFTContractABI();
                const contract = new ethers.Contract(contractAddress, contractABI, signer);

                // Transfer NFT
                const tx = await contract.transferFrom(currentAddress, toAddress, tokenId);
                const receipt = await tx.wait();

                // Update local storage
                const nfts = this.getUserNFTs();
                const nft = nfts.find(n => n.tokenId === tokenId);
                if (nft) {
                    nft.owner = toAddress;
                    nft.transferredAt = new Date().toISOString();
                    nft.transferTransactionHash = receipt.hash;
                    localStorage.setItem('user-nfts', JSON.stringify(nfts));
                }

                // Update database
                if (window.supabase) {
                    await window.supabase
                        .from('planet_nfts')
                        .update({
                            owner_address: toAddress,
                            transferred_at: new Date().toISOString(),
                            transfer_transaction_hash: receipt.hash
                        })
                        .eq('token_id', tokenId);
                }

                console.log('✅ NFT transferred on-chain:', tokenId);
                this.trackEvent('nft_transferred', { tokenId, toAddress, type: 'on-chain' });
                return true;
            } else {
                // Fallback: local transfer
                const nfts = this.getUserNFTs();
                const nft = nfts.find(n => n.tokenId === tokenId);

                if (!nft) {
                    alert('NFT not found');
                    return false;
                }

                nft.owner = toAddress;
                nft.transferredAt = new Date().toISOString();
                localStorage.setItem('user-nfts', JSON.stringify(nfts));

                console.log('✅ NFT transferred locally:', tokenId);
                this.trackEvent('nft_transferred', { tokenId, toAddress, type: 'local' });
                return true;
            }
        } catch (error) {
            console.error('Error transferring NFT:', error);
            alert('Failed to transfer NFT: ' + error.message);
            this.trackEvent('nft_transfer_failed', { tokenId, toAddress, error: error.message });
            return false;
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`nft:${eventName}`, 1, {
                    source: 'blockchain-nft-integration',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record NFT event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('NFT Event', { event: eventName, ...data });
        }
    }

    /**
     * Display NFT certificate
     */
    displayNFTCertificate(nft) {
        const modal = document.createElement('div');
        modal.className = 'nft-certificate-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Raleway', sans-serif;
        `;

        modal.innerHTML = `
            <div class="nft-certificate" style="background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(20,20,30,0.95)); border: 3px solid #ba944f; border-radius: 16px; padding: 2rem; max-width: 600px; width: 90%; color: #fff; text-align: center;">
                <h2 style="color: #ba944f; font-family: 'Cormorant Garamond', serif; font-size: 2rem; margin-bottom: 1rem;">
                    🏆 Planet Ownership Certificate
                </h2>
                <div style="margin: 2rem 0;">
                    <img src="${nft.metadata.image}" alt="${nft.metadata.name}" style="max-width: 300px; border-radius: 12px; border: 2px solid #ba944f;">
                </div>
                <h3 style="color: #ba944f; margin: 1.5rem 0 1rem 0;">${nft.metadata.name}</h3>
                <p style="color: rgba(255,255,255,0.8); margin-bottom: 1.5rem;">${nft.metadata.description}</p>
                <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin: 1.5rem 0;">
                    ${nft.metadata.attributes.map(attr => `
                        <div style="background: rgba(186, 148, 79, 0.1); padding: 0.75rem; border-radius: 8px; border: 1px solid rgba(186, 148, 79, 0.3);">
                            <div style="color: rgba(255,255,255,0.7); font-size: 0.85rem; margin-bottom: 0.25rem;">${attr.trait_type}</div>
                            <div style="color: #ba944f; font-weight: 600;">${attr.value}</div>
                        </div>
                    `).join('')}
                </div>
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(186, 148, 79, 0.3);">
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem;">Token ID: ${nft.tokenId}</div>
                    <div style="color: rgba(255,255,255,0.7); font-size: 0.9rem; margin-top: 0.5rem;">Owner: ${nft.owner ? nft.owner.substring(0, 6) + '...' + nft.owner.substring(38) : 'Unknown'}</div>
                </div>
                <button id="close-nft-modal" style="margin-top: 2rem; background: #ba944f; color: #000; border: none; padding: 0.75rem 2rem; border-radius: 8px; cursor: pointer; font-weight: 600;">
                    Close
                </button>
            </div>
        `;

        document.body.appendChild(modal);

        document.getElementById('close-nft-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Show wallet connection UI
     */
    showWalletConnectionUI(container) {
        if (!container) return;

        const button = document.createElement('button');
        button.id = 'connect-wallet-btn';
        button.className = 'connect-wallet-btn';
        button.innerHTML = this.isConnected ? '🔗 Wallet Connected' : '🔌 Connect Wallet';
        button.style.cssText = `
            padding: 0.75rem 1.5rem;
            background: ${this.isConnected ? 'rgba(74, 144, 226, 0.2)' : 'rgba(186, 148, 79, 0.2)'};
            border: 2px solid ${this.isConnected ? 'rgba(74, 144, 226, 0.5)' : 'rgba(186, 148, 79, 0.5)'};
            color: ${this.isConnected ? '#4a90e2' : '#ba944f'};
            border-radius: 8px;
            cursor: pointer;
            font-family: 'Raleway', sans-serif;
            font-weight: 600;
            transition: all 0.3s ease;
        `;

        button.addEventListener('click', async () => {
            if (this.isConnected) {
                // Show wallet info
                const address = await this.getConnectedAddress();
                alert(`Wallet connected: ${address}`);
            } else {
                const connected = await this.connectWallet();
                if (connected) {
                    button.innerHTML = '🔗 Wallet Connected';
                    button.style.background = 'rgba(74, 144, 226, 0.2)';
                    button.style.borderColor = 'rgba(74, 144, 226, 0.5)';
                    button.style.color = '#4a90e2';
                    this.isConnected = true;
                }
            }
        });

        container.appendChild(button);
    }

    /**
     * Integrate with planet claiming
     */
    async onPlanetClaimed(planetData, claimData) {
        // Automatically create NFT when planet is claimed
        if (this.isConnected) {
            const nft = await this.createPlanetNFT(planetData, claimData);
            if (nft) {
                // Show NFT certificate
                setTimeout(() => {
                    this.displayNFTCertificate(nft);
                }, 1000);
            }
        } else {
            // Show prompt to connect wallet for NFT
            const createNFT = confirm('Would you like to create an NFT certificate for this planet? Connect your wallet to proceed.');
            if (createNFT) {
                const connected = await this.connectWallet();
                if (connected) {
                    const nft = await this.createPlanetNFT(planetData, claimData);
                    if (nft) {
                        this.displayNFTCertificate(nft);
                    }
                }
            }
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.blockchainNFT = new BlockchainNFTIntegration();

    // Make available globally
    window.getBlockchainNFT = () => window.blockchainNFT;
}

