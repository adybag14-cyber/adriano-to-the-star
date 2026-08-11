/**
 * Two-Factor Authentication (2FA) System
 * 
 * ⚠️ DEPRECATED ⚠️
 * This file is deprecated. Please use `two-factor-auth.js` instead.
 * 
 * Implements TOTP-based 2FA for enhanced security
 * 
 * Features:
 * - TOTP (Time-based One-Time Password) generation
 * - QR code for authenticator apps
 * - Backup codes
 * - Recovery options
 * - Supabase integration
 * 
 * SECURITY WARNING:
 * This is a CLIENT-SIDE DEMO implementation. It does not provide real security.
 * TOTP verification must happen on the SERVER (Supabase Edge Function) to be secure.
 * Use this for UI prototyping only.
 */

class TwoFactorAuthentication {
    constructor() {
        this.isEnabled = false;
        this.secret = null;
        this.backupCodes = [];
        this.init();
    }

    init() {
        this.checkStatus();
        console.log('🔐 Two-Factor Authentication initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("t_wo_fa_ct_or_au_th_en_ti_ca_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async checkStatus() {
        try {
            // Check if user has 2FA enabled
            if (window.supabase && window.supabase.auth?.user) {
                const { data, error } = await window.supabase
                    .from('user_2fa')
                    .select('*')
                    .eq('user_id', window.supabase.auth.user.id)
                    .single();

                if (data && !error) {
                    this.isEnabled = data.enabled;
                    this.secret = data.secret;
                }
            }
        } catch (e) {
            console.warn('Failed to check 2FA status:', e);
        }
    }

    async enable() {
        try {
            // Generate secret
            this.secret = this.generateSecret();

            // Generate backup codes
            this.backupCodes = this.generateBackupCodes();

            // Show setup UI
            this.showSetupUI();
        } catch (e) {
            console.error('Failed to enable 2FA:', e);
            alert('Failed to enable 2FA. Please try again.');
        }
    }

    generateSecret() {
        // Generate 32-character base32 secret
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            codes.push(this.generateBackupCode());
        }
        return codes;
    }

    generateBackupCode() {
        return Math.random().toString(36).substring(2, 10).toUpperCase() +
            Math.random().toString(36).substring(2, 10).toUpperCase();
    }

    showSetupUI() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        const issuer = 'Adriano To The Star';
        const account = window.supabase?.auth?.user?.email || 'user';
        const otpAuthUrl = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${this.secret}&issuer=${encodeURIComponent(issuer)}`;

        modal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Enable Two-Factor Authentication</h2>
                <p style="margin-bottom: 20px;">Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)</p>
                <div id="qr-code-container" style="
                    background: white;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                ">
                    <p>QR Code will appear here</p>
                    <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">Secret: ${this.secret}</p>
                </div>
                <p style="font-size: 0.9rem; margin-bottom: 15px;">Or enter this code manually:</p>
                <code style="
                    display: block;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                    word-break: break-all;
                ">${this.secret}</code>
                <div style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px;">Enter verification code:</label>
                    <input type="text" id="2fa-verify-code" placeholder="000000" maxlength="6" style="
                        width: 100%;
                        padding: 10px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        border-radius: 6px;
                        color: white;
                        font-size: 1.2rem;
                        text-align: center;
                        letter-spacing: 5px;
                    ">
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="verify-2fa" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(186, 148, 79, 0.5);
                        border: 1px solid #ba944f;
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Verify & Enable</button>
                    <button id="cancel-2fa" style="
                        flex: 1;
                        padding: 12px;
                        background: rgba(255, 255, 255, 0.1);
                        border: 1px solid rgba(255, 255, 255, 0.3);
                        color: white;
                        border-radius: 6px;
                        cursor: pointer;
                    ">Cancel</button>
                </div>
            </div>
        `;

        // Generate QR code (using QR.js library or API)
        this.generateQRCode(otpAuthUrl, modal.querySelector('#qr-code-container'));

        modal.querySelector('#verify-2fa').addEventListener('click', () => {
            this.verifyAndEnable(modal);
        });

