/**
 * Phone Number Verification
 * SMS-based phone verification
 */

class PhoneVerificationSystem {
    constructor() {
        this.init();
    }
    
    init() {
        this.createVerificationUI();
    }
    
    createVerificationUI() {
        // Phone verification would be added to registration forms
    }
    
    async sendVerificationCode(phoneNumber) {
        try {
            if (window.supabase) {
                const { error } = await window.supabase.auth.signInWithOtp({
                    phone: phoneNumber
                });
                
                if (!error) {
                    return true;
                }
            }
        } catch (e) {
            console.error('Failed to send verification code:', e);
        }
        return false;
    }
    
    async verifyCode(phoneNumber, code) {
        try {
            if (window.supabase) {
                const { error } = await window.supabase.auth.verifyOtp({
                    phone: phoneNumber,
                    token: code,
                    type: 'sms'
                });
                
                return !error;
            }
        } catch (e) {
            console.error('Failed to verify code:', e);
        }
        return false;
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.phoneVerificationSystem = new PhoneVerificationSystem(); });
} else {
    window.phoneVerificationSystem = new PhoneVerificationSystem();
}


