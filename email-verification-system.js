/**
 * Email Verification System
 * Email verification for accounts
 */

class EmailVerificationSystem {
    constructor() {
        this.init();
    }
    
    init() {
        this.checkVerificationStatus();
        this.trackEvent('email_verification_initialized');
    }
    
    async checkVerificationStatus() {
        try {
            if (window.supabase?.auth?.user) {
                const user = window.supabase.auth.user;
                if (!user.email_confirmed_at) {
                    this.showVerificationPrompt();
                }
            }
        } catch (e) {
            console.warn('Failed to check verification:', e);
        }
    }
    
    showVerificationPrompt() {
        const banner = document.createElement('div');
        banner.id = 'email-verification-banner';
        banner.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(59, 130, 246, 0.95);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 10000;
        `;
        
        banner.innerHTML = `
            <span>Please verify your email address. </span>
            <button id="resend-verification" style="margin-left:10px;padding:5px 15px;background:rgba(0,0,0,0.3);border:1px solid white;color:white;border-radius:4px;cursor:pointer;">Resend Email</button>
            <button id="dismiss-verification" style="margin-left:10px;padding:5px 15px;background:transparent;border:none;color:white;cursor:pointer;">×</button>
        `;
        
        document.body.appendChild(banner);
        
        document.getElementById('resend-verification').addEventListener('click', () => {
            this.resendVerification();
        });
        
        document.getElementById('dismiss-verification').addEventListener('click', () => {
            banner.remove();
        });
    }
    
    async resendVerification() {
        try {
            if (window.supabase) {
                const { error } = await window.supabase.auth.resend({
                    type: 'signup',
                    email: window.supabase.auth.user?.email
                });
                
                if (!error) {
                    if (window.toastNotificationQueue) {
                        window.toastNotificationQueue.show('Verification email sent!', 'success');
                    }
                }
            }
        } catch (e) {
            console.error('Failed to resend verification:', e);
        }
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`email_verification_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.emailVerificationSystem = new EmailVerificationSystem(); });
} else {
    window.emailVerificationSystem = new EmailVerificationSystem();
}


