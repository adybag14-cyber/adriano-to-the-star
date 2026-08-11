/**
 * Planet Discovery Health Check Endpoint
 * Client-side health check monitoring and status display
 */

class PlanetDiscoveryHealthCheck {
    constructor() {
        this.healthStatus = {
            api: 'unknown',
            database: 'unknown',
            storage: 'unknown',
            overall: 'unknown'
        };
        this.lastCheck = null;
        this.checkInterval = 60000; // 1 minute
        this.init();
    }

    init() {
        this.performHealthCheck();
        this.setupPeriodicChecks();
        console.log('🏥 Health check initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_he_al_th_ch_ec_k_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async performHealthCheck() {
        const checks = {
            api: await this.checkAPI(),
            database: await this.checkDatabase(),
            storage: await this.checkStorage()
        };

        this.healthStatus = {
            ...checks,
            overall: this.calculateOverallHealth(checks)
        };

        this.lastCheck = new Date();
        this.onHealthCheckComplete(this.healthStatus);
    }

    async checkAPI() {
        try {
            // Check if Supabase is accessible
            if (typeof supabase !== 'undefined' && supabase) {
                const startTime = Date.now();
                const { error } = await supabase.from('health_check').select('count').limit(1);
                const responseTime = Date.now() - startTime;

                if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is OK
                    return { status: 'unhealthy', error: error.message, responseTime };
                }

                return { 
                    status: responseTime < 1000 ? 'healthy' : 'degraded', 
                    responseTime 
                };
            }
            return { status: 'unknown', error: 'Supabase not available' };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkDatabase() {
        try {
            if (typeof supabase !== 'undefined' && supabase) {
                const startTime = Date.now();
                // Try a simple query
                const { error } = await supabase.from('planet_claims').select('count').limit(1);
                const responseTime = Date.now() - startTime;

                if (error) {
                    return { status: 'unhealthy', error: error.message, responseTime };
                }

                return { 
                    status: responseTime < 2000 ? 'healthy' : 'degraded', 
                    responseTime 
                };
            }
            return { status: 'unknown', error: 'Supabase not available' };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    async checkStorage() {
        try {
            // Check localStorage
            const testKey = '__health_check__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);

            // Check IndexedDB if available
            if ('indexedDB' in window) {
                return { status: 'healthy' };
            }

            return { status: 'healthy' };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }

    calculateOverallHealth(checks) {
        const statuses = Object.values(checks).map(c => c.status);
        
        if (statuses.every(s => s === 'healthy')) {
            return 'healthy';
        } else if (statuses.some(s => s === 'unhealthy')) {
            return 'unhealthy';
        } else {
            return 'degraded';
        }
    }

    setupPeriodicChecks() {
        setInterval(() => {
            this.performHealthCheck();
        }, this.checkInterval);
    }

    onHealthCheckComplete(status) {
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('health-check-complete', {
            detail: status
        }));

        // Log if unhealthy
        if (status.overall === 'unhealthy') {
            console.error('Health check failed:', status);
        }
    }

    getHealthStatus() {
        return { ...this.healthStatus, lastCheck: this.lastCheck };
    }

    renderHealthCheckPanel(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const status = this.getHealthStatus();
        const overallColor = {
            healthy: '#4ade80',
            degraded: '#f59e0b',
            unhealthy: '#ef4444',
            unknown: '#6b7280'
        }[status.overall] || '#6b7280';

        container.innerHTML = `
            <div class="health-check-panel" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
                    <h3 style="color: #ba944f; margin: 0;">🏥 System Health</h3>
                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        <div style="width: 12px; height: 12px; background: ${overallColor}; border-radius: 50%;"></div>
                        <span style="color: ${overallColor}; font-weight: bold; text-transform: capitalize;">${status.overall}</span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${this.renderHealthItem('API', status.api)}
                    ${this.renderHealthItem('Database', status.database)}
                    ${this.renderHealthItem('Storage', status.storage)}
                </div>
                ${status.lastCheck ? `
                    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(186, 148, 79, 0.2);">
                        <p style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem; margin: 0;">
                            Last checked: ${status.lastCheck.toLocaleTimeString()}
                        </p>
                    </div>
                ` : ''}
                <button id="refresh-health-check-btn" style="margin-top: 1rem; width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                    Refresh Health Check
                </button>
            </div>
        `;

        document.getElementById('refresh-health-check-btn')?.addEventListener('click', () => {
            this.performHealthCheck();
            setTimeout(() => this.renderHealthCheckPanel(containerId), 1000);
        });
    }

    renderHealthItem(name, status) {
        const color = {
            healthy: '#4ade80',
            degraded: '#f59e0b',
            unhealthy: '#ef4444',
            unknown: '#6b7280'
        }[status.status] || '#6b7280';

        return `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: rgba(0, 0, 0, 0.3); border-radius: 10px;">
                <span style="color: rgba(255, 255, 255, 0.9);">${name}</span>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 10px; height: 10px; background: ${color}; border-radius: 50%;"></div>
                    <span style="color: ${color}; text-transform: capitalize; font-size: 0.9rem;">${status.status}</span>
                    ${status.responseTime ? `
                        <span style="color: rgba(255, 255, 255, 0.7); font-size: 0.85rem;">(${status.responseTime}ms)</span>
                    ` : ''}
                </div>
            </div>
        `;
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryHealthCheck = new PlanetDiscoveryHealthCheck();
}

