/**
 * Planet Comparison Enhancements
 * Advanced comparison features beyond current implementation
 * 
 * Features:
 * - Visual comparison charts
 * - Side-by-side comparison
 * - Comparison history
 * - Export comparison data
 * - Comparison recommendations
 */

class PlanetComparisonEnhancements {
    constructor() {
        this.comparisons = [];
        this.currentComparison = [];
        this.maxPlanets = 10; // Increased from 5
        this.init();
    }
    
    init() {
        // Load comparison history
        this.loadComparisons();
        
        // Enhance existing comparison
        this.enhanceExistingComparison();
        
        // Create enhanced comparison UI
        this.createComparisonUI();
        
        console.log('⚖️ Planet Comparison Enhancements initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_tc_om_pa_ri_so_ne_nh_an_ce_me_nt_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    
    enhanceExistingComparison() {
        // Find existing comparison buttons and enhance them
        const compareButtons = document.querySelectorAll('[data-compare], .compare-btn');
        compareButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planetCard = e.target.closest('.planet-card, [data-kepid]');
                if (planetCard) {
                    const planetId = planetCard.dataset.kepid;
                    this.togglePlanetInComparison(planetId);
                }
            });
        });
    }
    
    createComparisonUI() {
        // Create floating comparison panel
        const panel = document.createElement('div');
        panel.id = 'enhanced-comparison-panel';
        panel.className = 'enhanced-comparison-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.95);
            border: 2px solid rgba(186, 148, 79, 0.5);
            border-radius: 10px;
            padding: 1.5rem;
            z-index: 9999;
            min-width: 300px;
            max-width: 600px;
            max-height: 80vh;
            overflow-y: auto;
            display: none;
            color: white;
        `;
        
        panel.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="color: #ba944f; margin: 0;">⚖️ Compare Planets</h3>
                <button id="close-comparison" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div id="comparison-planets-list"></div>
            <div style="margin-top: 1rem; display: flex; gap: 0.5rem;">
                <button id="compare-now" style="flex: 1; padding: 0.75rem; background: #ba944f; border: none; border-radius: 5px; color: white; cursor: pointer;">
                    Compare (${this.currentComparison.length})
                </button>
                <button id="clear-comparison" style="padding: 0.75rem; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.3); border-radius: 5px; color: white; cursor: pointer;">
                    Clear
                </button>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Toggle button
        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'toggle-comparison-panel';
        toggleBtn.innerHTML = '⚖️ Compare';
        toggleBtn.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            padding: 0.75rem 1.5rem;
            background: rgba(186, 148, 79, 0.9);
            border: 2px solid rgba(186, 148, 79, 1);
            border-radius: 10px;
            color: white;
            cursor: pointer;
            z-index: 9998;
            font-weight: bold;
        `;
        
        toggleBtn.addEventListener('click', () => {
            panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
        
        document.body.appendChild(toggleBtn);
        
        // Event listeners
        document.getElementById('close-comparison').addEventListener('click', () => {
            panel.style.display = 'none';
        });
        
        document.getElementById('compare-now').addEventListener('click', () => {
            this.showComparison();
        });
        
        document.getElementById('clear-comparison').addEventListener('click', () => {
            this.clearComparison();
        });
        
        // Update panel periodically
        setInterval(() => {
            this.updateComparisonPanel();
        }, 1000);
    }
    
    togglePlanetInComparison(planetId) {
        const index = this.currentComparison.indexOf(planetId);
        
        if (index > -1) {
            this.currentComparison.splice(index, 1);
        } else {
            if (this.currentComparison.length >= this.maxPlanets) {
                alert(`Maximum ${this.maxPlanets} planets can be compared`);
                return;
            }
            this.currentComparison.push(planetId);
        }
        
        this.updateComparisonPanel();
    }
    
    updateComparisonPanel() {
        const list = document.getElementById('comparison-planets-list');
        const compareBtn = document.getElementById('compare-now');
        
        if (this.currentComparison.length === 0) {
            list.innerHTML = '<p style="color: rgba(255,255,255,0.5); text-align: center;">No planets selected for comparison</p>';
            compareBtn.textContent = 'Compare (0)';
            compareBtn.disabled = true;
            return;
        }
        
        list.innerHTML = this.currentComparison.map((planetId, index) => {
            const planetCard = document.querySelector(`[data-kepid="${planetId}"]`);
            const planetName = planetCard?.dataset.name || planetCard?.querySelector('.planet-name')?.textContent || planetId;
            
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: rgba(186,148,79,0.1); border-radius: 5px; margin-bottom: 0.5rem;">
                    <span>${index + 1}. ${planetName}</span>
                    <button class="remove-from-comparison" data-planet-id="${planetId}" 
                            style="background: rgba(255,0,0,0.3); border: 1px solid rgba(255,0,0,0.5); border-radius: 3px; color: white; padding: 0.25rem 0.5rem; cursor: pointer;">
                        Remove
                    </button>
                </div>
            `;
        }).join('');
        
        compareBtn.textContent = `Compare (${this.currentComparison.length})`;
        compareBtn.disabled = false;
        
        // Add remove button listeners
        list.querySelectorAll('.remove-from-comparison').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const planetId = e.target.dataset.planetId;
                this.togglePlanetInComparison(planetId);
            });
        });
    }
    
    showComparison() {
        if (this.currentComparison.length < 2) {
            alert('Please select at least 2 planets to compare');
            return;
        }
        
        // Get planet data
        const planets = this.currentComparison.map(id => {
            const card = document.querySelector(`[data-kepid="${id}"]`);
            return this.getPlanetData(card);
        });
        
        // Create comparison view
        this.createComparisonView(planets);
        
        // Save to history
        this.saveComparison(planets);
    }
    
    createComparisonView(planets) {
        // Create or update comparison modal
        let modal = document.getElementById('comparison-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'comparison-modal';
            modal.className = 'comparison-modal';
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.98);
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 10px;
                padding: 2rem;
                z-index: 10001;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                color: white;
            `;
            document.body.appendChild(modal);
        }
        
        // Create comparison table
        const properties = ['name', 'distance', 'radius', 'mass', 'orbitalPeriod', 'temperature', 'discoveryYear', 'status'];
        
        let tableHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                <h2 style="color: #ba944f; margin: 0;">Planet Comparison</h2>
                <button id="close-comparison-modal" style="background: none; border: none; color: white; font-size: 1.5rem; cursor: pointer;">×</button>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 0.75rem; text-align: left; border-bottom: 2px solid rgba(186,148,79,0.5); color: #ba944f;">Property</th>
                            ${planets.map((p, i) => `
                                <th style="padding: 0.75rem; text-align: center; border-bottom: 2px solid rgba(186,148,79,0.5); color: #ba944f;">
                                    ${p.name || `Planet ${i + 1}`}
                                </th>
                            `).join('')}
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        properties.forEach(prop => {
            const propLabel = this.getPropertyLabel(prop);
            tableHTML += `
                <tr>
                    <td style="padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); font-weight: bold;">${propLabel}</td>
                    ${planets.map(planet => {
                        const value = planet[prop] || planet[this.getPropertyKey(prop)] || 'N/A';
                        return `<td style="padding: 0.75rem; border-bottom: 1px solid rgba(255,255,255,0.1); text-align: center;">${value}</td>`;
                    }).join('')}
                </tr>
            `;
        });
        
        tableHTML += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: flex-end;">
                <button id="export-comparison" style="padding: 0.75rem 1.5rem; background: rgba(186,148,79,0.2); border: 1px solid rgba(186,148,79,0.5); border-radius: 5px; color: #ba944f; cursor: pointer;">
                    Export Comparison
                </button>
            </div>
        `;
        
        modal.innerHTML = tableHTML;
        modal.style.display = 'block';
        
        // Event listeners
        document.getElementById('close-comparison-modal').addEventListener('click', () => {
            modal.style.display = 'none';
        });
        
        document.getElementById('export-comparison').addEventListener('click', () => {
            this.exportComparison(planets);
        });
    }
    
    getPlanetData(card) {
        if (!card) return {};
        
        return {
            name: card.dataset.name || card.querySelector('.planet-name')?.textContent || 'Unknown',
            distance: card.dataset.distance || null,
            radius: card.dataset.radius || null,
            mass: card.dataset.mass || null,
            orbitalPeriod: card.dataset.orbitalPeriod || card.dataset.period || null,
            temperature: card.dataset.temperature || null,
            discoveryYear: card.dataset.discoveryYear || card.dataset.year || null,
            status: card.dataset.status || null
        };
    }
    
    getPropertyLabel(prop) {
        const labels = {
            'name': 'Name',
            'distance': 'Distance (ly)',
            'radius': 'Radius (Earth)',
            'mass': 'Mass (Earth)',
            'orbitalPeriod': 'Orbital Period (days)',
            'temperature': 'Temperature (K)',
            'discoveryYear': 'Discovery Year',
            'status': 'Status'
        };
        return labels[prop] || prop;
    }
    
    getPropertyKey(prop) {
        const keys = {
            'orbitalPeriod': 'period',
            'discoveryYear': 'year'
        };
        return keys[prop] || prop;
    }
    
    saveComparison(planets) {
        const comparison = {
            id: `comparison-${Date.now()}`,
            planets: planets,
            timestamp: Date.now()
        };
        
        this.comparisons.push(comparison);
        
        // Keep only last 50 comparisons
        if (this.comparisons.length > 50) {
            this.comparisons = this.comparisons.slice(-50);
        }
        
        this.saveComparisons();
    }
    
    loadComparisons() {
        try {
            const saved = localStorage.getItem('planet-comparisons');
            if (saved) {
                this.comparisons = JSON.parse(saved);
            }
        } catch (e) {
            console.warn('Failed to load comparisons:', e);
        }
    }
    
    saveComparisons() {
        try {
            localStorage.setItem('planet-comparisons', JSON.stringify(this.comparisons));
        } catch (e) {
            console.warn('Failed to save comparisons:', e);
        }
    }
    
    exportComparison(planets) {
        // Export as CSV
        const headers = ['Property', ...planets.map(p => p.name || 'Planet')];
        const rows = [];
        
        const properties = ['distance', 'radius', 'mass', 'orbitalPeriod', 'temperature', 'discoveryYear'];
        
        properties.forEach(prop => {
            const row = [this.getPropertyLabel(prop)];
            planets.forEach(planet => {
                const value = planet[prop] || planet[this.getPropertyKey(prop)] || 'N/A';
                row.push(value);
            });
            rows.push(row);
        });
        
        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `planet-comparison-${Date.now()}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }
    
    clearComparison() {
        this.currentComparison = [];
        this.updateComparisonPanel();
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.planetComparisonEnhancements = new PlanetComparisonEnhancements();
    });
} else {
    window.planetComparisonEnhancements = new PlanetComparisonEnhancements();
}

