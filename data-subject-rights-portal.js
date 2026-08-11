/**
 * Data Subject Rights Portal
 * Portal for data subject rights
 */
(function() {
    'use strict';

    class DataSubjectRightsPortal {
        constructor() {
            this.requests = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_subject_rights_portal_initialized');
        }

        setupUI() {
            if (!document.getElementById('data-rights-portal')) {
                const portal = document.createElement('div');
                portal.id = 'data-rights-portal';
                portal.className = 'data-rights-portal';
                portal.innerHTML = `
                    <div class="portal-header">
                        <h2>Data Subject Rights</h2>
                    </div>
                    <div class="rights-options">
                        <button class="right-btn" data-right="access">Request Data Access</button>
                        <button class="right-btn" data-right="rectification">Request Data Correction</button>
                        <button class="right-btn" data-right="erasure">Request Data Deletion</button>
                        <button class="right-btn" data-right="portability">Request Data Portability</button>
                        <button class="right-btn" data-right="objection">Object to Processing</button>
                    </div>
                    <div class="requests-list" id="requests-list"></div>
                `;
                document.body.appendChild(portal);
            }

            document.querySelectorAll('.right-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.requestRight(btn.dataset.right);
                });
            });
        }

        requestRight(right) {
            const request = {
                id: this.generateId(),
                right: right,
                userId: this.getCurrentUser(),
                status: 'pending',
                requestedAt: new Date().toISOString()
            };
            this.requests.push(request);
            this.renderRequests();
            this.processRequest(request);
        }

        async processRequest(request) {
            switch (request.right) {
                case 'access':
                    await this.processAccessRequest(request);
                    break;
                case 'erasure':
                    await this.processErasureRequest(request);
                    break;
                case 'portability':
                    await this.processPortabilityRequest(request);
                    break;
            }
        }

        async processAccessRequest(request) {
            const userData = await this.getUserData(request.userId);
            request.data = userData;
            request.status = 'completed';
            this.renderRequests();
        }

        async processErasureRequest(request) {
            await this.deleteUserData(request.userId);
            request.status = 'completed';
            this.renderRequests();
        }

        async processPortabilityRequest(request) {
            const userData = await this.getUserData(request.userId);
            const exportData = JSON.stringify(userData, null, 2);
            this.downloadFile(exportData, `data-export-${Date.now()}.json`, 'application/json');
            request.status = 'completed';
            this.renderRequests();
        }

        async getUserData(userId) {
            if (window.database?.getUserData) {
                return await window.database.getUserData(userId);
            }
            return {};
        }

        async deleteUserData(userId) {
            if (window.database?.deleteUserData) {
                await window.database.deleteUserData(userId);
            }
        }

        downloadFile(data, filename, mimeType) {
            const blob = new Blob([data], { type: mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            URL.revokeObjectURL(url);
        }

        renderRequests() {
            const list = document.getElementById('requests-list');
            if (!list) return;

            list.innerHTML = this.requests.map(req => `
                <div class="request-item ${req.status}">
                    <div class="request-right">${req.right}</div>
                    <div class="request-status">${req.status}</div>
                    <div class="request-date">${new Date(req.requestedAt).toLocaleDateString()}</div>
                </div>
            `).join('');
        }

        getCurrentUser() {
            return window.supabase?.auth?.user()?.id || 'anonymous';
        }

        generateId() {
            return 'request_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_subject_rights_portal_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataRightsPortal = new DataSubjectRightsPortal();
        });
    } else {
        window.dataRightsPortal = new DataSubjectRightsPortal();
    }
})();

