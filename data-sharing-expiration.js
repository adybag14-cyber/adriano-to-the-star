/**
 * Data Sharing with Expiration Dates
 * Share data with expiration dates
 */
(function() {
    'use strict';

    class DataSharingExpiration {
        constructor() {
            this.shares = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.startExpirationChecker();
            this.trackEvent('data_sharing_exp_initialized');
        }

        setupUI() {
            if (!document.getElementById('data-sharing')) {
                const sharing = document.createElement('div');
                sharing.id = 'data-sharing';
                sharing.className = 'data-sharing';
                sharing.innerHTML = `<h2>Data Sharing</h2>`;
                document.body.appendChild(sharing);
            }
        }

        shareData(data, recipient, expirationDate) {
            const share = {
                id: this.generateId(),
                data: data,
                recipient: recipient,
                expirationDate: expirationDate,
                createdAt: new Date().toISOString()
            };
            this.shares.push(share);
            return share;
        }

        startExpirationChecker() {
            setInterval(() => {
                this.checkExpirations();
            }, 60000);
        }

        checkExpirations() {
            const now = new Date();
            this.shares = this.shares.filter(share => {
                return new Date(share.expirationDate) > now;
            });
        }

        generateId() {
            return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_sharing_exp_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataSharing = new DataSharingExpiration();
        });
    } else {
        window.dataSharing = new DataSharingExpiration();
    }
})();

