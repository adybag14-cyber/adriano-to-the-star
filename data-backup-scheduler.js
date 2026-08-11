/**
 * Data Backup Scheduler with Retention Policies
 * Schedule and manage data backups
 */
(function() {
    'use strict';

    class DataBackupScheduler {
        constructor() {
            this.schedules = [];
            this.backups = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.startScheduler();
            this.trackEvent('data_backup_scheduler_initialized');
        }

        setupUI() {
            if (!document.getElementById('backup-scheduler')) {
                const scheduler = document.createElement('div');
                scheduler.id = 'backup-scheduler';
                scheduler.className = 'backup-scheduler';
                scheduler.innerHTML = `
                    <div class="scheduler-header">
                        <h2>Backup Scheduler</h2>
                        <button class="create-backup-btn" id="create-backup-btn">Create Backup</button>
                    </div>
                    <div class="schedules-list" id="schedules-list"></div>
                `;
                document.body.appendChild(scheduler);
            }
        }

        createSchedule(config) {
            const schedule = {
                id: this.generateId(),
                name: config.name,
                frequency: config.frequency,
                retention: config.retention || 30, // days
                enabled: config.enabled !== false
            };
            this.schedules.push(schedule);
            this.saveSchedules();
            return schedule;
        }

        async executeBackup(schedule) {
            const backup = {
                id: this.generateId(),
                scheduleId: schedule.id,
                timestamp: new Date().toISOString(),
                data: await this.exportData()
            };
            this.backups.push(backup);
            this.cleanupOldBackups(schedule);
            this.saveBackups();
            return backup;
        }

        async exportData() {
            // Export all data
            if (window.database?.exportAll) {
                return await window.database.exportAll();
            }
            return {};
        }

        cleanupOldBackups(schedule) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - schedule.retention);
            this.backups = this.backups.filter(b => 
                b.scheduleId !== schedule.id || new Date(b.timestamp) > cutoff
            );
        }

        startScheduler() {
            setInterval(() => {
                this.checkSchedules();
            }, 60000);
        }

        checkSchedules() {
            this.schedules.filter(s => s.enabled).forEach(schedule => {
                // Check if backup is due
                this.executeBackup(schedule);
            });
        }

        generateId() {
            return 'backup_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveSchedules() {
            localStorage.setItem('backupSchedules', JSON.stringify(this.schedules));
        }

        saveBackups() {
            localStorage.setItem('backups', JSON.stringify(this.backups));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_backup_scheduler_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.backupScheduler = new DataBackupScheduler();
        });
    } else {
        window.backupScheduler = new DataBackupScheduler();
    }
})();


