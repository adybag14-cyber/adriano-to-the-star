/**
 * Distributed Data Storage System
 * Store data across multiple nodes
 */
(function() {
    'use strict';

    class DistributedDataStorage {
        constructor() {
            this.nodes = [];
            this.replicationFactor = 3;
            this.init();
        }

        async fetchJSON(url, options = {}) {
            try {
                // First attempt: direct fetch
                const response = await fetch(url, options);
                if (response.ok) return await response.json();
                throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                console.warn(`[DistributedStorage] Direct fetch failed for ${url}, attempting proxies...`, error);
                
                // Second attempt: AllOrigins proxy
                try {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl);
                    if (proxyRes.ok) {
                        const data = await proxyRes.json();
                        return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                    }
                } catch (proxyError) {
                    console.warn('[DistributedStorage] AllOrigins proxy failed:', proxyError);
                }

                // Third attempt: corsproxy.io fallback
                try {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl, options);
                    if (proxyRes.ok) return await proxyRes.json();
                } catch (proxyError) {
                    console.error('[DistributedStorage] All proxies failed:', proxyError);
                }

                throw error; // Rethrow original error if all fail
            }
        }

        init() {
            this.setupUI();
            this.trackEvent('distributed_storage_initialized');
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`distributed_storage_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }

        setupUI() {
            if (!document.getElementById('distributed-storage')) {
                const storage = document.createElement('div');
                storage.id = 'distributed-storage';
                storage.className = 'distributed-storage';
                storage.innerHTML = `<h2>Distributed Storage</h2>`;
                document.body.appendChild(storage);
            }
        }

        addNode(node) {
            this.nodes.push({
                id: node.id,
                url: node.url,
                capacity: node.capacity,
                available: node.available || true
            });
        }

        async store(key, value) {
            const replicas = this.selectReplicaNodes(key);
            const promises = replicas.map(node => this.storeOnNode(node, key, value));
            await Promise.all(promises);
        }

        selectReplicaNodes(key) {
            // Select nodes for replication based on consistent hashing
            const hash = this.hash(key);
            const selected = [];
            for (let i = 0; i < this.replicationFactor; i++) {
                const nodeIndex = (hash + i) % this.nodes.length;
                selected.push(this.nodes[nodeIndex]);
            }
            return selected;
        }

        hash(key) {
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = ((hash << 5) - hash) + key.charCodeAt(i);
                hash = hash & hash;
            }
            return Math.abs(hash);
        }

        async storeOnNode(node, key, value) {
            try {
                await this.fetchJSON(`${node.url}/store`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key, value })
                });
            } catch (error) {
                console.error(`Failed to store on node ${node.id}:`, error);
            }
        }

        async retrieve(key) {
            const node = this.findNodeForKey(key);
            if (!node) return null;

            try {
                return await this.fetchJSON(`${node.url}/retrieve?key=${key}`);
            } catch (error) {
                console.error(`Failed to retrieve from node:`, error);
                return null;
            }
        }

        findNodeForKey(key) {
            const hash = this.hash(key);
            return this.nodes[hash % this.nodes.length];
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.distributedStorage = new DistributedDataStorage();
        });
    } else {
        window.distributedStorage = new DistributedDataStorage();
    }
})();

