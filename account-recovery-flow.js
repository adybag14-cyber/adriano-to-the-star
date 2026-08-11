/**
 * Account Recovery Flow
 * Password reset and account recovery
 */

class AccountRecoveryFlow {
    constructor() {
        this.init();
    }
    
    init() {
        this.createRecoveryUI();
        this.trackEvent('recovery_flow_initialized');
    }
    
    createRecoveryUI() {
        const link = document.createElement('a');
        link.href = '#';
        link.textContent = 'Forgot Password?';
        link.style.cssText = 'color:#ba944f;text-decoration:none;margin-left:10px;';
        link.addEventListener('click', (e) => {
            e.preventDefault();
            this.trackEvent('recovery_link_clicked');
            this.showRecoveryModal();
        });
        
        document.querySelectorAll('form[data-login]').forEach(form => {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.parentElement.appendChild(link.cloneNode(true));
        });
    }
    
    showRecoveryModal() {
        if (window.modalStackManagement) {
            window.modalStackManagement.showModal(`
                <div>
                    <p>Enter your email to receive a password reset link:</p>
                    <input type="email" id="recovery-email" placeholder="Email" style="width:100%;padding:10px;margin:10px 0;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.3);border-radius:6px;color:white;">
                    <button id="send-recovery" style="width:100%;padding:10px;background:rgba(186,148,79,0.5);border:1px solid #ba944f;color:white;border-radius:6px;cursor:pointer;margin-top:10px;">Send Recovery Email</button>
                </div>
            `, { title: 'Account Recovery' });
            
            document.getElementById('send-recovery').addEventListener('click', () => {
                const email = document.getElementById('recovery-email').value;
                this.sendRecoveryEmail(email);
            });
        }
    }
    
    async sendRecoveryEmail(email) {
        try {
            if (window.supabase) {
                const { error } = await window.supabase.auth.resetPasswordForEmail(email);
                if (!error) {
                    this.trackEvent('recovery_email_sent', { email });
                    if (window.toastNotificationQueue) {
                        window.toastNotificationQueue.show('Recovery email sent!', 'success');
                    }
                }
            }
        } catch (e) {
            this.trackEvent('recovery_failed', { error: e.message });
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`account_recovery_${eventName}`, 1, data);
            }
            if (window.analytics) {
                window.analytics.track(eventName, { module: 'account_recovery', ...data });
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.accountRecoveryFlow = new AccountRecoveryFlow(); });
} else {
    window.accountRecoveryFlow = new AccountRecoveryFlow();
}


