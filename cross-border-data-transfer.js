/**
 * Cross-Border Data Transfer Controls
 * Control cross-border data transfers
 */
(function() {
    'use strict';

    class CrossBorderDataTransfer {
        constructor() {
            this.transfers = [];
            this.safeguards = [];
            this.init();
        }

        init() {
            this.setupUI();
            this.trackEvent('cross_border_initialized');
        }

        setupUI() {
            if (!document.getElementById('cross-border-transfer')) {
                const transfer = document.createElement('div');
                transfer.id = 'cross-border-transfer';
                transfer.className = 'cross-border-transfer';
                transfer.innerHTML = `<h2>Cross-Border Data Transfer</h2>`;
                document.body.appendChild(transfer);
            }
        }

        requestTransfer(config) {
            const transfer = {
                id: this.generateId(),
                destination: config.destination,
                dataType: config.dataType,
                purpose: config.purpose,
                safeguards: config.safeguards || [],
                status: 'pending',
                requestedAt: new Date().toISOString()
            };
            this.transfers.push(transfer);
            this.validateTransfer(transfer);
            return transfer;
        }

        validateTransfer(transfer) {
            // Check if transfer is allowed
            const allowed = this.isTransferAllowed(transfer.destination);
            if (allowed) {
                transfer.status = 'approved';
            } else {
                transfer.status = 'requires_safeguards';
                this.requireSafeguards(transfer);
            }
        }

        isTransferAllowed(destination) {
            // Check if destination country has adequate protection
            const adequateCountries = ['EEA', 'Switzerland', 'UK', 'Canada', 'Japan'];
            return adequateCountries.includes(destination);
        }

        requireSafeguards(transfer) {
            // Require additional safeguards (SCCs, BCRs, etc.)
            transfer.safeguards.push('standard_contractual_clauses');
        }

        generateId() {
            return 'transfer_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`cross_border_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.crossBorderTransfer = new CrossBorderDataTransfer();
        });
    } else {
        window.crossBorderTransfer = new CrossBorderDataTransfer();
    }
})();

