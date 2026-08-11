/**
 * Data Access Request and Approval Workflow
 * Request and approve data access
 */
(function() {
    'use strict';

    class DataAccessRequestWorkflow {
        constructor() {
            this.requests = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('data_access_request_initialized');
        }

        setupUI() {
            if (!document.getElementById('access-requests')) {
                const requests = document.createElement('div');
                requests.id = 'access-requests';
                requests.className = 'access-requests';
                requests.innerHTML = `
                    <div class="requests-header">
                        <h2>Access Requests</h2>
                        <button class="create-request-btn" id="create-request-btn">Request Access</button>
                    </div>
                    <div class="requests-list" id="requests-list"></div>
                `;
                document.body.appendChild(requests);
            }
        }

        createRequest(dataId, reason) {
            const request = {
                id: this.generateId(),
                dataId: dataId,
                reason: reason,
                status: 'pending',
                requestedBy: this.getCurrentUser(),
                requestedAt: new Date().toISOString()
            };
            this.requests.push(request);
            return request;
        }

        approveRequest(requestId) {
            const request = this.requests.find(r => r.id === requestId);
            if (request) {
                request.status = 'approved';
                request.approvedAt = new Date().toISOString();
            }
        }

        rejectRequest(requestId) {
            const request = this.requests.find(r => r.id === requestId);
            if (request) {
                request.status = 'rejected';
                request.rejectedAt = new Date().toISOString();
            }
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
                    window.performanceMonitoring.recordMetric(`data_access_request_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.accessRequests = new DataAccessRequestWorkflow();
        });
    } else {
        window.accessRequests = new DataAccessRequestWorkflow();
    }
})();

