/**
 * Anomaly Research System
 * Q1 2025 Feature: The Living Universe
 * 
 * Allows players to scan planets for signal sources and analyze them.
 */
class AnomalyResearchSystem {
    constructor() {
        this.scannedPlanets = new Set();
        this.anomalies = [];
        this.isScanning = false;
        this.init();
    }

    init() {
        this.createScanUI();
        console.log('📡 Anomaly Research System Online');
    }

    createScanUI() {
        // We'll inject a "Scan" button into the 3D viewer modal when it opens
        // This is handled by observing the modal or by providing a method to render controls
    }

    // Called when 3D viewer opens a planet
    onPlanetViewed(planetData) {
        this.currentPlanet = planetData;
        this.renderScanControls();
    }

    renderScanControls() {
        const controls = document.querySelector('#planet-3d-modal .controls-container') ||
            document.querySelector('#planet-3d-modal div[style*="justify-content: center"]'); // Fallback selector

        if (!controls || document.getElementById('scan-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'scan-btn';
        btn.innerHTML = '📡 Scan for Signals';
        btn.style.cssText = `
            background: rgba(16, 185, 129, 0.2); 
            border: 1px solid rgba(16, 185, 129, 0.5); 
            color: #10b981; 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            cursor: pointer; 
            font-family: 'Raleway', sans-serif; 
            font-size: 0.85rem;
        `;

        btn.onclick = () => this.startScan();
        controls.appendChild(btn);
    }

    startScan() {
        if (this.isScanning) return;
        this.isScanning = true;

        const btn = document.getElementById('scan-btn');
        if (btn) {
            btn.innerHTML = 'Scanning...';
            btn.disabled = true;
        }

        // Mock scan delay
        setTimeout(() => {
            this.completeScan();
        }, 3000);
    }

    completeScan() {
        this.isScanning = false;
        const btn = document.getElementById('scan-btn');
        if (btn) {
            btn.innerHTML = 'Scan Complete';
            btn.style.borderColor = '#10b981';
            btn.disabled = false;
        }

        // Result determination
        const hasAnomaly = Math.random() > 0.7; // 30% chance

        if (hasAnomaly) {
            this.foundAnomaly();
        } else {
            alert('No significant anomalies detected in this sector.');
        }
    }

    foundAnomaly() {
        const types = ['Ancient Ruins', 'Alien Signal', 'Mineral Deposit', 'Derelict Ship'];
        const type = types[Math.floor(Math.random() * types.length)];

        this.anomalies.push({
            planet: this.currentPlanet.kepler_name,
            type: type,
            date: new Date()
        });

        alert(`🚨 ANOMALY DETECTED: ${type}!\nData added to research logs.`);
        this.trackAnomaly(type);
    }

    trackAnomaly(type) {
        if (window.performanceMonitoring) {
            window.performanceMonitoring.recordMetric('anomaly_found', 1, { type });
        }
    }
}

// Export
if (typeof window !== 'undefined') {
    window.AnomalyResearchSystem = AnomalyResearchSystem;
}
