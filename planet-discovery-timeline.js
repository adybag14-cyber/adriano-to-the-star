/**
 * Planet Discovery Timeline Visualization
 * Shows timeline of exoplanet discoveries
 */

class PlanetDiscoveryTimeline {
    constructor() {
        this.discoveries = [];
        this.init();
    }

    async init() {
        this.trackEvent('p_la_ne_td_is_co_ve_ry_ti_me_li_ne_initialized');
        await this.loadDiscoveryData();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ti_me_li_ne_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Load discovery data
     */
    async loadDiscoveryData() {
        // In production, this would fetch from NASA API or database
        // For now, we'll use sample data organized by year
        this.discoveries = [
            { year: 1992, count: 2, notable: 'First exoplanets discovered' },
            { year: 1995, count: 1, notable: '51 Pegasi b - first planet around Sun-like star' },
            { year: 2000, count: 25, notable: 'Kepler mission planning begins' },
            { year: 2009, count: 150, notable: 'Kepler Space Telescope launches' },
            { year: 2011, count: 500, notable: 'Kepler discovers first Earth-sized planets' },
            { year: 2014, count: 1000, notable: 'Kepler confirms 1000th exoplanet' },
            { year: 2018, count: 3800, notable: 'Kepler mission ends, TESS launches' },
            { year: 2020, count: 4300, notable: 'TESS discovers first Earth-sized planet in habitable zone' },
            { year: 2023, count: 5500, notable: 'James Webb Telescope begins exoplanet observations' },
            { year: 2024, count: 6000, notable: 'Current total: 6000+ confirmed exoplanets' }
        ];
    }

    /**
     * Display timeline
     */
    displayTimeline(container) {
        if (!container) return;

        const maxCount = Math.max(...this.discoveries.map(d => d.count));

        container.innerHTML = `
            <div class="discovery-timeline-container" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                <div class="timeline-header" style="margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin: 0 0 0.5rem 0;">📅 Exoplanet Discovery Timeline</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin: 0;">Visualization of exoplanet discoveries over time</p>
                </div>

                <div class="timeline-visualization" style="position: relative; padding: 2rem 0;">
                    ${this.discoveries.map((discovery, index) => {
                        const width = (discovery.count / maxCount) * 100;
                        const isRecent = discovery.year >= 2020;
                        
                        return `
                            <div class="timeline-item" style="margin-bottom: 2rem; position: relative; padding-left: 4rem;">
                                <div class="timeline-year" style="position: absolute; left: 0; top: 0; width: 3rem; text-align: right; color: #ba944f; font-weight: 600; font-size: 1.1rem;">${discovery.year}</div>
                                <div class="timeline-content" style="background: rgba(186, 148, 79, 0.1); border-left: 3px solid ${isRecent ? '#4ade80' : '#ba944f'}; border-radius: 6px; padding: 1rem;">
                                    <div class="timeline-bar" style="background: linear-gradient(90deg, ${isRecent ? '#4ade80' : '#ba944f'} 0%, ${isRecent ? '#4ade80' : '#ba944f'} ${width}%, transparent ${width}%); height: 30px; border-radius: 4px; margin-bottom: 0.75rem; display: flex; align-items: center; padding: 0 1rem;">
                                        <span style="color: white; font-weight: 600; font-size: 0.9rem;">${discovery.count.toLocaleString()} planets</span>
                                    </div>
                                    <div class="timeline-notable" style="color: #e0e0e0; font-size: 0.95rem; line-height: 1.6;">
                                        ${discovery.notable}
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>

                <div class="timeline-stats" style="margin-top: 2rem; padding: 1.5rem; background: rgba(186, 148, 79, 0.1); border-radius: 10px;">
                    <h4 style="color: #ba944f; margin: 0 0 1rem 0;">📊 Statistics</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                        <div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">Total Discoveries</div>
                            <div style="color: #ba944f; font-size: 1.5rem; font-weight: 600;">${this.discoveries[this.discoveries.length - 1].count.toLocaleString()}+</div>
                        </div>
                        <div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">Years Tracked</div>
                            <div style="color: #ba944f; font-size: 1.5rem; font-weight: 600;">${this.discoveries[this.discoveries.length - 1].year - this.discoveries[0].year + 1}</div>
                        </div>
                        <div>
                            <div style="color: rgba(255, 255, 255, 0.7); font-size: 0.9rem; margin-bottom: 0.25rem;">Average per Year</div>
                            <div style="color: #ba944f; font-size: 1.5rem; font-weight: 600;">${Math.round(this.discoveries[this.discoveries.length - 1].count / (this.discoveries[this.discoveries.length - 1].year - this.discoveries[0].year + 1))}</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

// Initialize planet discovery timeline
if (typeof window !== 'undefined') {
    window.PlanetDiscoveryTimeline = PlanetDiscoveryTimeline;
    window.planetDiscoveryTimeline = new PlanetDiscoveryTimeline();
}

