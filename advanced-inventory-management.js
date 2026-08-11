/**
 * Advanced Inventory Management
 * @class AdvancedInventoryManagement
 * @description Advanced inventory tracking with multiple warehouses and locations.
 */
class AdvancedInventoryManagement {
    constructor() {
        this.inventory = new Map();
        this.warehouses = new Map();
        this.locations = new Map();
        this.init();
    }

    init() {
        this.trackEvent('inventory_management_initialized');
    }

    /**
     * Create warehouse.
     * @param {string} warehouseId - Warehouse identifier.
     * @param {object} warehouseData - Warehouse data.
     */
    createWarehouse(warehouseId, warehouseData) {
        this.warehouses.set(warehouseId, {
            ...warehouseData,
            id: warehouseId,
            name: warehouseData.name,
            address: warehouseData.address,
            locations: [],
            createdAt: new Date()
        });
        this.trackEvent('warehouse_created', { warehouseId, name: warehouseData.name });
    }

    /**
     * Add inventory.
     * @param {string} productId - Product identifier.
     * @param {string} warehouseId - Warehouse identifier.
     * @param {string} locationId - Location identifier (optional).
     * @param {number} quantity - Quantity to add.
     */
    addInventory(productId, warehouseId, locationId, quantity) {
        const inventoryKey = `${productId}_${warehouseId}_${locationId || 'default'}`;
        const current = this.inventory.get(inventoryKey) || {
            productId,
            warehouseId,
            locationId: locationId || 'default',
            quantity: 0
        };

        current.quantity += quantity;
        current.updatedAt = new Date();
        this.inventory.set(inventoryKey, current);
        this.trackEvent('inventory_updated', { productId, warehouseId, quantity: current.quantity });
    }

    /**
     * Get available quantity.
     * @param {string} productId - Product identifier.
     * @param {string} warehouseId - Warehouse identifier (optional).
     * @returns {number} Available quantity.
     */
    getAvailableQuantity(productId, warehouseId = null) {
        let total = 0;
        for (const inventory of this.inventory.values()) {
            if (inventory.productId === productId) {
                if (!warehouseId || inventory.warehouseId === warehouseId) {
                    total += inventory.quantity;
                }
            }
        }
        return total;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`inventory_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'advanced_inventory_management', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.advancedInventoryManagement = new AdvancedInventoryManagement();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedInventoryManagement;
}

