/**
 * Device Management and Trusted Devices
 * Manage and trust devices
 */

class DeviceManagementTrusted {
    constructor() {
        this.devices = [];
        this.init();
    }
    
    init() {
        this.loadDevices();
        this.trackEvent('device_mgmt_trusted_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`device_mgmt_trusted_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    async loadDevices() {
        try {
            if (window.supabase) {
                const { data } = await window.supabase
                    .from('trusted_devices')
                    .select('*')
                    .eq('user_id', window.supabase.auth.user?.id);
                
                if (data) this.devices = data;
            }
        } catch (e) {
            console.warn('Failed to load devices:', e);
        }
    }
    
    async addTrustedDevice() {
        const deviceInfo = {
            user_agent: navigator.userAgent,
            platform: navigator.platform,
            timestamp: new Date().toISOString()
        };
        
        try {
            if (window.supabase) {
                await window.supabase
                    .from('trusted_devices')
                    .insert({
                        user_id: window.supabase.auth.user?.id,
                        device_info: deviceInfo,
                        trusted: true
                    });
            }
        } catch (e) {
            console.error('Failed to add device:', e);
        }
    }
    
    async removeDevice(deviceId) {
        try {
            if (window.supabase) {
                await window.supabase
                    .from('trusted_devices')
                    .delete()
                    .eq('id', deviceId);
            }
        } catch (e) {
            console.error('Failed to remove device:', e);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.deviceManagementTrusted = new DeviceManagementTrusted(); });
} else {
    window.deviceManagementTrusted = new DeviceManagementTrusted();
}


