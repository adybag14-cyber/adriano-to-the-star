/**
 * Memory Usage Profiler
 * Profile memory usage
 */
(function() {
    'use strict';

    class MemoryUsageProfiler {
        constructor() {
            this.snapshots = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.startProfiling();
        }

        setupUI() {
            if (!document.getElementById('memory-profiler')) {
                const profiler = document.createElement('div');
                profiler.id = 'memory-profiler';
                profiler.className = 'memory-profiler';
                profiler.innerHTML = `<h2>Memory Profiler</h2>`;
                document.body.appendChild(profiler);
            }
        }

        startProfiling() {
            setInterval(() => {
                this.takeSnapshot();
            }, 5000);
        }

        takeSnapshot() {
            if (performance.memory) {
                const snapshot = {
                    used: performance.memory.usedJSHeapSize,
                    total: performance.memory.totalJSHeapSize,
                    limit: performance.memory.jsHeapSizeLimit,
                    timestamp: new Date().toISOString()
                };
                this.snapshots.push(snapshot);
                if (this.snapshots.length > 100) {
                    this.snapshots.shift();
                }
            }
        }

        getMemoryInfo() {
            if (performance.memory) {
                return {
                    used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                    total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                    limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
                };
            }
            return null;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.memoryProfiler = new MemoryUsageProfiler();
        });
    } else {
        window.memoryProfiler = new MemoryUsageProfiler();
    }
})();

