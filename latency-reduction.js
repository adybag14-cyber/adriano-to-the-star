/**
 * Latency Reduction
 * Reduces network latency for faster responses
 */

class LatencyReduction {
    constructor() {
        this.init();
    }
    
    init() {
        this.useCDN();
        this.enablePreconnect();
        this.optimizeDNS();
    }
    
    useCDN() {
        // Use CDN for static assets
        // This would be configured at build/deploy time
    }
    
    enablePreconnect() {
        // Preconnect to important domains
        const domains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
    }
    
    optimizeDNS() {
        // DNS prefetch for external domains
        const domains = [
            'https://cdn.example.com',
            'https://api.example.com'
        ];
        
        domains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            document.head.appendChild(link);
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.latencyReduction = new LatencyReduction(); });
} else {
    window.latencyReduction = new LatencyReduction();
}

