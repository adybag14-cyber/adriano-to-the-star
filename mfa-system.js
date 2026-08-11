/**
 * MFA System
 * Multi-Factor Authentication system
 */

class MFASystem {
    constructor() {
        this.users = new Map();
        this.devices = new Map();
        this.verifications = new Map();
        this.init();
    }

    init() {
        this.trackEvent('m_fa_sy_st_em_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("m_fa_sy_st_em_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    registerUser(userId, userData) {
        const user = {
            id: userId,
            ...userData,
            mfaEnabled: userData.mfaEnabled || false,
            methods: userData.methods || [],
            createdAt: new Date()
        };
        
        this.users.set(userId, user);
        console.log(`User registered for MFA: ${userId}`);
        return user;
    }

    registerDevice(userId, deviceData) {
        const device = {
            id: `device_${Date.now()}`,
            userId,
            ...deviceData,
            type: deviceData.type || 'totp',
            secret: deviceData.secret || this.generateSecret(),
            verified: false,
            createdAt: new Date()
        };
        
        this.devices.set(device.id, device);
        return device;
    }

    generateSecret() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    verifyCode(userId, code, deviceId = null) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        if (!user.mfaEnabled) {
            return { verified: false, reason: 'MFA not enabled' };
        }
        
        let devices = Array.from(this.devices.values())
            .filter(d => d.userId === userId && d.verified);
        
        if (deviceId) {
            devices = devices.filter(d => d.id === deviceId);
        }
        
        if (devices.length === 0) {
            return { verified: false, reason: 'No verified devices' };
        }
        
        const verification = {
            id: `verify_${Date.now()}`,
            userId,
            code,
            verified: this.validateCode(code, devices[0]),
            timestamp: new Date(),
            createdAt: new Date()
        };
        
        this.verifications.set(verification.id, verification);
        
        return verification;
    }

    validateCode(code, device) {
        return code.length === 6 && /^\d+$/.test(code);
    }

    enableMFA(userId) {
        const user = this.users.get(userId);
        if (!user) {
            throw new Error('User not found');
        }
        
        user.mfaEnabled = true;
        return user;
    }

    getUser(userId) {
        return this.users.get(userId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.mfaSystem = new MFASystem();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MFASystem;
}

