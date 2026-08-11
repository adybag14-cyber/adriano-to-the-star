/**
 * Digital Product Delivery System
 * @class DigitalProductDeliverySystem
 * @description Manages delivery of digital products (downloads, licenses, etc.).
 */
class DigitalProductDeliverySystem {
    constructor() {
        this.deliveries = new Map();
        this.licenses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ig_it_al_pr_od_uc_td_el_iv_er_ys_ys_te_m_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ig_it_al_pr_od_uc_td_el_iv_er_ys_ys_te_m_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Deliver digital product.
     * @param {string} orderId - Order identifier.
     * @param {string} productId - Product identifier.
     * @param {string} userId - User identifier.
     * @param {object} productData - Product data.
     */
    deliverProduct(orderId, productId, userId, productData) {
        const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.deliveries.set(deliveryId, {
            id: deliveryId,
            orderId,
            productId,
            userId,
            downloadUrl: productData.downloadUrl,
            licenseKey: productData.requiresLicense ? this.generateLicenseKey() : null,
            downloadLimit: productData.downloadLimit || null,
            downloadsUsed: 0,
            expiresAt: productData.expiresAt || null,
            deliveredAt: new Date()
        });

        if (productData.requiresLicense) {
            this.createLicense(deliveryId, productData);
        }

        console.log(`Digital product delivered: ${deliveryId}`);
        return deliveryId;
    }

    /**
     * Generate license key.
     * @returns {string} License key.
     */
    generateLicenseKey() {
        return `LIC-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    }

    /**
     * Create license.
     * @param {string} deliveryId - Delivery identifier.
     * @param {object} productData - Product data.
     */
    createLicense(deliveryId, productData) {
        const delivery = this.deliveries.get(deliveryId);
        if (delivery && delivery.licenseKey) {
            this.licenses.set(delivery.licenseKey, {
                licenseKey: delivery.licenseKey,
                deliveryId,
                productId: delivery.productId,
                userId: delivery.userId,
                activated: false,
                createdAt: new Date()
            });
        }
    }

    /**
     * Get download link.
     * @param {string} deliveryId - Delivery identifier.
     * @returns {object} Download information.
     */
    getDownloadLink(deliveryId) {
        const delivery = this.deliveries.get(deliveryId);
        if (!delivery) {
            throw new Error('Delivery not found');
        }

        // Check download limit
        if (delivery.downloadLimit && delivery.downloadsUsed >= delivery.downloadLimit) {
            throw new Error('Download limit reached');
        }

        // Check expiration
        if (delivery.expiresAt && new Date(delivery.expiresAt) < new Date()) {
            throw new Error('Download link expired');
        }

        delivery.downloadsUsed++;
        return {
            downloadUrl: delivery.downloadUrl,
            licenseKey: delivery.licenseKey,
            downloadsRemaining: delivery.downloadLimit ? delivery.downloadLimit - delivery.downloadsUsed : null
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.digitalProductDeliverySystem = new DigitalProductDeliverySystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalProductDeliverySystem;
}

