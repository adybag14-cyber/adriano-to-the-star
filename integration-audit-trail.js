/**
 * Integration Audit Trail
 * @class IntegrationAuditTrail
 * @description Maintains an audit trail of integration activities and changes.
 */
class IntegrationAuditTrail {
    constructor() {
        this.auditEntries = [];
        this.init();
    }

    init() {
        this.trackEvent('i_nt_eg_ra_ti_on_au_di_tt_ra_il_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("i_nt_eg_ra_ti_on_au_di_tt_ra_il_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Record an audit entry.
     * @param {string} action - Action performed (e.g., 'create', 'update', 'delete', 'execute').
     * @param {string} entity - Entity type (e.g., 'integration', 'workflow', 'mapping').
     * @param {string} entityId - Entity identifier.
     * @param {object} details - Additional details.
     * @param {string} userId - User identifier (optional).
     */
    record(action, entity, entityId, details = {}, userId = null) {
        const entry = {
            id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            action,
            entity,
            entityId,
            details,
            userId: userId || 'system',
            timestamp: new Date(),
            ipAddress: details.ipAddress || null
        };

        this.auditEntries.push(entry);
        console.log(`Audit entry recorded: ${action} on ${entity} ${entityId}`);
        
        return entry;
    }

    /**
     * Query audit trail.
     * @param {object} filters - Query filters (action, entity, entityId, userId, startDate, endDate).
     * @returns {Array<object>} Matching audit entries.
     */
    query(filters = {}) {
        let results = this.auditEntries;

        if (filters.action) {
            results = results.filter(entry => entry.action === filters.action);
        }

        if (filters.entity) {
            results = results.filter(entry => entry.entity === filters.entity);
        }

        if (filters.entityId) {
            results = results.filter(entry => entry.entityId === filters.entityId);
        }

        if (filters.userId) {
            results = results.filter(entry => entry.userId === filters.userId);
        }

        if (filters.startDate) {
            results = results.filter(entry => entry.timestamp >= filters.startDate);
        }

        if (filters.endDate) {
            results = results.filter(entry => entry.timestamp <= filters.endDate);
        }

        // Sort by timestamp (newest first)
        results.sort((a, b) => b.timestamp - a.timestamp);

        return results;
    }

    /**
     * Get audit trail for a specific entity.
     * @param {string} entity - Entity type.
     * @param {string} entityId - Entity identifier.
     * @returns {Array<object>} Audit entries for the entity.
     */
    getEntityHistory(entity, entityId) {
        return this.query({ entity, entityId });
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.integrationAuditTrail = new IntegrationAuditTrail();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationAuditTrail;
}
