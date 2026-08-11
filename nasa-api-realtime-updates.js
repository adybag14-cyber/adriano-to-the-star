/**
 * NASA API Real-Time Updates Integration
 * Fetches latest exoplanet discoveries and updates from NASA Exoplanet Archive
 * Provides real-time notifications for new discoveries
 */

class NASAAPIRealtimeUpdates {
    constructor() {
        this.apiBase = 'https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI';
        this.nasaApiKey = window.NASA_API_KEY || 'DEMO_KEY';
        this.updateInterval = 60 * 60 * 1000; // Check every hour
        this.lastUpdateTime = null;
        this.lastDiscoveryCount = 0;
        this.newDiscoveries = [];
        this.updateCallbacks = [];
        this.isRunning = false;
        this.init();
    }

    async init() {
        this.trackEvent('n_as_aa_pi_re_al_ti_me_up_da_te_s_initialized');

        // Load last update time from localStorage
        const saved = localStorage.getItem('nasa-last-update');
        if (saved) {
            this.lastUpdateTime = new Date(saved);
        }

        // Start periodic updates
        this.startPeriodicUpdates();

        // Initial fetch
        await this.checkForUpdates();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("n_as_aa_pi_re_al_ti_me_up_da_te_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    /**
     * Start periodic update checks
     */
    startPeriodicUpdates() {
        if (this.isRunning) return;
        this.isRunning = true;

        setInterval(async () => {
            await this.checkForUpdates();
        }, this.updateInterval);

        console.log('✅ Periodic updates started (every hour)');
    }

    /**
     * Check for new discoveries
     */
    async checkForUpdates() {
        try {
            console.log('🔍 Checking for NASA exoplanet updates...');

            // Fetch latest discoveries
            const latest = await this.fetchLatestDiscoveries();

            if (latest && latest.length > 0) {
                // Compare with last known count
                if (this.lastDiscoveryCount === 0) {
                    this.lastDiscoveryCount = latest.length;
                    this.lastUpdateTime = new Date();
                    localStorage.setItem('nasa-last-update', this.lastUpdateTime.toISOString());
                    console.log(`✅ Initial discovery count: ${latest.length}`);
                    return;
                }

                // Check for new discoveries
                const newCount = latest.length;
                if (newCount > this.lastDiscoveryCount) {
                    const newDiscoveries = latest.slice(0, newCount - this.lastDiscoveryCount);
                    this.newDiscoveries = newDiscoveries;
                    this.lastDiscoveryCount = newCount;
                    this.lastUpdateTime = new Date();
                    localStorage.setItem('nasa-last-update', this.lastUpdateTime.toISOString());

                    console.log(`🆕 Found ${newDiscoveries.length} new discoveries!`);

                    // Notify callbacks
                    this.notifyCallbacks(newDiscoveries);

                    // Show notification if enabled
                    this.showDiscoveryNotification(newDiscoveries);
                } else {
                    console.log('ℹ️ No new discoveries since last check');
                }
            }
        } catch (error) {
            // In local development, avoid noisy error logging if the external API is unreachable
            const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : '';
            if (host === 'localhost' || host === '127.0.0.1') {
                console.warn('NASAAPIRealtimeUpdates: updates unavailable in local dev environment');
            } else {
                console.error('❌ Error checking for updates:', error);
            }
        }
    }

    async fetchJSON(url, options = {}) {
        if (window.epFetchJSON) {
            return await window.epFetchJSON(url, options);
        }
        try {
            const response = await fetch(url, options);
            if (response.ok) return await response.json();
            throw new Error(`HTTP error! status: ${response.status}`);
        } catch (error) {
            const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
            const proxyRes = await fetch(proxyUrl);
            if (proxyRes.ok) {
                const data = await proxyRes.json();
                return typeof data.contents === 'string' ? JSON.parse(data.contents) : data.contents;
            }
            throw error;
        }
    }

    /**
     * Fetch latest discoveries from NASA API
     */
    async fetchLatestDiscoveries(limit = 10) {
        try {
            // Fetch most recently published planets
            const url = `${this.apiBase}?table=exoplanets&format=json&order=pl_publ_date+desc&limit=${limit}`;

            const data = await this.fetchJSON(url);

            // Format discoveries
            return data.map(planet => ({
                name: planet.pl_name || 'Unknown',
                discoveryDate: planet.pl_publ_date || null,
                discoveryMethod: planet.pl_discmethod || 'Unknown',
                mass: planet.pl_bmassj || null,
                radius: planet.pl_radj || null,
                distance: planet.st_dist || null,
                hostStar: planet.pl_hostname || 'Unknown',
                status: planet.pl_status || 'Unknown',
                nasaId: planet.pl_name || null
            }));
        } catch (error) {
            console.error('Error fetching NASA discoveries:', error);
            return [];
        }
    }

    /**
     * Fetch updates since a specific date
     */
    async fetchUpdatesSince(date) {
        try {
            const dateStr = date.toISOString().split('T')[0];
            const url = `${this.apiBase}?table=exoplanets&format=json&where=pl_publ_date>'${dateStr}'&order=pl_publ_date+desc`;

            const data = await this.fetchJSON(url);
            return data.map(planet => ({
                name: planet.pl_name || 'Unknown',
                discoveryDate: planet.pl_publ_date || null,
                discoveryMethod: planet.pl_discmethod || 'Unknown',
                mass: planet.pl_bmassj || null,
                radius: planet.pl_radj || null,
                distance: planet.st_dist || null,
                hostStar: planet.pl_hostname || 'Unknown',
                status: planet.pl_status || 'Unknown',
                nasaId: planet.pl_name || null
            }));
        } catch (error) {
            console.error('Error fetching updates since date:', error);
            return [];
        }
    }

    /**
     * Register callback for updates
     */
    onUpdate(callback) {
        this.updateCallbacks.push(callback);
    }

    /**
     * Notify all registered callbacks
     */
    notifyCallbacks(discoveries) {
        this.updateCallbacks.forEach(callback => {
            try {
                callback(discoveries, this);
            } catch (error) {
                console.error('Error in update callback:', error);
            }
        });
    }

    /**
     * Show discovery notification
     */
    showDiscoveryNotification(discoveries) {
        // Check if notifications are enabled
        const notificationsEnabled = localStorage.getItem('nasa-notifications-enabled') !== 'false';
        if (!notificationsEnabled) return;

        // Create notification element
        const notification = document.createElement('div');
        notification.className = 'nasa-discovery-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <span class="notification-icon">🆕</span>
                    <h4>New Exoplanet Discoveries!</h4>
                    <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
                </div>
                <div class="notification-body">
                    <p>${discoveries.length} new ${discoveries.length === 1 ? 'planet has' : 'planets have'} been discovered!</p>
                    <div class="discoveries-list">
                        ${discoveries.slice(0, 3).map(d => `
                            <div class="discovery-item">
                                <strong>${this.escapeHtml(d.name)}</strong>
                                ${d.discoveryMethod ? `<span class="discovery-method">${this.escapeHtml(d.discoveryMethod)}</span>` : ''}
                            </div>
                        `).join('')}
                    </div>
                    ${discoveries.length > 3 ? `<p class="more-discoveries">+${discoveries.length - 3} more discoveries</p>` : ''}
                </div>
                <div class="notification-actions">
                    <button class="btn-view" onclick="window.nasaRealtimeUpdates.viewDiscoveries()">View All</button>
                    <button class="btn-dismiss" onclick="this.closest('.nasa-discovery-notification').remove()">Dismiss</button>
                </div>
            </div>
        `;

        // Inject styles if not already present
        this.injectNotificationStyles();

        // Add to page
        document.body.appendChild(notification);

        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 10000);
    }

    /**
     * View all discoveries
     */
    viewDiscoveries() {
        // Create modal or navigate to discoveries page
        const modal = document.createElement('div');
        modal.className = 'nasa-discoveries-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>🆕 New Exoplanet Discoveries</h2>
                    <button class="modal-close" onclick="this.closest('.nasa-discoveries-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${this.newDiscoveries.map(d => `
                        <div class="discovery-card">
                            <h3>${this.escapeHtml(d.name)}</h3>
                            <div class="discovery-details">
                                ${d.discoveryDate ? `<p><strong>Discovery Date:</strong> ${new Date(d.discoveryDate).toLocaleDateString()}</p>` : ''}
                                ${d.discoveryMethod ? `<p><strong>Method:</strong> ${this.escapeHtml(d.discoveryMethod)}</p>` : ''}
                                ${d.hostStar ? `<p><strong>Host Star:</strong> ${this.escapeHtml(d.hostStar)}</p>` : ''}
                                ${d.distance ? `<p><strong>Distance:</strong> ${d.distance.toFixed(2)} light-years</p>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.injectModalStyles();
    }

    /**
     * Get statistics
     */
    async getStatistics() {
        try {
            const url = `${this.apiBase}?table=exoplanets&format=json&select=count(*)`;
            const response = await fetch(url);
            const data = await response.json();

            return {
                totalPlanets: data[0]?.count || 0,
                lastUpdate: this.lastUpdateTime,
                newDiscoveries: this.newDiscoveries.length
            };
        } catch (error) {
            console.error('Error fetching statistics:', error);
            return null;
        }
    }

    /**
     * Inject notification styles
     */
    injectNotificationStyles() {
        if (document.getElementById('nasa-notification-styles')) return;

        const style = document.createElement('style');
        style.id = 'nasa-notification-styles';
        style.textContent = `
            .nasa-discovery-notification {
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 15px;
                padding: 1.5rem;
                max-width: 400px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
                animation: slideInRight 0.3s ease;
            }

            @keyframes slideInRight {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            .notification-header {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }

            .notification-icon {
                font-size: 1.5rem;
            }

            .notification-header h4 {
                color: #ba944f;
                margin: 0;
                flex: 1;
            }

            .notification-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 24px;
                height: 24px;
            }

            .notification-close:hover {
                color: #fff;
            }

            .discoveries-list {
                margin: 1rem 0;
            }

            .discovery-item {
                padding: 0.5rem;
                background: rgba(186, 148, 79, 0.1);
                border-radius: 8px;
                margin-bottom: 0.5rem;
            }

            .discovery-method {
                display: block;
                font-size: 0.85rem;
                color: rgba(255, 255, 255, 0.6);
                margin-top: 0.25rem;
            }

            .notification-actions {
                display: flex;
                gap: 0.75rem;
                margin-top: 1rem;
            }

            .btn-view, .btn-dismiss {
                flex: 1;
                padding: 0.5rem 1rem;
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 8px;
                background: rgba(186, 148, 79, 0.2);
                color: #ba944f;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s;
            }

            .btn-view:hover {
                background: rgba(186, 148, 79, 0.4);
            }

            .btn-dismiss {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
                color: rgba(255, 255, 255, 0.8);
            }

            .nasa-discoveries-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                z-index: 10001;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
            }

            .modal-content {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 15px;
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
                padding: 2rem;
            }

            .modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 2px solid rgba(186, 148, 79, 0.3);
            }

            .modal-header h2 {
                color: #ba944f;
                margin: 0;
            }

            .modal-close {
                background: none;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
            }

            .discovery-card {
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                margin-bottom: 1rem;
            }

            .discovery-card h3 {
                color: #ba944f;
                margin-top: 0;
            }

            .discovery-details p {
                margin: 0.5rem 0;
                color: rgba(255, 255, 255, 0.8);
            }
        `;

        document.head.appendChild(style);
    }

    /**
     * Inject modal styles
     */
    injectModalStyles() {
        // Styles already injected in injectNotificationStyles
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize globally
let nasaRealtimeUpdatesInstance = null;

function initNASARealtimeUpdates() {
    if (!nasaRealtimeUpdatesInstance) {
        nasaRealtimeUpdatesInstance = new NASAAPIRealtimeUpdates();
    }
    return nasaRealtimeUpdatesInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNASARealtimeUpdates);
} else {
    initNASARealtimeUpdates();
}

// Export globally
window.NASAAPIRealtimeUpdates = NASAAPIRealtimeUpdates;
window.nasaRealtimeUpdates = () => nasaRealtimeUpdatesInstance;

