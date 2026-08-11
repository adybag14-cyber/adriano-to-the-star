/**
 * 🗺️ EXOPLANET PIONEER: KADEMLIA-BASED DHT ROUTING
 * Item 2022: Kademlia-based Routing for ultra-fast asset discovery in the DHT.
 */

class KadDHTrouting {
    constructor(localId) {
        this.localId = localId;
        this.buckets = new Map(); // XOR distance -> PeerID[]
        console.log("🗺️ Kad-DHT: Routing buckets initialized.");
    }

    /**
     * Calculate XOR distance between two IDs.
     */
    distance(id1, id2) {
        // Mock XOR distance using simple string comparison for simulation
        let dist = 0;
        for (let i = 0; i < Math.min(id1.length, id2.length); i++) {
            if (id1[i] !== id2[i]) dist++;
        }
        return dist;
    }

    /**
     * Add a peer to the routing table.
     */
    updateBucket(peerId) {
        const dist = this.distance(this.localId, peerId);
        if (!this.buckets.has(dist)) this.buckets.set(dist, []);
        
        const bucket = this.buckets.get(dist);
        if (!bucket.includes(peerId)) {
            bucket.push(peerId);
            if (bucket.length > 20) bucket.shift(); // k-bucket size
        }
    }

    /**
     * Find the k-nearest peers to a given key.
     */
    findClosestPeers(targetKey, k = 5) {
        const allPeers = [];
        this.buckets.forEach(bucket => allPeers.push(...bucket));
        
        return allPeers
            .sort((a, b) => this.distance(a, targetKey) - this.distance(b, targetKey))
            .slice(0, k);
    }
}

export { KadDHTrouting };
