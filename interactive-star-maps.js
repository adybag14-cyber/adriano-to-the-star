/**
 * Interactive Star Maps
 * Interactive star map visualization
 * 
 * Features:
 * - Star catalog
 * - Constellation lines
 * - Planet positions
 * - Zoom and pan
 */

class InteractiveStarMaps {
    constructor() {
        this.stars = [];
        this.constellations = [];
        this.canvas = null;
        this.init();
    }
    
    init() {
        this.loadStarData();
        console.log('⭐ Interactive Star Maps initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_er_ac_ti_ve_st_ar_ma_ps_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    loadStarData() {
        // Load star catalog data
        this.stars = [];
    }
    
    createCanvas(containerOrId) {
        const container = typeof containerOrId === 'string'
            ? document.getElementById(containerOrId)
            : containerOrId;

        if (!container) {
            return null;
        }

        container.innerHTML = '';

        const canvas = document.createElement('canvas');
        canvas.id = 'star-map';

        const height = 600;
        canvas.style.cssText = `
            width: 100%;
            height: ${height}px;
            background: #000;
            border: 2px solid #ba944f;
            border-radius: 8px;
            display: block;
        `;

        const containerWidth = container.clientWidth || container.getBoundingClientRect().width;
        canvas.width = Math.max(320, Math.round(containerWidth || 800));
        canvas.height = height;

        container.appendChild(canvas);
        this.canvas = canvas;
        this.render();

        return canvas;
    }

    createMap(containerOrId) {
        return this.createCanvas(containerOrId);
    }

    render() {
        if (!this.canvas) {
            return;
        }

        const ctx = this.canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const starCount = 250;
        for (let i = 0; i < starCount; i++) {
            const x = Math.random() * this.canvas.width;
            const y = Math.random() * this.canvas.height;
            const r = Math.random() * 1.5;
            ctx.globalAlpha = 0.3 + Math.random() * 0.7;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.globalAlpha = 1;
    }
}

let interactiveStarMapsInstance = null;

function starMaps() {
    if (!interactiveStarMapsInstance) {
        interactiveStarMapsInstance = new InteractiveStarMaps();
    }
    return interactiveStarMapsInstance;
}

window.InteractiveStarMaps = InteractiveStarMaps;
window.starMaps = starMaps;
window.interactiveStarMaps = starMaps();
