/**
 * Planet Discovery Maintenance Mode
 * Display maintenance mode message and handle maintenance state
 */

class PlanetDiscoveryMaintenanceMode {
    constructor() {
        this.isMaintenanceMode = false;
        this.maintenanceMessage = 'We are currently performing maintenance. Please check back soon.';
        this.estimatedEndTime = null;
        this.init();
    }

    init() {
        this.checkMaintenanceStatus();
        console.log('🔧 Maintenance mode initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_ma_in_te_na_nc_em_od_e_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async checkMaintenanceStatus() {
        // Check from Supabase or API
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data, error } = await supabase
                    .from('maintenance_status')
                    .select('*')
                    .eq('active', true)
                    .single();

                if (!error && data) {
                    this.isMaintenanceMode = true;
                    this.maintenanceMessage = data.message || this.maintenanceMessage;
                    this.estimatedEndTime = data.estimated_end_time ? new Date(data.estimated_end_time) : null;
                    this.showMaintenanceMode();
                }
            } catch (error) {
                console.error('Error checking maintenance status:', error);
            }
        }

        // Also check localStorage for local override
        try {
            const localMaintenance = localStorage.getItem('maintenance-mode');
            if (localMaintenance === 'true') {
                this.isMaintenanceMode = true;
                this.showMaintenanceMode();
            }
        } catch (error) {
            console.error('Error checking local maintenance status:', error);
        }
    }

    showMaintenanceMode() {
        // Don't show if already displayed
        if (document.getElementById('maintenance-mode-overlay')) {
            return;
        }

        const overlay = document.createElement('div');
        overlay.id = 'maintenance-mode-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 99999;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-direction: column;
            color: white;
        `;

        const timeRemaining = this.estimatedEndTime 
            ? this.getTimeRemaining(this.estimatedEndTime)
            : null;

        overlay.innerHTML = `
            <div style="text-align: center; max-width: 600px; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🔧</div>
                <h1 style="color: #ba944f; margin-bottom: 1rem; font-size: 2rem;">Maintenance Mode</h1>
                <p style="color: rgba(255, 255, 255, 0.9); margin-bottom: 1.5rem; font-size: 1.1rem; line-height: 1.6;">
                    ${this.maintenanceMessage}
                </p>
                ${timeRemaining ? `
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem;">
                        Estimated completion: ${timeRemaining}
                    </p>
                ` : ''}
                <div style="margin-top: 2rem;">
                    <button id="refresh-page-btn" style="padding: 0.75rem 2rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600; font-size: 1rem;">
                        Refresh Page
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        // Disable scrolling
        document.body.style.overflow = 'hidden';

        document.getElementById('refresh-page-btn')?.addEventListener('click', () => {
            window.location.reload();
        });

        // Auto-refresh every 30 seconds
        setInterval(() => {
            this.checkMaintenanceStatus();
        }, 30000);
    }

    getTimeRemaining(endTime) {
        const now = new Date();
        const diff = endTime - now;

        if (diff <= 0) {
            return 'Maintenance should be complete';
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 0) {
            return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
        } else {
            return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
        }
    }

    enableMaintenanceMode(message = null, endTime = null) {
        this.isMaintenanceMode = true;
        if (message) {
            this.maintenanceMessage = message;
        }
        if (endTime) {
            this.estimatedEndTime = new Date(endTime);
        }
        this.showMaintenanceMode();
        
        try {
            localStorage.setItem('maintenance-mode', 'true');
        } catch (error) {
            console.error('Error saving maintenance mode:', error);
        }
    }

    disableMaintenanceMode() {
        this.isMaintenanceMode = false;
        const overlay = document.getElementById('maintenance-mode-overlay');
        if (overlay) {
            overlay.remove();
        }
        document.body.style.overflow = '';
        
        try {
            localStorage.removeItem('maintenance-mode');
        } catch (error) {
            console.error('Error removing maintenance mode:', error);
        }
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryMaintenanceMode = new PlanetDiscoveryMaintenanceMode();
}

