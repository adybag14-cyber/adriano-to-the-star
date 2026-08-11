/**
 * Security Activity Log Viewer
 * View security-related activities
 */

class SecurityActivityLogViewer {
    constructor() {
        this.logs = [];
        this.init();
    }
    
    init() {
        this.loadLogs();
        this.createViewer();
        this.trackEvent('sec_activity_log_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`sec_activity_log_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
    
    async loadLogs() {
        try {
            if (window.supabase) {
                const { data } = await window.supabase
                    .from('security_audit_logs')
                    .select('*')
                    .eq('user_id', window.supabase.auth.user?.id)
                    .order('created_at', { ascending: false })
                    .limit(100);
                
                if (data) this.logs = data;
            }
        } catch (e) {
            console.warn('Failed to load logs:', e);
        }
    }
    
    createViewer() {
        const btn = document.createElement('button');
        btn.textContent = '🔒 Security Logs';
        btn.style.cssText = 'position:fixed;bottom:260px;right:20px;padding:12px 20px;background:rgba(186,148,79,0.9);border:2px solid rgba(186,148,79,1);color:white;border-radius:8px;cursor:pointer;z-index:9999;';
        btn.addEventListener('click', () => this.showViewer());
        document.body.appendChild(btn);
    }
    
    showViewer() {
        if (window.modalStackManagement) {
            window.modalStackManagement.showModal(`
                <div style="max-height:500px;overflow-y:auto;">
                    <h3 style="color:#ba944f;margin:0 0 15px 0;">Security Activity Log</h3>
                    <div>
                        ${this.logs.length > 0 ? this.logs.map(log => `
                            <div style="padding:10px;margin-bottom:10px;background:rgba(255,255,255,0.05);border-radius:6px;border-left:3px solid ${this.getSeverityColor(log.severity)};">
                                <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
                                    <strong>${log.event_type}</strong>
                                    <span style="font-size:0.8rem;color:#ccc;">${new Date(log.created_at).toLocaleString()}</span>
                                </div>
                                <div style="font-size:0.9rem;color:#ccc;">${log.details?.message || 'Security event'}</div>
                            </div>
                        `).join('') : '<p>No security events</p>'}
                    </div>
                </div>
            `, { title: 'Security Activity' });
        }
    }
    
    getSeverityColor(severity) {
        const colors = { critical: '#ef4444', warning: '#f59e0b', info: '#3b82f6' };
        return colors[severity] || colors.info;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.securityActivityLogViewer = new SecurityActivityLogViewer(); });
} else {
    window.securityActivityLogViewer = new SecurityActivityLogViewer();
}


