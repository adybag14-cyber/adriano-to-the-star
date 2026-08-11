/**
 * Database Migration System
 * @class DatabaseMigrationSystem
 * @description Manages database migrations with versioning and rollback capabilities.
 */
class DatabaseMigrationSystem {
    constructor() {
        this.migrations = new Map();
        this.migrationHistory = [];
        this.currentVersion = 0;
        this.init();
    }

    init() {
        this.loadMigrationHistory();
        this.trackEvent('db_migration_initialized');
    }

    /**
     * Create a migration.
     * @param {string} migrationId - Migration identifier.
     * @param {object} migrationData - Migration data.
     */
    createMigration(migrationId, migrationData) {
        this.migrations.set(migrationId, {
            ...migrationData,
            id: migrationId,
            version: migrationData.version || this.getNextVersion(),
            up: migrationData.up, // Migration function
            down: migrationData.down, // Rollback function
            createdAt: new Date()
        });
        console.log(`Migration created: ${migrationId}`);
    }

    /**
     * Get next version number.
     * @returns {number} Next version.
     */
    getNextVersion() {
        const versions = Array.from(this.migrations.values()).map(m => m.version);
        return versions.length > 0 ? Math.max(...versions) + 1 : 1;
    }

    /**
     * Run migrations.
     * @param {number} targetVersion - Target version (optional).
     * @returns {Promise<Array<object>>} Migration results.
     */
    async runMigrations(targetVersion = null) {
        const pendingMigrations = this.getPendingMigrations(targetVersion);
        const results = [];

        for (const migration of pendingMigrations) {
            try {
                await migration.up();
                this.currentVersion = migration.version;
                this.migrationHistory.push({
                    migrationId: migration.id,
                    version: migration.version,
                    appliedAt: new Date()
                });
                results.push({ migrationId: migration.id, status: 'success' });
                console.log(`Migration applied: ${migration.id}`);
            } catch (error) {
                results.push({ migrationId: migration.id, status: 'failed', error: error.message });
                throw error;
            }
        }

        this.saveMigrationHistory();
        return results;
    }

    /**
     * Get pending migrations.
     * @param {number} targetVersion - Target version.
     * @returns {Array<object>} Pending migrations.
     */
    getPendingMigrations(targetVersion) {
        const migrations = Array.from(this.migrations.values())
            .filter(m => m.version > this.currentVersion);

        if (targetVersion) {
            migrations.filter(m => m.version <= targetVersion);
        }

        return migrations.sort((a, b) => a.version - b.version);
    }

    /**
     * Rollback migration.
     * @param {number} targetVersion - Target version to rollback to.
     * @returns {Promise<Array<object>>} Rollback results.
     */
    async rollback(targetVersion) {
        const migrationsToRollback = Array.from(this.migrations.values())
            .filter(m => m.version > targetVersion && m.version <= this.currentVersion)
            .sort((a, b) => b.version - a.version);

        const results = [];

        for (const migration of migrationsToRollback) {
            try {
                await migration.down();
                this.currentVersion = migration.version - 1;
                results.push({ migrationId: migration.id, status: 'rolled_back' });
                console.log(`Migration rolled back: ${migration.id}`);
            } catch (error) {
                results.push({ migrationId: migration.id, status: 'failed', error: error.message });
                throw error;
            }
        }

        this.saveMigrationHistory();
        return results;
    }

    saveMigrationHistory() {
        try {
            localStorage.setItem('migrationHistory', JSON.stringify({
                currentVersion: this.currentVersion,
                history: this.migrationHistory
            }));
        } catch (error) {
            console.error('Failed to save migration history:', error);
        }
    }

    loadMigrationHistory() {
        try {
            const stored = localStorage.getItem('migrationHistory');
            if (stored) {
                const data = JSON.parse(stored);
                this.currentVersion = data.currentVersion || 0;
                this.migrationHistory = data.history || [];
            }
        } catch (error) {
            // Silent fail
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`db_migration_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.databaseMigrationSystem = new DatabaseMigrationSystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DatabaseMigrationSystem;
}
