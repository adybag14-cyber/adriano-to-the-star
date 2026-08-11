/**
 * Webhook Management
 * @class WebhookManagement
 * @description Manages webhooks with delivery, retries, and monitoring.
 */
class WebhookManagement {
    constructor() {
        this.webhooks = new Map();
        this.deliveries = new Map();
        this.init();
    }

    init() {
        this.trackEvent('w_eb_ho_ok_ma_na_ge_me_nt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("w_eb_ho_ok_ma_na_ge_me_nt_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Register webhook.
     * @param {string} webhookId - Webhook identifier.
     * @param {object} webhookData - Webhook data.
     */
    registerWebhook(webhookId, webhookData) {
        this.webhooks.set(webhookId, {
            ...webhookData,
            id: webhookId,
            url: webhookData.url,
            events: webhookData.events || [],
            secret: webhookData.secret,
            active: true,
            createdAt: new Date()
        });
        console.log(`Webhook registered: ${webhookId}`);
    }

    /**
     * Trigger webhook.
     * @param {string} webhookId - Webhook identifier.
     * @param {object} payload - Payload data.
     * @returns {Promise<object>} Delivery result.
     */
    async triggerWebhook(webhookId, payload) {
        const webhook = this.webhooks.get(webhookId);
        if (!webhook || !webhook.active) {
            throw new Error(`Webhook not found or inactive: ${webhookId}`);
        }

        const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        const delivery = {
            id: deliveryId,
            webhookId,
            status: 'pending',
            attempts: 0,
            maxAttempts: 3,
            startedAt: new Date()
        };

        this.deliveries.set(deliveryId, delivery);

        try {
            await this.deliver(webhook, payload, delivery);
            return delivery;
        } catch (error) {
            await this.retryDelivery(delivery, webhook, payload);
            throw error;
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[webhook-management] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[webhook-management] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[webhook-management] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Deliver webhook.
     * @param {object} webhook - Webhook object.
     * @param {object} payload - Payload.
     * @param {object} delivery - Delivery object.
     * @returns {Promise<void>}
     */
    async deliver(webhook, payload, delivery) {
        delivery.attempts++;
        
        const signature = this.generateSignature(JSON.stringify(payload), webhook.secret);
        
        try {
            await this.fetchJSON(webhook.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature
                },
                body: JSON.stringify(payload)
            });

            delivery.status = 'delivered';
            delivery.deliveredAt = new Date();
        } catch (error) {
            throw new Error(`Webhook delivery failed: ${error.message}`);
        }
    }

    /**
     * Retry delivery.
     * @param {object} delivery - Delivery object.
     * @param {object} webhook - Webhook object.
     * @param {object} payload - Payload.
     * @returns {Promise<void>}
     */
    async retryDelivery(delivery, webhook, payload) {
        if (delivery.attempts < delivery.maxAttempts) {
            setTimeout(async () => {
                try {
                    await this.deliver(webhook, payload, delivery);
                } catch (error) {
                    if (delivery.attempts >= delivery.maxAttempts) {
                        delivery.status = 'failed';
                        delivery.failedAt = new Date();
                    }
                }
            }, Math.pow(2, delivery.attempts) * 1000); // Exponential backoff
        } else {
            delivery.status = 'failed';
            delivery.failedAt = new Date();
        }
    }

    /**
     * Generate signature.
     * @param {string} payload - Payload string.
     * @param {string} secret - Secret key.
     * @returns {string} Signature.
     */
    generateSignature(payload, secret) {
        // Placeholder for HMAC signature generation
        return `sig_${Math.random().toString(36).substring(2, 15)}`;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.webhookManagement = new WebhookManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WebhookManagement;
}

