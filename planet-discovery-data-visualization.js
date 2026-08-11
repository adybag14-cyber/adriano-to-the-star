/**
 * Planet Discovery Data Visualization Library
 * Library of visualization components for planet data
 */

class PlanetDiscoveryDataVisualization {
    constructor() {
        this.charts = [];
        this.visualizations = [];
        this.init();
    }

    init() {
        this.loadVisualizations();
        console.log('📊 Data visualization library initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_da_ta_vi_su_al_iz_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadVisualizations() {
        this.visualizations = [
            {
                id: 'viz-1',
                name: 'Planet Size Distribution',
                type: 'bar',
                description: 'Visualize distribution of planet sizes'
            },
            {
                id: 'viz-2',
                name: 'Orbital Period vs Distance',
                type: 'scatter',
                description: 'Scatter plot of orbital periods vs distance from star'
            },
            {
                id: 'viz-3',
                name: 'Discovery Timeline',
                type: 'line',
                description: 'Timeline of planet discoveries over time'
            },
            {
                id: 'viz-4',
                name: 'Habitable Zone Map',
                type: 'heatmap',
                description: 'Heat map showing planets in habitable zones'
            }
        ];
    }

    renderVisualizationLibrary(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        let html = `
            <div class="visualization-library-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">📊 Data Visualization Library</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-bottom: 2rem;">
                    <p style="opacity: 0.9; line-height: 1.8; margin-bottom: 1rem;">
                        Create interactive visualizations of planet discovery data. Choose from various chart types and customize your visualizations.
                    </p>
                    <button id="create-visualization-btn" style="padding: 0.75rem 1.5rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                        ➕ Create Visualization
                    </button>
                </div>
                
                <div class="visualizations-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 2rem;">
        `;

        this.visualizations.forEach(viz => {
            html += this.createVisualizationCard(viz);
        });

        html += `
                </div>
            </div>
        `;

        container.innerHTML = html;

        // Event listeners
        this.visualizations.forEach(viz => {
            const card = document.querySelector(`[data-viz-id="${viz.id}"]`);
            if (card) {
                card.addEventListener('click', () => {
                    this.showVisualization(viz.id);
                });
            }
        });

        document.getElementById('create-visualization-btn')?.addEventListener('click', () => {
            this.showCreateVisualizationForm();
        });
    }

    createVisualizationCard(viz) {
        const icons = {
            'bar': '📊',
            'scatter': '🔵',
            'line': '📈',
            'heatmap': '🔥',
            'pie': '🥧'
        };

        return `
            <div class="visualization-card" data-viz-id="${viz.id}" style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(20, 20, 30, 0.9)); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; cursor: pointer; transition: all 0.3s ease;">
                <div style="text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">${icons[viz.type] || '📊'}</div>
                    <h4 style="color: #ba944f; margin-bottom: 0.5rem;">${viz.name}</h4>
                    <p style="opacity: 0.8; font-size: 0.9rem; margin-bottom: 1rem;">${viz.description}</p>
                    <div style="background: rgba(186, 148, 79, 0.1); padding: 0.5rem; border-radius: 8px; font-size: 0.85rem; color: #ba944f; text-transform: capitalize;">
                        ${viz.type} Chart
                    </div>
                </div>
            </div>
        `;
    }

    showVisualization(vizId) {
        const viz = this.visualizations.find(v => v.id === vizId);
        if (!viz) return;

        const modal = document.createElement('div');
        modal.id = 'visualization-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            overflow-y: auto;
            padding: 2rem;
        `;

        modal.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f;">${viz.name}</h2>
                    <button id="close-viz-modal" style="background: transparent; border: 2px solid #ba944f; color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600;">
                        ✕ Close
                    </button>
                </div>
                
                <div style="background: rgba(0, 0, 0, 0.8); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 15px; padding: 2rem;">
                    <div id="chart-container" style="width: 100%; height: 500px; background: rgba(0, 0, 0, 0.3); border-radius: 10px; display: flex; align-items: center; justify-content: center; color: rgba(255, 255, 255, 0.7);">
                        <div style="text-align: center;">
                            <div style="font-size: 4rem; margin-bottom: 1rem;">📊</div>
                            <p>Chart visualization will be rendered here</p>
                            <p style="font-size: 0.85rem; opacity: 0.7; margin-top: 0.5rem;">${viz.description}</p>
                        </div>
                    </div>
                    
                    <div style="margin-top: 2rem; display: flex; gap: 1rem;">
                        <button id="export-chart-btn" style="flex: 1; padding: 0.75rem; background: rgba(74, 222, 128, 0.2); border: 2px solid rgba(74, 222, 128, 0.5); border-radius: 10px; color: #4ade80; cursor: pointer; font-weight: 600;">
                            📥 Export Chart
                        </button>
                        <button id="share-chart-btn" style="flex: 1; padding: 0.75rem; background: rgba(59, 130, 246, 0.2); border: 2px solid rgba(59, 130, 246, 0.5); border-radius: 10px; color: #3b82f6; cursor: pointer; font-weight: 600;">
                            📤 Share
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Render chart (would use Chart.js or similar)
        this.renderChart(viz, document.getElementById('chart-container'));

        document.getElementById('close-viz-modal').addEventListener('click', () => {
            modal.remove();
        });

        document.getElementById('export-chart-btn')?.addEventListener('click', () => {
            this.exportChart(viz);
        });

        document.getElementById('share-chart-btn')?.addEventListener('click', () => {
            this.shareChart(viz);
        });
    }

    renderChart(viz, container) {
        // Placeholder for chart rendering
        // Would integrate with Chart.js, D3.js, or similar library
        console.log(`Rendering ${viz.type} chart for ${viz.name}`);
    }

    exportChart(viz) {
        alert(`Exporting ${viz.name} chart...`);
    }

    shareChart(viz) {
        if (navigator.share) {
            navigator.share({
                title: viz.name,
                text: viz.description,
                url: window.location.href
            });
        } else {
            alert(`Share link for ${viz.name} coming soon!`);
        }
    }

    showCreateVisualizationForm() {
        if (confirm('Advanced visualization tools available in Experimental Projects. Go there?')) { window.location.href = 'projects.html'; }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryDataVisualization = new PlanetDiscoveryDataVisualization();
}


