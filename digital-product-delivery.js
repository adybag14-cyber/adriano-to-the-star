/**
 * Digital Product Delivery
 * @class DigitalProductDelivery
 * @description Manages delivery of digital products (downloads, licenses, etc.).
 */
class DigitalProductDelivery {
    constructor() {
        this.deliveries = new Map();
        this.downloads = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ig_it_al_pr_od_uc_td_el_iv_er_y_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ig_it_al_pr_od_uc_td_el_iv_er_y_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Deliver digital product.
     * @param {string} orderId - Order identifier.
     * @param {string} productId - Product identifier.
     * @param {object} productData - Product data.
     * @returns {object} Delivery information.
     */
    deliverProduct(orderId, productId, productData) {
        const deliveryId = `delivery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const delivery = {
            id: deliveryId,
            orderId,
            productId,
            type: productData.type || 'download', // download, license, access
            downloadUrl: productData.downloadUrl,
            licenseKey: productData.licenseKey,
            accessCode: productData.accessCode,
            deliveredAt: new Date()
        };

        this.deliveries.set(deliveryId, delivery);
        console.log(`Digital product delivered: ${deliveryId}`);
        return delivery;
    }

    /**
     * Track download.
     * @param {string} deliveryId - Delivery identifier.
     * @param {string} userId - User identifier.
     */
    trackDownload(deliveryId, userId) {
        const downloadId = `dl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.downloads.set(downloadId, {
            id: downloadId,
            deliveryId,
            userId,
            downloadedAt: new Date()
        });
        console.log(`Download tracked: ${downloadId}`);
    }

    /**
     * Get delivery information.
     * @param {string} orderId - Order identifier.
     * @returns {object} Delivery information.
     */
    getDelivery(orderId) {
        for (const delivery of this.deliveries.values()) {
            if (delivery.orderId === orderId) {
                return delivery;
            }
        }
        return null;
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.digitalProductDelivery = new DigitalProductDelivery();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DigitalProductDelivery;
}

