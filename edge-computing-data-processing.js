/**
 * Edge Computing Data Processing
 * Process data at the edge
 */
(function() {
    'use strict';

    class EdgeComputingDataProcessing {
        constructor() {
            this.edgeNodes = [];
            this.init();
        }

        async fetchJSON(url, options = {}) {
            try {
                // First attempt: direct fetch
                const response = await fetch(url, options);
                if (response.ok) return await response.json();
                throw new Error(`HTTP error! status: ${response.status}`);
            } catch (error) {
                console.warn(`[EdgeComputing] Direct fetch failed for ${url}, attempting proxies...`, error);
                
                // Second attempt: AllOrigins proxy
                try {
                    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl);
                    if (proxyRes.ok) {
                        const data = await proxyRes.json();
                        return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
                    }
                } catch (proxyError) {
                    console.warn('[EdgeComputing] AllOrigins proxy failed:', proxyError);
                }

                // Third attempt: corsproxy.io fallback
                try {
                    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                    const proxyRes = await fetch(proxyUrl, options);
                    if (proxyRes.ok) return await proxyRes.json();
                } catch (proxyError) {
                    console.error('[EdgeComputing] All proxies failed:', proxyError);
                }

                throw error; // Rethrow original error if all fail
            }
        }

        init() {
            this.setupUI();
            this.trackEvent('edge_comp_data_initialized');
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`edge_comp_data_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }

        setupUI() {
            if (!document.getElementById('edge-computing')) {
                const edge = document.createElement('div');
                edge.id = 'edge-computing';
                edge.className = 'edge-computing';
                edge.innerHTML = `<h2>Edge Computing</h2>`;
                document.body.appendChild(edge);
            }
        }

        registerEdgeNode(node) {
            this.edgeNodes.push({
                id: node.id,
                location: node.location,
                capacity: node.capacity,
                latency: node.latency
            });
        }

        async processAtEdge(data, processingFunction) {
            // Find nearest edge node
            const nearestNode = this.findNearestNode();
            if (!nearestNode) {
                return this.processLocally(data, processingFunction);
            }

            // Process at edge
            return await this.sendToEdge(nearestNode, data, processingFunction);
        }

        findNearestNode() {
            // Find nearest edge node (simplified)
            return this.edgeNodes[0] || null;
        }

        async sendToEdge(node, data, fn) {
            // Send to edge node for processing
            try {
                const response = await fetch(`/edge/${node.id}/process`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data, function: fn.toString() })
                });
                return await response.json();
            } catch (error) {
                console.error('Edge processing failed:', error);
                return this.processLocally(data, fn);
            }
        }

        processLocally(data, fn) {
            return fn(data);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.edgeComputing = new EdgeComputingDataProcessing();
        });
    } else {
        window.edgeComputing = new EdgeComputingDataProcessing();
    }
})();

