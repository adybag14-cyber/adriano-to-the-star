/**
 * Request Batching and Debouncing
 * Batch and debounce API requests
 */
(function() {
    'use strict';

    class RequestBatchingDebouncing {
        constructor() {
            this.batchQueue = [];
            this.batchTimer = null;
            this.debounceTimers = new Map();
            this.init();
        }

        init() {
            this.setupUI();
        }

        setupUI() {
            if (!document.getElementById('request-batching')) {
                const batching = document.createElement('div');
                batching.id = 'request-batching';
                batching.className = 'request-batching';
                batching.innerHTML = `<h2>Request Batching</h2>`;
                document.body.appendChild(batching);
            }
        }

        batchRequest(url, data) {
            this.batchQueue.push({ url, data });
            
            if (this.batchTimer) {
                clearTimeout(this.batchTimer);
            }

            this.batchTimer = setTimeout(() => {
                this.flushBatch();
            }, 100);
        }

        async flushBatch() {
            if (this.batchQueue.length === 0) return;

            const batch = [...this.batchQueue];
            this.batchQueue = [];

            try {
                await fetch('/api/batch', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(batch)
                });
            } catch (error) {
                console.error('Batch request failed:', error);
            }
        }

        debounce(key, fn, delay = 300) {
            if (this.debounceTimers.has(key)) {
                clearTimeout(this.debounceTimers.get(key));
            }

            const timer = setTimeout(() => {
                fn();
                this.debounceTimers.delete(key);
            }, delay);

            this.debounceTimers.set(key, timer);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.requestBatching = new RequestBatchingDebouncing();
        });
    } else {
        window.requestBatching = new RequestBatchingDebouncing();
    }
})();

