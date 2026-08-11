/**
 * Planet Discovery Alerts
 * Notify users when new planets match their interests
 */

class PlanetDiscoveryAlerts {
    constructor() {
        this.alertPreferences = {};
        this.alerts = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.loadPreferences();
        this.isInitialized = true;
        console.log('🔔 Planet Discovery Alerts initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_al_er_ts_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadPreferences() {
        try {
            const stored = localStorage.getItem('planet-alert-preferences');
            if (stored) this.alertPreferences = JSON.parse(stored);
        } catch (error) {
            console.error('Error loading alert preferences:', error);
        }
    }

    savePreferences() {
        try {
            localStorage.setItem('planet-alert-preferences', JSON.stringify(this.alertPreferences));
        } catch (error) {
            console.error('Error saving preferences:', error);
        }
    }

    setAlertPreferences(prefs) {
        this.alertPreferences = { ...this.alertPreferences, ...prefs };
        this.savePreferences();
    }

    checkPlanet(planet) {
        const matches = [];
        const radius = parseFloat(planet.radius) || 1;
        const temp = parseFloat(planet.koi_teq) || 300;

        if (this.alertPreferences.earthLike && radius >= 0.8 && radius <= 1.5) {
            matches.push('Earth-like size');
        }
        if (this.alertPreferences.habitable && temp >= 200 && temp <= 350) {
            matches.push('Potentially habitable');
        }
        if (this.alertPreferences.confirmed && (planet.status === 'CONFIRMED' || planet.status === 'Confirmed Planet')) {
            matches.push('Confirmed planet');
        }

        if (matches.length > 0) {
            this.createAlert(planet, matches);
        }
    }

    createAlert(planet, reasons) {
        const alert = {
            id: `alert-${Date.now()}`,
            planetId: planet.kepid,
            planetName: planet.kepler_name || planet.kepoi_name,
            reasons: reasons,
            createdAt: new Date().toISOString(),
            read: false
        };
        this.alerts.push(alert);
        this.showNotification(alert);
    }

    showNotification(alert) {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`New Planet Alert: ${alert.planetName}`, {
                body: `Matches: ${alert.reasons.join(', ')}`,
                icon: '/favicon.ico'
            });
        }
    }

    requestNotificationPermission() {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }
}

if (typeof window !== 'undefined') {
    window.PlanetDiscoveryAlerts = PlanetDiscoveryAlerts;
    window.planetDiscoveryAlerts = new PlanetDiscoveryAlerts();
}

