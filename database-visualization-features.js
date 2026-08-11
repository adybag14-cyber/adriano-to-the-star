/* global Planet3DViewer */

// Database Visualization Features
// Includes: Planet size comparison, discovery timeline

class DatabaseVisualizationFeatures {
    constructor(databaseInstance) {
        this.db = databaseInstance;
        this.init();
    }

    init() {
        this.createSizeComparisonTool();
        this.createTimelineVisualization();
        this.trackEvent('db_viz_features_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_viz_features_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    // Interactive planet size comparison
    createSizeComparisonTool() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const comparisonHTML = `
            <div style="margin-bottom: 1.5rem; text-align: right;">
                <button id="size-comparison-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; margin-left: 0.5rem;">
                    📏 Size Comparison
                </button>
            </div>
        `;

        const filterButtons = document.getElementById('filter-buttons');
        const compareBtn = document.getElementById('compare-planets-btn');

        if (compareBtn) {
            compareBtn.insertAdjacentHTML('afterend', comparisonHTML);
        } else if (filterButtons) {
            // Append to filter buttons container if specific button not found
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = comparisonHTML;
            filterButtons.appendChild(tempDiv.firstElementChild);
        }

        const sizeBtn = document.getElementById('size-comparison-btn');
        if (sizeBtn) {
            sizeBtn.addEventListener('click', () => {
                this.showSizeComparison();
            });
        }
    }

    showSizeComparison() {
        if (!window.databaseAdvancedFeatures || window.databaseAdvancedFeatures.comparisonList.length === 0) {
            alert('Please select planets for comparison first (click ⚖️ on planets)');
            return;
        }

        const planets = window.databaseAdvancedFeatures.comparisonList.map(kepid =>
            this.db.allData.find(p => p.kepid === kepid)
        ).filter(p => p && p.radius);

        if (planets.length === 0) {
            alert('No planets with radius data selected');
            return;
        }

        // Find max radius for scaling
        const maxRadius = Math.max(...planets.map(p => p.radius || 1));
        const earthRadius = 1; // Earth = 1

        const modal = document.createElement('div');
        modal.id = 'size-comparison-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); z-index: 10000; overflow-y: auto; padding: 2rem;';

        const planetsHTML = planets.map(planet => {
            const radius = planet.radius || 1;
            const scale = (radius / maxRadius) * 300; // Max 300px
            const earthScale = (earthRadius / maxRadius) * 300;

            return `
                <div style="text-align: center; margin: 2rem 0;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem;">${planet.kepler_name || planet.kepoi_name || `KOI-${planet.kepid}`}</h3>
                    <div style="display: flex; align-items: flex-end; justify-content: center; gap: 2rem; margin: 2rem 0;">
                        <div style="text-align: center;">
                            <div style="width: ${earthScale}px; height: ${earthScale}px; background: linear-gradient(135deg, #4a90e2, #2e5c8a); border-radius: 50%; margin: 0 auto; box-shadow: 0 0 20px rgba(74, 144, 226, 0.5);"></div>
                            <div style="margin-top: 0.5rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">Earth (1x)</div>
                        </div>
                        <div style="text-align: center;">
                            <div style="width: ${scale}px; height: ${scale}px; background: linear-gradient(135deg, #ba944f, #8b6f3d); border-radius: 50%; margin: 0 auto; box-shadow: 0 0 30px rgba(186, 148, 79, 0.6);"></div>
                            <div style="margin-top: 0.5rem; color: #ba944f; font-weight: 600;">${radius.toFixed(2)}x Earth</div>
                        </div>
                    </div>
                    <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem;">
                        ${planet.type || 'Unknown'} • ${planet.radius ? planet.radius.toFixed(2) : 'N/A'}x Earth radius
                    </div>
                </div>
            `;
        }).join('');

        modal.innerHTML = `
            <div style="max-width: 1200px; margin: 0 auto; background: rgba(0, 0, 0, 0.8); border: 2px solid #ba944f; border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f; margin: 0;">📏 Planet Size Comparison</h2>
                    <button onclick="document.getElementById('size-comparison-modal').remove()" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div style="text-align: center; margin-bottom: 2rem; color: rgba(255, 255, 255, 0.8);">
                    <p>Visual comparison of planet sizes relative to Earth</p>
                </div>
                ${planetsHTML}
                <div style="margin-top: 2rem; text-align: center;">
                    <button onclick="document.getElementById('size-comparison-modal').remove()" style="padding: 0.75rem 2rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
            `;
        document.body.appendChild(modal);
    }

    // Planet discovery timeline visualization
    createTimelineVisualization() {
        const container = document.getElementById('nasa-data-container');
        if (!container) return;

        const timelineHTML = `
            <div style="margin-bottom: 1.5rem; text-align: right;">
                <button id="timeline-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; margin-left: 0.5rem;">
                    📅 Discovery Timeline
                </button>
                <button id="view-3d-btn" style="background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: #ba944f; padding: 0.75rem 1.5rem; border-radius: 10px; cursor: pointer; font-weight: 600; margin-left: 0.5rem;">
                    🪐 View in 3D
                </button>
            </div>
            `;

        const sizeBtn = document.getElementById('size-comparison-btn');
        if (sizeBtn) {
            sizeBtn.insertAdjacentHTML('afterend', timelineHTML);
        }

        const timelineBtn = document.getElementById('timeline-btn');
        if (timelineBtn) {
            timelineBtn.addEventListener('click', () => {
                this.showTimeline();
            });
        }

        const view3dBtn = document.getElementById('view-3d-btn');
        if (view3dBtn) {
            view3dBtn.addEventListener('click', () => {
                this.show3DViewer();
            });
        }
    }

    show3DViewer() {
        if (!window.databaseAdvancedFeatures || window.databaseAdvancedFeatures.comparisonList.length === 0) {
            alert('Please select a planet first (click ⚖️ on a planet)');
            return;
        }

        // Get the last selected planet
        const kepid = window.databaseAdvancedFeatures.comparisonList[window.databaseAdvancedFeatures.comparisonList.length - 1];
        const planet = this.db.allData.find(p => p.kepid === kepid);

        if (!planet) {
            alert('Planet data not found');
            return;
        }

        if (!window.planet3DViewer) {
            window.planet3DViewer = new Planet3DViewer();
        }
        window.planet3DViewer.visualizePlanet(planet);
    }

    showTimeline() {
        if (!this.db || !this.db.allData) return;

        // Group planets by discovery year
        const byYear = {};
        this.db.allData.forEach(planet => {
            const year = planet.disc_year || 'Unknown';
            if (!byYear[year]) {
                byYear[year] = [];
            }
            byYear[year].push(planet);
        });

        const years = Object.keys(byYear).sort((a, b) => {
            if (a === 'Unknown') return 1;
            if (b === 'Unknown') return -1;
            return parseInt(a) - parseInt(b);
        });

        const timelineHTML = years.map(year => {
            const planets = byYear[year];
            const count = planets.length;
            const confirmed = planets.filter(p => {
                const s = (p.status || '').toUpperCase();
                return s.includes('CONFIRMED') || p.status === 'Confirmed Planet';
            }).length;

            return `
                <div class="timeline-item" style="display: flex; align-items: center; margin: 1.5rem 0; padding: 1rem; background: rgba(0, 0, 0, 0.4); border-left: 4px solid #ba944f; border-radius: 8px;">
                    <div style="min-width: 100px; font-size: 1.5rem; font-weight: bold; color: #ba944f; text-align: center;">
                        ${year}
                    </div>
                    <div style="flex: 1; margin-left: 1.5rem;">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <div style="font-size: 1.2rem; font-weight: 600; color: white;">
                                ${count.toLocaleString()} Planet${count !== 1 ? 's' : ''} Discovered
                            </div>
                            <div style="color: rgba(255, 255, 255, 0.7);">
                                ${confirmed} Confirmed
                            </div>
                        </div>
                        <div style="width: 100%; height: 8px; background: rgba(186, 148, 79, 0.2); border-radius: 4px; overflow: hidden;">
                            <div style="width: ${(confirmed / count) * 100}%; height: 100%; background: linear-gradient(90deg, #4ade80, #22d3ee); transition: width 0.5s ease;"></div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        const modal = document.createElement('div');
        modal.id = 'timeline-modal';
        modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.95); z-index: 10000; overflow-y: auto; padding: 2rem;';
        modal.innerHTML = `
            <div style="max-width: 1000px; margin: 0 auto; background: rgba(0, 0, 0, 0.8); border: 2px solid #ba944f; border-radius: 15px; padding: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2 style="color: #ba944f; margin: 0;">📅 Planet Discovery Timeline</h2>
                    <button onclick="document.getElementById('timeline-modal').remove()" style="background: transparent; border: none; color: white; font-size: 2rem; cursor: pointer;">×</button>
                </div>
                <div style="text-align: center; margin-bottom: 2rem; color: rgba(255, 255, 255, 0.8);">
                    <p>Timeline of exoplanet discoveries from the Kepler mission</p>
                </div>
                <div style="max-height: 600px; overflow-y: auto; padding-right: 1rem;">
                    ${timelineHTML}
                </div>
                <div style="margin-top: 2rem; text-align: center;">
                    <button onclick="document.getElementById('timeline-modal').remove()" style="padding: 0.75rem 2rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); color: white; border-radius: 10px; cursor: pointer;">
                        Close
                    </button>
                </div>
            </div>
            `;
        document.body.appendChild(modal);
    }
}

// Initialize when database is ready
if (typeof window !== 'undefined') {
    console.log('📜 Database Visualization Features script loaded');

    const initVis = () => {
        const container = document.getElementById('nasa-data-container');
        if (window.databaseInstance && container) {
            console.log('🚀 Initializing Database Visualization Features...');
            window.databaseVisualizationFeatures = new DatabaseVisualizationFeatures(window.databaseInstance);

            // Initial creation of buttons
            window.databaseVisualizationFeatures.createSizeComparisonTool();
            window.databaseVisualizationFeatures.createTimelineVisualization();

            // Initialize WebGPU Renderer
            try {
                if (typeof window.WebGPURenderer !== 'undefined') {
                    // Create main overlay canvas if needed
                    const canvasId = 'webgpu-canvas';
                    const container = document.getElementById('3d-container'); // Try to find 3D container

                    if (container) {
                        // Check if canvas exists
                        let canvas = document.getElementById(canvasId);
                        if (!canvas) {
                            canvas = document.createElement('canvas');
                            canvas.id = canvasId;
                            canvas.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 5; pointer-events: none;';
                            container.appendChild(canvas);
                        }

                        window.webgpuRenderer = new window.WebGPURenderer();
                        window.webgpuRenderer.init(canvasId);
                    }
                }
            } catch (e) { console.warn('WebGPU Renderer init failed:', e); }

            // Initialize SETI Citizen Science Worker
            try {
                if (window.Worker) {
                    this.setiWorker = new Worker('citizen-science-worker.js');
                    this.setiWorker.onmessage = (e) => {
                        if (e.data.type === 'ANALYSIS_COMPLETE') {
                            const { data, stats } = e.data;
                            // Update UI if exists, or log
                            if (data.success) {
                                console.log(`📡 SETI: ${data.message} (+${data.scienceValue} Science)`);
                                // Could trigger a toast here
                                if (window.showNotification) window.showNotification(`📡 Signal Detected! +${data.scienceValue} Science`);
                            }

                            // Validating "Science" accumulation
                            // Store in a global for economy usage later
                            if (!window.playerScience) window.playerScience = 0;
                            window.playerScience = stats.totalScience;
                        }
                    };

                    this.setiWorker.postMessage({ type: 'START_SETI' });
                    console.log('📡 Main: Project SETI Worker launched');
                }
            } catch (e) {
                console.warn('Failed to start SETI Worker:', e);
            }

            // Initialize Systems (Gracefully)
            try {
                if (typeof window.GalacticEventsManager === 'function' && !window.galacticEventsManager) {
                    window.galacticEventsManager = new window.GalacticEventsManager();
                }

                // Placeholder initializations - only if classes exist
                const safeInit = (name, className) => {
                    if (typeof window[className] === 'function' && !window[name]) {
                        try {
                            window[name] = new window[className]();
                        } catch (e) {
                            console.warn(`Failed to initialize ${className}:`, e);
                        }
                    }
                };

                safeInit('anomalyResearchSystem', 'AnomalyResearchSystem');
                safeInit('colonyGovernanceSystem', 'ColonyGovernanceSystem');
                safeInit('economySystem', 'EconomySystem');
                safeInit('tacticalCombatSystem', 'TacticalCombatSystem');
                safeInit('groundWarfareSystem', 'GroundWarfareSystem');
                safeInit('diplomacySystem', 'DiplomacySystem');
                safeInit('megastructuresSystem', 'MegastructuresSystem');
                safeInit('ascensionSystem', 'AscensionSystem');
                safeInit('galacticCouncilSystem', 'GalacticCouncilSystem');

            } catch (error) {
                console.warn('Visualization feature initialization partial failure:', error);
            }

            // Game Loop for updates
            setInterval(() => {
                if (window.galacticEventsManager && typeof window.galacticEventsManager.simulateStep === 'function') {
                    // It handles its own loop, but we can hook visuals here if needed
                }

                ['colonyGovernanceSystem', 'economySystem', 'tacticalCombatSystem', 'groundWarfareSystem', 'megastructuresSystem']
                    .forEach(sys => {
                        if (window[sys] && typeof window[sys].update === 'function') {
                            window[sys].update();
                        }
                    });
            }, 1000 / 60);

            // Use MutationObserver to ensure buttons persist after re-renders
            const observer = new MutationObserver((mutations) => {
                const filterButtons = document.getElementById('filter-buttons');
                // Check if buttons are missing and filter container exists
                if (filterButtons && (!document.getElementById('size-comparison-btn') || !document.getElementById('timeline-btn'))) {
                    console.log('🔄 Re-adding visualization buttons...');
                    window.databaseVisualizationFeatures.createSizeComparisonTool();
                    window.databaseVisualizationFeatures.createTimelineVisualization();
                }
            });

            observer.observe(container, { childList: true, subtree: true });
        } else {
            console.log('⏳ Waiting for database and UI... (db:', !!window.databaseInstance, ', container:', !!container, ')');
            setTimeout(initVis, 1000);
        }
    };

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', initVis);
    } else {
        // DOM is already ready
        initVis();
    }
}
