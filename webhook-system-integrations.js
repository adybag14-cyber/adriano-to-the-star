/**
 * Webhook System for Integrations
 * Manages webhook subscriptions, delivery, and retries
 */

class WebhookSystem {
    constructor() {
        this.webhooks = new Map();
        this.eventQueue = [];
        this.retryQueue = [];
        this.maxRetries = 3;
        this.retryDelays = [1000, 5000, 15000]; // 1s, 5s, 15s
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_sy_st_em_initialized');
        this.startEventProcessor();
        this.startRetryProcessor();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerWebhook(id, url, events, secret) {
        const webhook = {
            id,
            url,
            events: Array.isArray(events) ? events : [events],
            secret,
            active: true,
            createdAt: new Date(),
            lastDelivery: null,
            failureCount: 0
        };
        
        this.webhooks.set(id, webhook);
        return webhook;
    }

    unregisterWebhook(id) {
        return this.webhooks.delete(id);
    }

    triggerEvent(eventType, payload) {
        const event = {
            type: eventType,
            payload,
            timestamp: new Date(),
            id: this.generateEventId()
        };

        this.eventQueue.push(event);
        this.processEventQueue();
    }

    async processEventQueue() {
        while (this.eventQueue.length > 0) {
            const event = this.eventQueue.shift();
            await this.deliverEvent(event);
        }
    }

    async deliverEvent(event) {
        const relevantWebhooks = Array.from(this.webhooks.values())
            .filter(webhook => 
                webhook.active && 
                webhook.events.includes(event.type)
            );

        for (const webhook of relevantWebhooks) {
            await this.deliverToWebhook(webhook, event);
        }
    }

    async deliverToWebhook(webhook, event) {
        try {
            const signature = this.generateSignature(webhook.secret, JSON.stringify(event.payload));
            
            const response = await fetch(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': event.type,
                    'X-Webhook-Id': webhook.id
                },
                body: JSON.stringify(event.payload),
                signal: AbortSignal.timeout(10000) // 10 second timeout
            });

            if (response.ok) {
                webhook.lastDelivery = new Date();
                webhook.failureCount = 0;
                this.logDelivery(webhook.id, event.id, true);
            } else {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error(`Webhook delivery failed for ${webhook.id}:`, error);
            webhook.failureCount++;
            this.scheduleRetry(webhook, event);
        }
    }

    scheduleRetry(webhook, event) {
        if (webhook.failureCount <= this.maxRetries) {
            const delay = this.retryDelays[webhook.failureCount - 1] || 30000;
            this.retryQueue.push({
                webhook,
                event,
                retryAt: Date.now() + delay,
                attempt: webhook.failureCount
            });
        } else {
            this.logDelivery(webhook.id, event.id, false, 'Max retries exceeded');
            // Optionally disable webhook after max retries
            // webhook.active = false;
        }
    }

    async startRetryProcessor() {
        setInterval(() => {
            const now = Date.now();
            const readyRetries = this.retryQueue.filter(r => r.retryAt <= now);
            
            for (const retry of readyRetries) {
                const index = this.retryQueue.indexOf(retry);
                this.retryQueue.splice(index, 1);
                this.deliverToWebhook(retry.webhook, retry.event);
            }
        }, 1000); // Check every second
    }

    startEventProcessor() {
        // Process events as they come in
        setInterval(() => {
            this.processEventQueue();
        }, 100);
    }

    generateSignature(secret, payload) {
        // Generate HMAC-SHA256 signature
        // In production, use crypto.subtle or a crypto library
        return btoa(`${secret}:${payload}`).substring(0, 64);
    }

    generateEventId() {
        return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    logDelivery(webhookId, eventId, success, error = null) {
        const log = {
            webhookId,
            eventId,
            success,
            error,
            timestamp: new Date()
        };
        
        // Store in localStorage or send to server
        const logs = JSON.parse(localStorage.getItem('webhookLogs') || '[]');
        logs.push(log);
        if (logs.length > 1000) logs.shift(); // Keep last 1000 logs
        localStorage.setItem('webhookLogs', JSON.stringify(logs));
    }

    getWebhook(id) {
        return this.webhooks.get(id);
    }

    getAllWebhooks() {
        return Array.from(this.webhooks.values());
    }

    verifySignature(secret, payload, signature) {
        const expectedSignature = this.generateSignature(secret, payload);
        return signature === expectedSignature;
    }
}

// Auto-initialize
const webhookSystem = new WebhookSystem();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookSystem;
}

