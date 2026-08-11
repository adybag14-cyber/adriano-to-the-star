/**
 * HTTP/3 (QUIC) Support
 * Support for HTTP/3 and QUIC protocol
 */

class HTTP3QUICSupport {
    constructor() {
        this.supportsHTTP3 = false;
        this.init();
    }
    
    init() {
        this.detectHTTP3();
    }
    
    detectHTTP3() {
        // Detect HTTP/3 support
        const navigation = performance.getEntriesByType('navigation')[0];
        if (navigation) {
            this.supportsHTTP3 = navigation.nextHopProtocol === 'h3' || 
                                 navigation.nextHopProtocol === 'http/3';
        }
    }
    
    optimizeForHTTP3() {
        if (this.supportsHTTP3) {
            // HTTP/3 benefits from QUIC
            // Better performance on unreliable networks
            this.enableQUICFeatures();
        }
    }
    
    enableQUICFeatures() {
        // QUIC provides built-in encryption and multiplexing
        // Better connection migration
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.http3QUICSupport = new HTTP3QUICSupport(); });
} else {
    window.http3QUICSupport = new HTTP3QUICSupport();
}

