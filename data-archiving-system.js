/**
 * Data Archiving System for Old Records
 * Archive old data automatically
 */
(function() {
    'use strict';

    class DataArchivingSystem {
        constructor() {
            this.archiveRules = [];
            this.archivedData = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_archiving_system_initialized');
        }

        setupUI() {
            if (!document.getElementById('archiving-system')) {
                const system = document.createElement('div');
                system.id = 'archiving-system';
                system.className = 'archiving-system';
                system.innerHTML = `
                    <div class="system-header">
                        <h2>Data Archiving</h2>
                        <button class="archive-now-btn" id="archive-now-btn">Archive Now</button>
                    </div>
                    <div class="archive-rules" id="archive-rules"></div>
                `;
                document.body.appendChild(system);
            }
        }

        createArchiveRule(config) {
            const rule = {
                id: this.generateId(),
                field: config.field,
                condition: config.condition, // olderThan, lessThan, etc.
                value: config.value,
                enabled: config.enabled !== false
            };
            this.archiveRules.push(rule);
            this.saveRules();
            return rule;
        }

        async archiveData() {
            const toArchive = this.findDataToArchive();
            for (const item of toArchive) {
                await this.archiveItem(item);
            }
        }

        findDataToArchive() {
            const items = [];
            this.archiveRules.forEach(rule => {
                if (!rule.enabled) return;
                // Find items matching rule
                if (window.database?.find) {
                    const matches = window.database.find(rule);
                    items.push(...matches);
                }
            });
            return items;
        }

        async archiveItem(item) {
            this.archivedData.push({
                ...item,
                archivedAt: new Date().toISOString()
            });
            // Remove from active database
            if (window.database?.delete) {
                await window.database.delete(item.id);
            }
        }

        generateId() {
            return 'archive_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveRules() {
            localStorage.setItem('archiveRules', JSON.stringify(this.archiveRules));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_archiving_system_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataArchiving = new DataArchivingSystem();
        });
    } else {
        window.dataArchiving = new DataArchivingSystem();
    }
})();


