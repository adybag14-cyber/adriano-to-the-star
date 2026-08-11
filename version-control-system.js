/**
 * Version Control for User-Generated Content
 * 
 * Adds comprehensive version control for user-generated content.
 * 
 * @module VersionControlSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class VersionControlSystem {
    constructor() {
        this.versions = new Map();
        this.maxVersions = 50;
        this.isInitialized = false;
    }

    /**
     * Initialize version control system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('VersionControlSystem already initialized');
            return;
        }

        this.loadVersions();
        
        this.isInitialized = true;
        console.log('✅ Version Control System initialized');
    }

    /**
     * Create version
     * @public
     * @param {string} contentId - Content ID
     * @param {Object} content - Content data
     * @param {string} message - Version message
     * @returns {Object} Version object
     */
    createVersion(contentId, content, message = '') {
        const version = {
            id: Date.now() + Math.random(),
            contentId,
            content: JSON.parse(JSON.stringify(content)), // Deep copy
            message,
            authorId: this.getUserId(),
            authorName: this.getUserName(),
            timestamp: new Date().toISOString(),
            isCurrent: false
        };

        if (!this.versions.has(contentId)) {
            this.versions.set(contentId, []);
        }

        const versions = this.versions.get(contentId);
        
        // Mark previous current version as not current
        versions.forEach(v => v.isCurrent = false);
        
        version.isCurrent = true;
        versions.unshift(version);

        // Keep only last maxVersions
        if (versions.length > this.maxVersions) {
            versions.pop();
        }

        this.saveVersions();

        return version;
    }

    /**
     * Get versions
     * @public
     * @param {string} contentId - Content ID
     * @returns {Array} Versions array
     */
    getVersions(contentId) {
        return this.versions.get(contentId) || [];
    }

    /**
     * Get current version
     * @public
     * @param {string} contentId - Content ID
     * @returns {Object|null} Current version
     */
    getCurrentVersion(contentId) {
        const versions = this.getVersions(contentId);
        return versions.find(v => v.isCurrent) || versions[0] || null;
    }

    /**
     * Get version
     * @public
     * @param {string} contentId - Content ID
     * @param {string} versionId - Version ID
     * @returns {Object|null} Version object
     */
    getVersion(contentId, versionId) {
        const versions = this.getVersions(contentId);
        return versions.find(v => v.id === versionId) || null;
    }

    /**
     * Restore version
     * @public
     * @param {string} contentId - Content ID
     * @param {string} versionId - Version ID
     * @returns {Object} Restored version
     */
    restoreVersion(contentId, versionId) {
        const versions = this.getVersions(contentId);
        const version = versions.find(v => v.id === versionId);
        
        if (!version) {
            return null;
        }

        // Mark all as not current
        versions.forEach(v => v.isCurrent = false);

        // Create new version from restored content
        return this.createVersion(contentId, version.content, `Restored from version ${versionId}`);
    }

    /**
     * Compare versions
     * @public
     * @param {string} contentId - Content ID
     * @param {string} versionId1 - First version ID
     * @param {string} versionId2 - Second version ID
     * @returns {Object} Comparison result
     */
    compareVersions(contentId, versionId1, versionId2) {
        const version1 = this.getVersion(contentId, versionId1);
        const version2 = this.getVersion(contentId, versionId2);

        if (!version1 || !version2) {
            return null;
        }

        return {
            added: this.getAddedFields(version1.content, version2.content),
            removed: this.getRemovedFields(version1.content, version2.content),
            modified: this.getModifiedFields(version1.content, version2.content)
        };
    }

    /**
     * Get added fields
     * @private
     * @param {Object} oldContent - Old content
     * @param {Object} newContent - New content
     * @returns {Array} Added fields
     */
    getAddedFields(oldContent, newContent) {
        const added = [];
        Object.keys(newContent).forEach(key => {
            if (!(key in oldContent)) {
                added.push(key);
            }
        });
        return added;
    }

    /**
     * Get removed fields
     * @private
     * @param {Object} oldContent - Old content
     * @param {Object} newContent - New content
     * @returns {Array} Removed fields
     */
    getRemovedFields(oldContent, newContent) {
        const removed = [];
        Object.keys(oldContent).forEach(key => {
            if (!(key in newContent)) {
                removed.push(key);
            }
        });
        return removed;
    }

    /**
     * Get modified fields
     * @private
     * @param {Object} oldContent - Old content
     * @param {Object} newContent - New content
     * @returns {Array} Modified fields
     */
    getModifiedFields(oldContent, newContent) {
        const modified = [];
        Object.keys(newContent).forEach(key => {
            if (key in oldContent && JSON.stringify(oldContent[key]) !== JSON.stringify(newContent[key])) {
                modified.push(key);
            }
        });
        return modified;
    }

    /**
     * Delete version
     * @public
     * @param {string} contentId - Content ID
     * @param {string} versionId - Version ID
     * @returns {boolean} True if deleted
     */
    deleteVersion(contentId, versionId) {
        const versions = this.getVersions(contentId);
        const index = versions.findIndex(v => v.id === versionId);
        
        if (index === -1) {
            return false;
        }

        versions.splice(index, 1);
        this.saveVersions();

        return true;
    }

    /**
     * Get user ID
     * @private
     * @returns {string|null} User ID
     */
    getUserId() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.id || null;
        } catch {
            return null;
        }
    }

    /**
     * Get user name
     * @private
     * @returns {string} User name
     */
    getUserName() {
        try {
            const user = JSON.parse(localStorage.getItem('stellar-ai-user') || 'null');
            return user?.name || user?.email || 'Guest';
        } catch {
            return 'Guest';
        }
    }

    /**
     * Save versions
     * @private
     */
    saveVersions() {
        try {
            const versions = Object.fromEntries(this.versions);
            localStorage.setItem('content-versions', JSON.stringify(versions));
        } catch (e) {
            console.warn('Failed to save versions:', e);
        }
    }

    /**
     * Load versions
     * @private
     */
    loadVersions() {
        try {
            const saved = localStorage.getItem('content-versions');
            if (saved) {
                const versions = JSON.parse(saved);
                Object.entries(versions).forEach(([key, value]) => {
                    this.versions.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load versions:', e);
        }
    }
}

// Create global instance
window.VersionControlSystem = VersionControlSystem;
window.versionControl = new VersionControlSystem();
window.versionControl.init();

