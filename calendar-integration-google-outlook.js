/**
 * Calendar Integration (Google, Outlook)
 * Integrates with Google Calendar and Microsoft Outlook Calendar
 * 
 * ⚠️ SECURITY WARNING ⚠️
 * NEVER hardcode your `accessToken` or `clientSecret` in this file or any frontend code.
 * Doing so will allow attackers to access your users' calendars.
 * Always fetch tokens from a secure backend or use implicit OAuth flow.
 */

class CalendarIntegration {
    constructor() {
        this.providers = new Map();
        this.init();
    }

    init() {
        this.trackEvent('calendar_int_initialized');
    }

    configureProvider(provider, config) {
        this.providers.set(provider, config);
    }

    async createEvent(provider, event) {
        const config = this.providers.get(provider);
        if (!config) {
            throw new Error(`${provider} not configured`);
        }

        try {
            if (provider === 'google') {
                return await this.createGoogleEvent(event, config);
            } else if (provider === 'outlook') {
                return await this.createOutlookEvent(event, config);
            }
        } catch (error) {
            console.error(`Calendar event creation error (${provider}):`, error);
            throw error;
        }
    }

    async createGoogleEvent(event, config) {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.accessToken}`
            },
            body: JSON.stringify({
                summary: event.title,
                description: event.description,
                start: {
                    dateTime: event.startTime,
                    timeZone: event.timeZone || 'UTC'
                },
                end: {
                    dateTime: event.endTime,
                    timeZone: event.timeZone || 'UTC'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Google Calendar event creation failed: ${response.statusText}`);
        }

        return await response.json();
    }

    async createOutlookEvent(event, config) {
        const response = await fetch('https://graph.microsoft.com/v1.0/me/calendar/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.accessToken}`
            },
            body: JSON.stringify({
                subject: event.title,
                body: {
                    contentType: 'HTML',
                    content: event.description
                },
                start: {
                    dateTime: event.startTime,
                    timeZone: event.timeZone || 'UTC'
                },
                end: {
                    dateTime: event.endTime,
                    timeZone: event.timeZone || 'UTC'
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Outlook Calendar event creation failed: ${response.statusText}`);
        }

        return await response.json();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`calendar_int_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize
const calendarIntegration = new CalendarIntegration();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarIntegration;
}

