/**
 * Session Management and Timeout
 * Manage user sessions
 */
(function() {
    'use strict';

    class SessionManagementTimeout {
        constructor() {
            this.timeout = 30 * 60 * 1000; // 30 minutes
            this.timeoutTimer = null;
            this.init();
        }

        init() {
            this.setupUI();
            this.resetTimeout();
            this.setupActivityTracking();
        }

        setupUI() {
            if (!document.getElementById('session-management')) {
                const session = document.createElement('div');
                session.id = 'session-management';
                session.className = 'session-management';
                session.innerHTML = `<h2>Session Management</h2>`;
                document.body.appendChild(session);
            }
        }

        setupActivityTracking() {
            ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
                document.addEventListener(event, () => {
                    this.resetTimeout();
                });
            });
        }

        resetTimeout() {
            if (this.timeoutTimer) {
                clearTimeout(this.timeoutTimer);
            }

            this.timeoutTimer = setTimeout(() => {
                this.handleTimeout();
            }, this.timeout);
        }

        handleTimeout() {
            this.trackEvent('session_timeout');
            if (window.notificationSystem) {
                window.notificationSystem.show(
                    'Session Timeout',
                    'Your session will expire soon. Please refresh to continue.',
                    'warning'
                );
            }
        }

        trackEvent(eventName, data = {}) {
            if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
                try {
                    window.performanceMonitoring.recordMetric(`session:${eventName}`, 1, {
                        source: 'session-management-timeout',
                        ...data
                    });
                } catch (e) {
                    console.warn('Failed to record session event:', e);
                }
            }
            if (window.securityAuditLogging) {
                try {
                    window.securityAuditLogging.logEvent('session_event', null, { event: eventName, ...data }, 'info');
                } catch (e) {
                    console.warn('Failed to log session event:', e);
                }
            }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.sessionManagement = new SessionManagementTimeout();
        });
    } else {
        window.sessionManagement = new SessionManagementTimeout();
    }
})();

