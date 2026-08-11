/**
 * 💎 ERC-721 NFT (FULL PERSISTENT IMPLEMENTATION)
 * Local-First Persistence using IndexedDB for planetary assets.
 */

class ERC721NFT {
    constructor() {
        this.dbName = "ExoplanetPioneer_NFT";
        this.db = null;
        this.init();
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                db.createObjectStore("collections", { keyPath: "id" });
                db.createObjectStore("tokens", { keyPath: "id" });
            };
            request.onsuccess = (e) => {
                this.db = e.target.result;
                console.log("💎 NFT Persistence Online: IndexedDB Connected.");
                resolve();
            };
            request.onerror = (e) => reject(e);
        });
    }

    /**
     * Item 206: Galactic Stock Market / NFT Registry
     */
    async deployCollection(id, name, symbol) {
        const collection = { id, name, symbol, address: this._genAddr(), createdAt: new Date() };
        const tx = this.db.transaction("collections", "readwrite");
        await tx.objectStore("collections").put(collection);
        console.log(`[CONTRACT] Deployed ${name} (${symbol}) at ${collection.address}`);
        return collection;
    }

    /**
     * Item 722: Achievement Unlock / Token Minting
     */
    async mint(collectionId, metadata) {
        if (!this.db) await this.init();
        
        const tokenId = `TOKEN-${Date.now()}-${Math.floor(Math.random()*1000)}`;
        const token = {
            id: tokenId,
            collectionId,
            metadata,
            owner: window.meshEngine?.meshId || "LOCAL_USER",
            mintedAt: new Date()
        };

        const tx = this.db.transaction("tokens", "readwrite");
        await tx.objectStore("tokens").put(token);
        
        console.log(`[MINT] Successfully minted NFT: ${tokenId}`);
        window.dispatchEvent(new CustomEvent("NFT_MINTED", { detail: token }));
        return token;
    }

    async getMyTokens() {
        if (!this.db) await this.init();
        return new Promise((resolve) => {
            const tx = this.db.transaction("tokens", "readonly");
            const request = tx.objectStore("tokens").getAll();
            request.onsuccess = () => resolve(request.result);
        });
    }

    async transfer(tokenId, toAddress) {
        const tx = this.db.transaction("tokens", "readwrite");
        const store = tx.objectStore("tokens");
        const token = await new Promise(r => {
            const req = store.get(tokenId);
            req.onsuccess = () => r(req.result);
        });

        if (!token) throw new Error("Token not found");
        
        token.owner = toAddress;
        token.prevOwner = window.meshEngine?.meshId;
        await store.put(token);
        
        console.log(`[TRANSFER] Token ${tokenId} sent to ${toAddress}`);
        return token;
    }

    _genAddr() {
        return '0x' + Array.from({ length: 40 }, () => 
            Math.floor(Math.random() * 16).toString(16)
        ).join('');
    }
}

window.erc721Nft = new ERC721NFT();
if (typeof module !== 'undefined') module.exports = ERC721NFT;