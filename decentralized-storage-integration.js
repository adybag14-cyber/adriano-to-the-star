/**
 * Decentralized Storage Integration
 * Integrates IPFS, Arweave, and other decentralized storage solutions for NFT metadata
 */

class DecentralizedStorageIntegration {
    constructor() {
        this.storageProviders = {
            ipfs: null,
            arweave: null,
            web3storage: null
        };
        this.defaultProvider = 'ipfs';
        this.isInitialized = false;

        this.init();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ec_en_tr_al_iz_ed_st_or_ag_ei_nt_eg_ra_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async init() {
        // Initialize IPFS if available
        if (typeof window.Ipfs !== 'undefined') {
            try {
                this.storageProviders.ipfs = await window.Ipfs.create();
                console.log('✅ IPFS node initialized');
            } catch (error) {
                console.warn('IPFS initialization failed:', error);
            }
        }

        // Initialize Arweave if available
        if (typeof window.Arweave !== 'undefined') {
            try {
                this.storageProviders.arweave = window.Arweave.init({
                    host: 'arweave.net',
                    port: 443,
                    protocol: 'https'
                });
                console.log('✅ Arweave initialized');
            } catch (error) {
                console.warn('Arweave initialization failed:', error);
            }
        }

        this.isInitialized = true;
        console.log('📦 Decentralized Storage Integration initialized');
    }

    async fetchJSON(url, options = {}) {
        try {
            // First attempt: direct fetch
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            console.warn(`[decentralized-storage] Direct fetch failed for ${url}, attempting proxies...`, error);
            
            // Second attempt: AllOrigins proxy
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (proxyRes.ok) {
                    const data = await proxyRes.json();
                    return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                }
            } catch (proxyError) {
                console.warn('[decentralized-storage] AllOrigins proxy failed:', proxyError);
            }

            // Third attempt: corsproxy.io fallback
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (proxyRes.ok) return await proxyRes.json();
            } catch (proxyError) {
                console.error('[decentralized-storage] All proxies failed:', proxyError);
            }

            throw error; // Rethrow original error if all fail
        }
    }

    /**
     * Upload data to IPFS
     */
    async uploadToIPFS(data, options = {}) {
        try {
            // Method 1: Use Pinata (if API keys available)
            if (window.PINATA_API_KEY && window.PINATA_SECRET_KEY) {
                return await this.uploadToPinata(data, options);
            }

            // Method 2: Use Web3.Storage (if API key available)
            if (window.WEB3_STORAGE_API_KEY) {
                return await this.uploadToWeb3Storage(data, options);
            }

            // Method 3: Use local IPFS node
            if (this.storageProviders.ipfs) {
                return await this.uploadToLocalIPFS(data, options);
            }

            // Method 4: Use public IPFS gateway (via API)
            return await this.uploadToPublicIPFS(data, options);

        } catch (error) {
            console.error('IPFS upload error:', error);
            throw error;
        }
    }

    /**
     * Upload to Pinata IPFS
     */
    async uploadToPinata(data, options = {}) {
        const isFile = data instanceof File || data instanceof Blob;
        const formData = new FormData();

        if (isFile) {
            formData.append('file', data);
        } else {
            // Convert JSON to blob
            const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
            formData.append('file', blob, options.filename || 'data.json');
        }

        // Add metadata
        if (options.metadata) {
            formData.append('pinataMetadata', JSON.stringify({
                name: options.name || 'Planet NFT Metadata',
                keyvalues: options.metadata
            }));
        }

        const result = await this.fetchJSON('https://api.pinata.cloud/pinning/pinFileToIPFS', {
            method: 'POST',
            headers: {
                'pinata_api_key': window.PINATA_API_KEY,
                'pinata_secret_api_key': window.PINATA_SECRET_KEY
            },
            body: formData
        });

        return {
            hash: result.IpfsHash,
            url: `https://ipfs.io/ipfs/${result.IpfsHash}`,
            gateway: 'pinata',
            size: result.PinSize
        };
    }

    /**
     * Upload to Web3.Storage
     */
    async uploadToWeb3Storage(data, options = {}) {
        try {
            // Dynamic import if not available
            const { Web3Storage } = await import('web3.storage');
            const client = new Web3Storage({ token: window.WEB3_STORAGE_API_KEY });

            let file;
            if (data instanceof File) {
                file = data;
            } else if (data instanceof Blob) {
                file = new File([data], options.filename || 'data.json', { type: data.type });
            } else {
                const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
                file = new File([blob], options.filename || 'data.json');
            }

            const cid = await client.put([file], {
                name: options.name || 'Planet NFT Metadata',
                maxRetries: 3
            });

            return {
                hash: cid.toString(),
                url: `https://${cid}.ipfs.w3s.link`,
                gateway: 'web3.storage',
                size: file.size
            };
        } catch (error) {
            console.error('Web3.Storage upload error:', error);
            throw error;
        }
    }

    /**
     * Upload to local IPFS node
     */
    async uploadToLocalIPFS(data, options = {}) {
        if (!this.storageProviders.ipfs) {
            throw new Error('IPFS node not initialized');
        }

        let content;
        if (data instanceof File || data instanceof Blob) {
            content = await data.arrayBuffer();
        } else {
            content = new TextEncoder().encode(JSON.stringify(data));
        }

        const result = await this.storageProviders.ipfs.add(content, {
            pin: true,
            ...options
        });

        return {
            hash: result.cid.toString(),
            url: `https://ipfs.io/ipfs/${result.cid}`,
            gateway: 'local-ipfs',
            size: result.size
        };
    }

    /**
     * Upload to public IPFS via HTTP API
     */
    async uploadToPublicIPFS(data, options = {}) {
        // Use a public IPFS HTTP API (like Infura, etc.)
        const gateway = options.gateway || 'https://ipfs.infura.io:5001';

        let content;
        if (data instanceof File || data instanceof Blob) {
            content = data;
        } else {
            content = new Blob([JSON.stringify(data)], { type: 'application/json' });
        }

        const formData = new FormData();
        formData.append('file', content, options.filename || 'data.json');

        const result = await this.fetchJSON(`${gateway}/api/v0/add`, {
            method: 'POST',
            body: formData
        });

        return {
            hash: result.Hash,
            url: `https://ipfs.io/ipfs/${result.Hash}`,
            gateway: 'public-ipfs',
            size: parseInt(result.Size)
        };
    }

    /**
     * Upload to Arweave
     */
    async uploadToArweave(data, options = {}) {
        if (!this.storageProviders.arweave) {
            throw new Error('Arweave not initialized');
        }

        try {
            let content;
            if (data instanceof File || data instanceof Blob) {
                content = await data.arrayBuffer();
            } else {
                content = new TextEncoder().encode(JSON.stringify(data));
            }

            // Create transaction
            const transaction = await this.storageProviders.arweave.createTransaction({
                data: content
            }, options.wallet);

            // Add tags
            transaction.addTag('Content-Type', options.contentType || 'application/json');
            transaction.addTag('App-Name', 'Adriano To The Star');
            if (options.name) {
                transaction.addTag('Title', options.name);
            }

            // Sign and submit
            await this.storageProviders.arweave.transactions.sign(transaction, options.wallet);
            await this.storageProviders.arweave.transactions.post(transaction);

            return {
                hash: transaction.id,
                url: `https://arweave.net/${transaction.id}`,
                gateway: 'arweave',
                size: transaction.data_size
            };
        } catch (error) {
            console.error('Arweave upload error:', error);
            throw error;
        }
    }

    /**
     * Upload NFT metadata with automatic provider selection
     */
    async uploadNFTMetadata(metadata, options = {}) {
        const provider = options.provider || this.defaultProvider;

        try {
            switch (provider) {
                case 'ipfs':
                    return await this.uploadToIPFS(metadata, options);
                case 'arweave':
                    return await this.uploadToArweave(metadata, options);
                default:
                    return await this.uploadToIPFS(metadata, options);
            }
        } catch (error) {
            console.error(`Upload to ${provider} failed, trying fallback...`, error);

            // Fallback to IPFS if Arweave fails
            if (provider === 'arweave') {
                return await this.uploadToIPFS(metadata, options);
            }

            throw error;
        }
    }

    /**
     * Retrieve data from IPFS
     */
    async retrieveFromIPFS(hash, gateway = 'ipfs.io') {
        try {
            const url = `https://${gateway}/ipfs/${hash}`;
            return await this.fetchJSON(url);
        } catch (error) {
            console.error('IPFS retrieval error:', error);
            throw error;
        }
    }

    /**
     * Retrieve data from Arweave
     */
    async retrieveFromArweave(transactionId) {
        try {
            const url = `https://arweave.net/${transactionId}`;
            return await this.fetchJSON(url);
        } catch (error) {
            console.error('Arweave retrieval error:', error);
            throw error;
        }
    }

    /**
     * Pin content to IPFS (ensure permanence)
     */
    async pinToIPFS(hash, service = 'pinata') {
        if (service === 'pinata' && window.PINATA_API_KEY) {
            return await this.fetchJSON(`https://api.pinata.cloud/pinning/pinByHash`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'pinata_api_key': window.PINATA_API_KEY,
                    'pinata_secret_api_key': window.PINATA_SECRET_KEY
                },
                body: JSON.stringify({
                    hashToPin: hash
                })
            });
        }

        throw new Error(`Pinning service ${service} not available`);
    }

    /**
     * Get storage statistics
     */
    async getStorageStats() {
        return {
            ipfs: { available: !!this.storageProviders.ipfs },
            arweave: { available: !!this.storageProviders.arweave },
            web3storage: { available: !!window.WEB3_STORAGE_API_KEY },
            pinata: { available: !!(window.PINATA_API_KEY && window.PINATA_SECRET_KEY) }
        };
    }

    /**
     * Render storage UI
     */
    renderStorageUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="decentralized-storage-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📦 Decentralized Storage</h3>
                
                <div class="storage-providers" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                    ${this.renderProviderCards()}
                </div>

                <div class="upload-section" style="margin-top: 2rem;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">Upload Metadata</h4>
                    <textarea id="metadata-input" placeholder='{"name": "Planet NFT", "description": "..."}' style="width: 100%; min-height: 150px; padding: 1rem; background: rgba(0, 0, 0, 0.7); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 10px; color: white; font-family: monospace; margin-bottom: 1rem;"></textarea>
                    <button id="upload-metadata-btn" class="btn-primary" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        📤 Upload to IPFS
                    </button>
                </div>

                <div id="upload-result" style="margin-top: 1.5rem;"></div>
            </div>
        `;

        // Add event listener
        const uploadBtn = document.getElementById('upload-metadata-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', async () => {
                const input = document.getElementById('metadata-input');
                const resultDiv = document.getElementById('upload-result');

                try {
                    const metadata = JSON.parse(input.value);
                    uploadBtn.disabled = true;
                    uploadBtn.textContent = '⏳ Uploading...';

                    const result = await this.uploadNFTMetadata(metadata);

                    resultDiv.innerHTML = `
                        <div style="padding: 1rem; background: rgba(74, 222, 128, 0.1); border: 1px solid rgba(74, 222, 128, 0.3); border-radius: 10px;">
                            <div style="color: #4ade80; font-weight: 600; margin-bottom: 0.5rem;">✅ Upload Successful!</div>
                            <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Hash: <code style="color: #ba944f;">${result.hash}</code></div>
                            <div style="color: rgba(255, 255, 255, 0.8); font-size: 0.9rem; margin-top: 0.5rem;">URL: <a href="${result.url}" target="_blank" style="color: #4a90e2;">${result.url}</a></div>
                        </div>
                    `;

                    uploadBtn.disabled = false;
                    uploadBtn.textContent = '📤 Upload to IPFS';
                } catch (error) {
                    resultDiv.innerHTML = `
                        <div style="padding: 1rem; background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 10px; color: #ef4444;">
                            ❌ Upload Failed: ${error.message}
                        </div>
                    `;
                    uploadBtn.disabled = false;
                    uploadBtn.textContent = '📤 Upload to IPFS';
                }
            });
        }
    }

    renderProviderCards() {
        const providers = [
            { name: 'IPFS', available: !!this.storageProviders.ipfs || !!window.PINATA_API_KEY },
            { name: 'Arweave', available: !!this.storageProviders.arweave },
            { name: 'Web3.Storage', available: !!window.WEB3_STORAGE_API_KEY },
            { name: 'Pinata', available: !!(window.PINATA_API_KEY && window.PINATA_SECRET_KEY) }
        ];

        return providers.map(provider => `
            <div style="padding: 1rem; background: rgba(0, 0, 0, 0.4); border: 1px solid ${provider.available ? 'rgba(74, 222, 128, 0.3)' : 'rgba(239, 68, 68, 0.3)'}; border-radius: 10px;">
                <div style="color: ${provider.available ? '#4ade80' : '#ef4444'}; font-weight: 600;">${provider.available ? '✅' : '❌'} ${provider.name}</div>
                <div style="color: rgba(255, 255, 255, 0.6); font-size: 0.85rem; margin-top: 0.25rem;">${provider.available ? 'Available' : 'Not configured'}</div>
            </div>
        `).join('');
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.DecentralizedStorageIntegration = DecentralizedStorageIntegration;
    window.decentralizedStorage = new DecentralizedStorageIntegration();
}
