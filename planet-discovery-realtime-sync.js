/**
 * Planet Discovery Real-Time Sync
 * Real-time synchronization of planet data across clients
 */

class PlanetDiscoveryRealTimeSync {
    constructor() {
        this.socket = null;
        this.isConnected = false;
        this.listeners = new Map();
        this.init();
    }

    init() {
        this.connect();
        console.log('🔄 Real-time sync initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_re_al_ti_me_sy_nc_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    connect() {
        // Use WebSocket or Server-Sent Events for real-time sync
        // For now, simulate with polling
        if (typeof WebSocket !== 'undefined') {
            try {
                const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
                const wsUrl = `${protocol}//${window.location.host}/ws`;
                this.socket = new WebSocket(wsUrl);

                this.socket.onopen = () => {
                    this.isConnected = true;
                    console.log('WebSocket connected');
                    this.onConnect();
                };

                this.socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.socket.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    this.fallbackToPolling();
                };

                this.socket.onclose = () => {
                    this.isConnected = false;
                    console.log('WebSocket disconnected');
                    this.reconnect();
                };
            } catch (error) {
                console.warn('WebSocket not available, using polling:', error);
                this.fallbackToPolling();
            }
        } else {
            this.fallbackToPolling();
        }
    }

    fallbackToPolling() {
        // Poll for updates every 5 seconds
        setInterval(() => {
            this.checkForUpdates();
        }, 5000);
    }

    async checkForUpdates() {
        try {
            const response = await fetch('/api/sync/updates', {
                headers: {
                    'X-Client-Id': this.getClientId()
                }
            });
            const updates = await response.json();
            updates.forEach(update => this.handleMessage(update));
        } catch (error) {
            const host = (typeof window !== 'undefined' && window.location) ? window.location.hostname : '';
            if (host === 'localhost' || host === '127.0.0.1') {
                console.warn('PlanetDiscoveryRealTimeSync: updates API not available in local dev environment');
            } else {
                console.error('Error checking for updates:', error);
            }
        }
    }

    getClientId() {
        let clientId = localStorage.getItem('client-id');
        if (!clientId) {
            clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('client-id', clientId);
        }
        return clientId;
    }

    handleMessage(data) {
        const { type, payload } = data;

        // Notify listeners
        if (this.listeners.has(type)) {
            this.listeners.get(type).forEach(callback => {
                callback(payload);
            });
        }

        // Default handlers
        switch (type) {
            case 'planet.discovered':
                this.onPlanetDiscovered(payload);
                break;
            case 'planet.claimed':
                this.onPlanetClaimed(payload);
                break;
            case 'planet.updated':
                this.onPlanetUpdated(payload);
                break;
        }
    }

    onPlanetDiscovered(planet) {
        console.log('New planet discovered:', planet);
        // Trigger UI update
        if (window.planetDiscoveryNotifications) {
            window.planetDiscoveryNotifications.notifyNewDiscovery(planet);
        }
    }

    onPlanetClaimed(claim) {
        console.log('Planet claimed:', claim);
        // Trigger UI update
    }

    onPlanetUpdated(planet) {
        console.log('Planet updated:', planet);
        // Trigger UI update
    }

    onConnect() {
        // Subscribe to events
        this.subscribe('planet.discovered');
        this.subscribe('planet.claimed');
        this.subscribe('planet.updated');
    }

    subscribe(eventType) {
        if (this.socket && this.isConnected) {
            this.socket.send(JSON.stringify({
                type: 'subscribe',
                event: eventType
            }));
        }
    }

    on(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    }

    off(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    reconnect() {
        setTimeout(() => {
            console.log('Attempting to reconnect...');
            this.connect();
        }, 3000);
    }

    renderSyncStatus(containerId) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }

        container.innerHTML = `
            <div class="realtime-sync-container" style="margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🔄 Real-Time Sync</h3>
                
                <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="opacity: 0.9;">Connection Status:</span>
                        <span id="sync-status" style="color: ${this.isConnected ? '#4ade80' : '#f87171'}; font-weight: 600;">
                            ${this.isConnected ? '🟢 Connected' : '🔴 Disconnected'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span style="opacity: 0.9;">Sync Method:</span>
                        <span style="color: #ba944f; font-weight: 600;">
                            ${this.socket ? 'WebSocket' : 'Polling'}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span style="opacity: 0.9;">Client ID:</span>
                        <span style="font-family: monospace; font-size: 0.85rem; opacity: 0.7;">
                            ${this.getClientId().substring(0, 20)}...
                        </span>
                    </div>
                    
                    <div style="margin-top: 1.5rem; padding: 1rem; background: rgba(186, 148, 79, 0.1); border-radius: 8px;">
                        <p style="opacity: 0.8; font-size: 0.9rem; margin: 0;">
                            Real-time sync keeps your data up-to-date automatically. Changes made by other users will appear instantly.
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Update status periodically
        setInterval(() => {
            const statusEl = document.getElementById('sync-status');
            if (statusEl) {
                statusEl.textContent = this.isConnected ? '🟢 Connected' : '🔴 Disconnected';
                statusEl.style.color = this.isConnected ? '#4ade80' : '#f87171';
            }
        }, 1000);
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    (function () {
        try {
            // Real-time backend is not deployed yet. Expose a safe stub everywhere.
            console.log('PlanetDiscoveryRealTimeSync: disabled (no backend configured)');
            window.planetDiscoveryRealTimeSync = {
                renderSyncStatus: function (containerId) {
                    const container = document.getElementById(containerId);
                    if (!container) { return; }
                    container.innerHTML = `
                        <div class="realtime-sync-container" style="margin-top: 2rem;">
                            <h3 style="color: #ba944f; margin-bottom: 1.5rem; text-align: center;">🔄 Real-Time Sync</h3>
                            <div style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; text-align: center;">
                                <div style="margin-bottom: 0.75rem; color: rgba(248, 250, 252, 0.9);">
                                    Real-time sync is currently <span style="color: #f97316; font-weight: 600;">disabled</span>.
                                </div>
                                <div style="font-size: 0.85rem; color: rgba(148, 163, 184, 0.9);">
                                    This feature requires a live backend service and is not yet enabled.
                                </div>
                            </div>
                        </div>
                    `;
                },
                trackEvent: function () { },
                on: function () { },
                off: function () { }
            };
        } catch (e) {
            console.warn('PlanetDiscoveryRealTimeSync initialization failed:', e);
        }
    })();
}

