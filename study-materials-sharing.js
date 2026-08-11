/**
 * Study Materials Sharing
 * @class StudyMaterialsSharing
 * @description Allows sharing of study materials between users.
 */
class StudyMaterialsSharing {
    constructor() {
        this.materials = new Map();
        this.shares = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_tu_dy_ma_te_ri_al_ss_ha_ri_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_tu_dy_ma_te_ri_al_ss_ha_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Upload study material.
     * @param {string} materialId - Material identifier.
     * @param {object} materialData - Material data.
     */
    uploadMaterial(materialId, materialData) {
        this.materials.set(materialId, {
            ...materialData,
            id: materialId,
            userId: materialData.userId,
            title: materialData.title,
            fileUrl: materialData.fileUrl,
            fileType: materialData.fileType,
            downloadCount: 0,
            createdAt: new Date()
        });
        console.log(`Study material uploaded: ${materialId}`);
    }

    /**
     * Share material.
     * @param {string} materialId - Material identifier.
     * @param {string} fromUserId - Sharing user identifier.
     * @param {string} toUserId - Receiving user identifier.
     */
    shareMaterial(materialId, fromUserId, toUserId) {
        const shareId = `share_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.shares.set(shareId, {
            id: shareId,
            materialId,
            fromUserId,
            toUserId,
            sharedAt: new Date()
        });
        console.log(`Material shared: ${materialId} from ${fromUserId} to ${toUserId}`);
    }

    /**
     * Download material.
     * @param {string} materialId - Material identifier.
     * @param {string} userId - User identifier.
     */
    downloadMaterial(materialId, userId) {
        const material = this.materials.get(materialId);
        if (material) {
            material.downloadCount++;
            console.log(`Material downloaded: ${materialId} by user ${userId}`);
        }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.studyMaterialsSharing = new StudyMaterialsSharing();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = StudyMaterialsSharing;
}

