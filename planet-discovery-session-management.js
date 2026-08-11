/**
 * Planet Discovery Session Management
 * Manage user sessions, timeouts, and activity tracking
 */

class PlanetDiscoverySessionManagement {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.sessionStart = Date.now();
        this.lastActivity = Date.now();
        this.timeoutDuration = 30 * 60 * 1000; // 30 minutes
        this.warningDuration = 5 * 60 * 1000; // 5 minutes before timeout
        this.timeoutTimer = null;
        this.warningTimer = null;
        this.init();
    }

    init() {
        this.setupActivityTracking();
        this.setupTimeout();
        this.saveSession();
        console.log('⏱️ Session management initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_se_ss_io_nm_an_ag_em_en_t_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    }

    setupActivityTracking() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.updateActivity();
            }, { passive: true });
        });

        // Also track visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.updateActivity();
            }
        });
    }

    updateActivity() {
        this.lastActivity = Date.now();
        this.resetTimeout();
        this.saveSession();
    }

    setupTimeout() {
        this.resetTimeout();
    }

    resetTimeout() {
        // Clear existing timers
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
        }

        // Set warning timer
        this.warningTimer = setTimeout(() => {
            this.showTimeoutWarning();
        }, this.timeoutDuration - this.warningDuration);

        // Set timeout timer
        this.timeoutTimer = setTimeout(() => {
            this.handleTimeout();
        }, this.timeoutDuration);
    }

    showTimeoutWarning() {
        const warning = document.createElement('div');
        warning.id = 'session-timeout-warning';
        warning.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(239, 68, 68, 0.95);
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 10px;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
        `;

        warning.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem;">
                <span>⚠️ Your session will expire in 5 minutes due to inactivity</span>
                <button id="extend-session-btn" style="padding: 0.5rem 1rem; background: rgba(255, 255, 255, 0.2); border: 1px solid white; border-radius: 5px; color: white; cursor: pointer;">
                    Stay Logged In
                </button>
            </div>
        `;

        document.body.appendChild(warning);

        document.getElementById('extend-session-btn')?.addEventListener('click', () => {
            this.updateActivity();
            warning.remove();
        });

        // Auto-remove after 30 seconds
        setTimeout(() => {
            if (warning.parentNode) {
                warning.remove();
            }
        }, 30000);
    }

    handleTimeout() {
        // Clear session data
        this.clearSession();

        // Show timeout message
        alert('Your session has expired due to inactivity. Please refresh the page to continue.');

        // Optionally redirect to login or refresh
        // window.location.reload();
    }

    saveSession() {
        const sessionData = {
            sessionId: this.sessionId,
            sessionStart: this.sessionStart,
            lastActivity: this.lastActivity,
            timeoutDuration: this.timeoutDuration
        };

        try {
            sessionStorage.setItem('session-data', JSON.stringify(sessionData));
        } catch (error) {
            console.error('Error saving session:', error);
        }
    }

    loadSession() {
        try {
            const saved = sessionStorage.getItem('session-data');
            if (saved) {
                const sessionData = JSON.parse(saved);
                this.sessionId = sessionData.sessionId;
                this.sessionStart = sessionData.sessionStart;
                this.lastActivity = sessionData.lastActivity;
                this.timeoutDuration = sessionData.timeoutDuration;
                return true;
            }
        } catch (error) {
            console.error('Error loading session:', error);
        }
        return false;
    }

    clearSession() {
        try {
            sessionStorage.removeItem('session-data');
        } catch (error) {
            console.error('Error clearing session:', error);
        }
    }

    getSessionDuration() {
        return Date.now() - this.sessionStart;
    }

    getTimeUntilTimeout() {
        const timeSinceActivity = Date.now() - this.lastActivity;
        return Math.max(0, this.timeoutDuration - timeSinceActivity);
    }

    extendSession(duration = null) {
        if (duration) {
            this.timeoutDuration = duration;
        }
        this.updateActivity();
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoverySessionManagement = new PlanetDiscoverySessionManagement();
}

