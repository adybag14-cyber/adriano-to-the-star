/**
 * Data Encryption at Rest and in Transit
 * Encrypt sensitive data
 */
(function() {
    'use strict';

    class DataEncryptionSystem {
        constructor() {
            this.key = null;
            this.init();
        }

        init() {
            this.generateKey();
            this.trackEvent('data_enc_system_initialized');
        }

        async generateKey() {
            if (window.crypto && window.crypto.subtle) {
                this.key = await window.crypto.subtle.generateKey(
                    { name: 'AES-GCM', length: 256 },
                    true,
                    ['encrypt', 'decrypt']
                );
            }
        }

        async encrypt(data) {
            if (!this.key) await this.generateKey();
            const encoder = new TextEncoder();
            const dataBuffer = encoder.encode(JSON.stringify(data));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));
            const encrypted = await window.crypto.subtle.encrypt(
                { name: 'AES-GCM', iv: iv },
                this.key,
                dataBuffer
            );
            return {
                encrypted: Array.from(new Uint8Array(encrypted)),
                iv: Array.from(iv)
            };
        }

        async decrypt(encryptedData) {
            if (!this.key) await this.generateKey();
            const decrypted = await window.crypto.subtle.decrypt(
                { name: 'AES-GCM', iv: new Uint8Array(encryptedData.iv) },
                this.key,
                new Uint8Array(encryptedData.encrypted)
            );
            const decoder = new TextDecoder();
            return JSON.parse(decoder.decode(decrypted));
        }

        trackEvent(eventName, data = {}) {
            try {
                if (window.performanceMonitoring) {
                    window.performanceMonitoring.recordMetric(`data_enc_system_${eventName}`, 1, data);
                }
            } catch (e) { /* Silent fail */ }
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.dataEncryption = new DataEncryptionSystem();
        });
    } else {
        window.dataEncryption = new DataEncryptionSystem();
    }
})();