        modal.querySelector('#cancel-2fa').addEventListener('click', () => {
            modal.remove();
        });

        document.body.appendChild(modal);
    }

    generateQRCode(data, container) {
        // Use QR code library or API
        // For now, show manual entry option
        container.innerHTML = `
            <p style="color: #000; margin-bottom: 10px;">Scan with authenticator app</p>
            <div style="
                width: 200px;
                height: 200px;
                background: #f0f0f0;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                border: 2px solid #ccc;
            ">
                <p style="color: #666;">QR Code</p>
            </div>
            <p style="font-size: 0.8rem; color: #666; margin-top: 10px;">Install a QR code library to generate</p>
        `;
    }

    async verifyAndEnable(modal) {
        const code = modal.querySelector('#2fa-verify-code').value;
        if (!code || code.length !== 6) {
            alert('Please enter a 6-digit code');
            return;
        }

        // Verify TOTP code
        const isValid = this.verifyTOTP(code, this.secret);

        if (isValid) {
            // Save to Supabase
            if (window.supabase && window.supabase.auth?.user) {
                const { error } = await window.supabase
                    .from('user_2fa')
                    .upsert({
                        user_id: window.supabase.auth.user.id,
                        enabled: true,
                        secret: this.secret,
                        backup_codes: this.backupCodes,
                        created_at: new Date().toISOString()
                    });

                if (error) {
                    console.error('Failed to save 2FA:', error);
                    alert('Failed to enable 2FA. Please try again.');
                    return;
                }
            }

            this.isEnabled = true;
            this.showBackupCodes(modal);
        } else {
            alert('Invalid code. Please try again.');
        }
    }

    verifyTOTP(code, secret) {
        // Simplified TOTP verification
        // In production, use a proper TOTP library
        const time = Math.floor(Date.now() / 1000 / 30);
        // This is a placeholder - implement proper TOTP algorithm
        return code.length === 6 && /^\d+$/.test(code);
    }

    showBackupCodes(modal) {
        const backupModal = document.createElement('div');
        backupModal.style.cssText = modal.style.cssText;
        backupModal.innerHTML = `
            <div style="
                background: rgba(0, 0, 0, 0.95);
                border: 2px solid #ba944f;
                border-radius: 12px;
                padding: 30px;
                max-width: 500px;
                width: 90%;
                color: white;
            ">
                <h2 style="color: #ba944f; margin: 0 0 20px 0;">Save Your Backup Codes</h2>
                <p style="margin-bottom: 20px;">Store these codes in a safe place. You can use them to access your account if you lose your device.</p>
                <div style="
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                ">
                    ${this.backupCodes.map(code => `
                        <div style="
                            padding: 8px;
                            margin: 5px 0;
                            background: rgba(186, 148, 79, 0.2);
                            border-radius: 4px;
                            font-family: monospace;
                        ">${code}</div>
                    `).join('')}
                </div>
                <button id="done-2fa" style="
                    width: 100%;
                    padding: 12px;
                    background: rgba(186, 148, 79, 0.5);
                    border: 1px solid #ba944f;
                    color: white;
                    border-radius: 6px;
                    cursor: pointer;
                ">I've Saved These Codes</button>
            </div>
        `;

        backupModal.querySelector('#done-2fa').addEventListener('click', () => {
            modal.remove();
            backupModal.remove();
            alert('2FA has been enabled successfully!');
        });

        document.body.appendChild(backupModal);
    }

    async verifyLogin(code) {
        if (!this.isEnabled) return true;

        const isValid = this.verifyTOTP(code, this.secret);
        if (!isValid) {
            // Check backup codes
            return this.checkBackupCode(code);
        }
        return isValid;
    }

    checkBackupCode(code) {
        // Check if code is a backup code and remove it if used
        const index = this.backupCodes.indexOf(code);
        if (index > -1) {
            this.backupCodes.splice(index, 1);
            // Update in database
            return true;
        }
        return false;
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.twoFactorAuthentication = new TwoFactorAuthentication();
    });
} else {
    window.twoFactorAuthentication = new TwoFactorAuthentication();
}
