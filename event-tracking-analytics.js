/**
 * Event Tracking and Analytics
 * Track user events
 */
(function() {
    'use strict';

    class EventTrackingAnalytics {
        constructor() {
            this.events = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.setupTracking();
        }

        setupUI() {
            if (!document.getElementById('event-tracking')) {
                const tracking = document.createElement('div');
                tracking.id = 'event-tracking';
                tracking.className = 'event-tracking';
                tracking.innerHTML = `<h2>Event Tracking</h2>`;
                document.body.appendChild(tracking);
            }
        }

        setupTracking() {
            document.addEventListener('click', (e) => {
                this.trackEvent('click', {
                    target: e.target.tagName,
                    id: e.target.id,
                    class: e.target.className
                });
            });
        }

        trackEvent(name, properties) {
            const event = {
                name: name,
                properties: properties,
                timestamp: new Date().toISOString(),
                userId: this.getCurrentUser()
            };
            this.events.push(event);
            this.saveEvents();
        }

        getCurrentUser() {
            return window.supabase?.auth?.user()?.id || 'anonymous';
        }

        saveEvents() {
            localStorage.setItem('trackedEvents', JSON.stringify(this.events.slice(-1000)));
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.eventTracking = new EventTrackingAnalytics();
        });
    } else {
        window.eventTracking = new EventTrackingAnalytics();
    }
})();

