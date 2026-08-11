/**
 * Scheduled Reports with Email Delivery
 * Schedule reports and send them via email
 */
(function() {
    'use strict';

    class ScheduledReportsSystem {
        constructor() {
            this.schedules = [];
            this.init();
        }

        init() {
            this.loadSchedules();
            this.setupUI();
            this.startScheduler();
        }

        setupUI() {
            if (!document.getElementById('scheduled-reports-panel')) {
                const panel = document.createElement('div');
                panel.id = 'scheduled-reports-panel';
                panel.className = 'scheduled-reports-panel';
                panel.innerHTML = `
                    <div class="panel-header">
                        <h3>Scheduled Reports</h3>
                        <button class="create-schedule-btn" id="create-schedule-btn">Create Schedule</button>
                    </div>
                    <div class="schedules-list" id="schedules-list"></div>
                `;
                document.body.appendChild(panel);
            }
        }

        createSchedule(config) {
            const schedule = {
                id: this.generateId(),
                name: config.name,
                reportId: config.reportId,
                frequency: config.frequency, // daily, weekly, monthly
                time: config.time || '09:00',
                dayOfWeek: config.dayOfWeek, // 0-6 for weekly
                dayOfMonth: config.dayOfMonth, // 1-31 for monthly
                recipients: config.recipients || [],
                format: config.format || 'pdf', // pdf, csv, excel
                enabled: config.enabled !== false,
                lastRun: null,
                nextRun: this.calculateNextRun(config),
                createdAt: new Date().toISOString()
            };

            this.schedules.push(schedule);
            this.saveSchedules();
            this.renderSchedules();
            return schedule;
        }

        calculateNextRun(config) {
            const now = new Date();
            const [hours, minutes] = (config.time || '09:00').split(':').map(Number);
            const next = new Date();
            next.setHours(hours, minutes, 0, 0);

            if (next <= now) {
                next.setDate(next.getDate() + 1);
            }

            switch (config.frequency) {
                case 'daily':
                    return next.toISOString();
                case 'weekly':
                    const dayDiff = config.dayOfWeek - next.getDay();
                    next.setDate(next.getDate() + (dayDiff >= 0 ? dayDiff : dayDiff + 7));
                    return next.toISOString();
                case 'monthly':
                    next.setDate(config.dayOfMonth || 1);
                    if (next <= now) {
                        next.setMonth(next.getMonth() + 1);
                    }
                    return next.toISOString();
                default:
                    return next.toISOString();
            }
        }

        startScheduler() {
            // Check every minute
            setInterval(() => {
                this.checkSchedules();
            }, 60000);
        }

        async checkSchedules() {
            const now = new Date();
            const dueSchedules = this.schedules.filter(s => 
                s.enabled && new Date(s.nextRun) <= now
            );

            for (const schedule of dueSchedules) {
                try {
                    await this.executeSchedule(schedule);
                } catch (error) {
                    console.error('Schedule execution failed:', error);
                }
            }
        }

        async executeSchedule(schedule) {
            // Generate report
            const report = await this.generateReport(schedule.reportId);
            
            // Send email
            await this.sendReportEmail(schedule, report);
            
            // Update schedule
            schedule.lastRun = new Date().toISOString();
            schedule.nextRun = this.calculateNextRun(schedule);
            this.saveSchedules();
            this.renderSchedules();
        }

        async generateReport(reportId) {
            // Get report data
            if (window.reportBuilder?.reports) {
                const report = window.reportBuilder.reports.find(r => r.id === reportId);
                if (report) {
                    return {
                        name: report.name,
                        data: report,
                        format: 'json'
                    };
                }
            }

            // Fallback: generate from database
            if (window.database?.generateReport) {
                return await window.database.generateReport(reportId);
            }

            throw new Error('Report not found');
        }

        async sendReportEmail(schedule, report) {
            const email = {
                to: schedule.recipients,
                subject: `Scheduled Report: ${schedule.name}`,
                body: this.generateEmailBody(schedule, report),
                attachments: [{
                    filename: `${schedule.name}.${schedule.format}`,
                    content: await this.formatReport(report, schedule.format)
                }]
            };

            // Send via email service
            if (window.emailService) {
                await window.emailService.send(email);
            } else {
                console.log('Email would be sent:', email);
            }
        }

        generateEmailBody(schedule, report) {
            return `
                <h2>${schedule.name}</h2>
                <p>This is your scheduled report.</p>
                <p>Generated on: ${new Date().toLocaleString()}</p>
                <p>Please see the attached file for the full report.</p>
            `;
        }

        async formatReport(report, format) {
            switch (format) {
                case 'pdf':
                    return await this.generatePDF(report);
                case 'csv':
                    return this.generateCSV(report);
                case 'excel':
                    return await this.generateExcel(report);
                default:
                    return JSON.stringify(report.data, null, 2);
            }
        }

        async generatePDF(report) {
            // Would use a PDF library like jsPDF
            if (window.jsPDF) {
                const doc = new window.jsPDF();
                doc.text(report.name, 10, 10);
                return doc.output('blob');
            }
            return new Blob([JSON.stringify(report.data)], { type: 'application/json' });
        }

        generateCSV(report) {
            // Convert report data to CSV
            const data = report.data;
            if (Array.isArray(data)) {
                const headers = Object.keys(data[0] || {});
                const rows = data.map(row => 
                    headers.map(h => row[h] || '').join(',')
                );
                return [headers.join(','), ...rows].join('\n');
            }
            return '';
        }

        async generateExcel(report) {
            // Would use a library like SheetJS
            if (window.XLSX) {
                const ws = window.XLSX.utils.json_to_sheet(report.data);
                const wb = window.XLSX.utils.book_new();
                window.XLSX.utils.book_append_sheet(wb, ws, 'Report');
                return window.XLSX.write(wb, { type: 'array' });
            }
            return this.generateCSV(report);
        }

        renderSchedules() {
            const list = document.getElementById('schedules-list');
            if (!list) return;

            list.innerHTML = this.schedules.map(schedule => `
                <div class="schedule-item" data-schedule-id="${schedule.id}">
                    <div class="schedule-header">
                        <input type="checkbox" class="schedule-enabled" ${schedule.enabled ? 'checked' : ''} 
                               data-schedule-id="${schedule.id}" />
                        <h4>${schedule.name}</h4>
                        <span class="schedule-frequency">${schedule.frequency}</span>
                    </div>
                    <div class="schedule-details">
                        <div>Next run: ${new Date(schedule.nextRun).toLocaleString()}</div>
                        ${schedule.lastRun ? 
                            `<div>Last run: ${new Date(schedule.lastRun).toLocaleString()}</div>` : 
                            '<div>Never run</div>'
                        }
                        <div>Recipients: ${schedule.recipients.length}</div>
                    </div>
                    <div class="schedule-actions">
                        <button class="edit-schedule-btn" data-schedule-id="${schedule.id}">Edit</button>
                        <button class="delete-schedule-btn" data-schedule-id="${schedule.id}">Delete</button>
                        <button class="test-schedule-btn" data-schedule-id="${schedule.id}">Test</button>
                    </div>
                </div>
            `).join('');

            // Add event listeners
            list.querySelectorAll('.schedule-enabled').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    this.toggleSchedule(e.target.dataset.scheduleId, e.target.checked);
                });
            });

            list.querySelectorAll('.edit-schedule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.editSchedule(btn.dataset.scheduleId);
                });
            });

            list.querySelectorAll('.delete-schedule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    if (confirm('Delete this schedule?')) {
                        this.deleteSchedule(btn.dataset.scheduleId);
                    }
                });
            });

            list.querySelectorAll('.test-schedule-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.testSchedule(btn.dataset.scheduleId);
                });
            });
        }

        toggleSchedule(scheduleId, enabled) {
            const schedule = this.schedules.find(s => s.id === scheduleId);
            if (schedule) {
                schedule.enabled = enabled;
                this.saveSchedules();
            }
        }

        deleteSchedule(scheduleId) {
            this.schedules = this.schedules.filter(s => s.id !== scheduleId);
            this.saveSchedules();
            this.renderSchedules();
        }

        editSchedule(scheduleId) {
            const schedule = this.schedules.find(s => s.id === scheduleId);
            if (schedule) {
                this.showScheduleEditor(schedule);
            }
        }

        async testSchedule(scheduleId) {
            const schedule = this.schedules.find(s => s.id === scheduleId);
            if (schedule) {
                await this.executeSchedule(schedule);
                alert('Test email sent!');
            }
        }

        showScheduleEditor(schedule) {
            // Show editor modal (simplified)
            alert('Schedule editor would open here');
        }

        generateId() {
            return 'schedule_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        saveSchedules() {
            localStorage.setItem('scheduledReports', JSON.stringify(this.schedules));
        }

        loadSchedules() {
            const stored = localStorage.getItem('scheduledReports');
            if (stored) {
                try {
                    this.schedules = JSON.parse(stored);
                } catch (error) {
                    console.error('Failed to load schedules:', error);
                    this.schedules = [];
                }
            }
        }
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.scheduledReports = new ScheduledReportsSystem();
        });
    } else {
        window.scheduledReports = new ScheduledReportsSystem();
    }
})();


