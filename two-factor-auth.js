/**
 * Two-Factor Authentication (2FA) System
 * TOTP support with backup codes and QR setup
 * 
 * SECURITY WARNING:
 * This is a CLIENT-SIDE DEMO implementation. It does not provide real security.
 * TOTP verification must happen on the SERVER (Supabase Edge Function) to be secure.
 * Use this for UI prototyping only.
 */

class TwoFactorAuth {
    constructor() {
        this.isInitialized = false;
        this.currentUser = null;
        this.secret = null;
        this.backupCodes = [];

        this.init();
    }

    /**
     * Initialize 2FA system
     */
    async init() {
        // Check if Supabase is available
        if (window.supabase) {
            const { data: { user } } = await window.supabase.auth.getUser();
            if (user) {
                this.currentUser = user;
                await this.loadUser2FAStatus();
            }
        }

        this.isInitialized = true;
        console.log('🔐 Two-Factor Authentication initialized');
    }

    /**
     * Load user's 2FA status
     */
    async loadUser2FAStatus() {
        if (!this.currentUser || !window.supabase) return;

        try {
            const { data, error } = await window.supabase
                .from('user_2fa')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 = not found
                throw error;
            }

            if (data) {
                this.secret = data.secret;
                this.backupCodes = data.backup_codes || [];
            }
        } catch (error) {
            console.error('Error loading 2FA status:', error);
        }
    }

    /**
     * Generate TOTP secret and QR code
     */
    async setup2FA() {
        if (!this.currentUser) {
            alert('Please log in to enable 2FA');
            return;
        }

        try {
            // Call Supabase Edge Function to generate secret
            // SECURITY: Secret generation moved to server
            let secret = null;

            if (window.supabase) {
                const { data, error } = await window.supabase.functions.invoke('verify-2fa', {
                    body: { action: 'generate-secret' }
                });

                if (error) throw error;
                secret = data.secret;
            } else {
                // Fallback for demo/offline
                console.warn('⚠️ using insecure client-side fallback');
                secret = this.generateSecret();
            }

            this.secret = secret;

            // Generate backup codes (can remain client-side or move to server too)
            this.backupCodes = this.generateBackupCodes();

            // Show setup modal
            this.showSetupModal();

        } catch (error) {
            console.error('Error setting up 2FA:', error);
            alert('Failed to set up 2FA. Connection to server failed.');
        }
    }

    /**
     * Generate a TOTP secret
     */
    generateSecret() {
        // In production, use a cryptographically secure random generator
        // For now, generate a base32-encoded secret
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let secret = '';
        for (let i = 0; i < 32; i++) {
            secret += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return secret;
    }

    /**
     * Generate backup codes
     */
    generateBackupCodes() {
        const codes = [];
        for (let i = 0; i < 10; i++) {
            const code = Math.random().toString(36).substring(2, 10).toUpperCase();
            codes.push(code);
        }
        return codes;
    }

    /**
     * Show 2FA setup modal
     */
    showSetupModal() {
        const modal = document.createElement('div');
        modal.id = '2fa-setup-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.95);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Raleway', sans-serif;
        `;

        const otpAuthUrl = `otpauth://totp/AdrianoToTheStar:${this.currentUser.email}?secret=${this.secret}&issuer=AdrianoToTheStar`;
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(otpAuthUrl)}`;

        modal.innerHTML = `
            <div style="background: rgba(0, 0, 0, 0.9); border: 2px solid #ba944f; border-radius: 12px; padding: 2rem; max-width: 600px; width: 90%; max-height: 90vh; overflow-y: auto; color: #fff;">
                <h2 style="color: #ba944f; margin: 0 0 1.5rem 0;">🔐 Set Up Two-Factor Authentication</h2>
                
                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.1rem;">Step 1: Scan QR Code</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem; font-size: 0.9rem;">
                        Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                    </p>
                    <div style="text-align: center; margin: 1.5rem 0;">
                        <img src="${qrCodeUrl}" alt="QR Code" style="border: 2px solid #ba944f; border-radius: 8px; padding: 1rem; background: #fff;">
                    </div>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.1rem;">Step 2: Enter Secret Key</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem; font-size: 0.9rem;">
                        Or manually enter this secret key:
                    </p>
                    <div style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 6px; padding: 1rem; font-family: monospace; word-break: break-all; color: #ba944f; margin-bottom: 1rem;">
                        ${this.secret}
                    </div>
                    <button id="copy-secret-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid #ba944f; color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif;">
                        📋 Copy Secret
                    </button>
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.1rem;">Step 3: Verify Code</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem; font-size: 0.9rem;">
                        Enter the 6-digit code from your authenticator app:
                    </p>
                    <input type="text" id="2fa-verify-code" placeholder="000000" maxlength="6" style="width: 100%; padding: 0.75rem; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 6px; color: #fff; font-size: 1.2rem; text-align: center; letter-spacing: 0.5rem; font-family: monospace;">
                </div>

                <div style="margin-bottom: 2rem;">
                    <h3 style="color: #ba944f; margin-bottom: 1rem; font-size: 1.1rem;">Step 4: Save Backup Codes</h3>
                    <p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 1rem; font-size: 0.9rem;">
                        Save these backup codes in a safe place. You can use them if you lose access to your authenticator app:
                    </p>
                    <div style="background: rgba(186, 148, 79, 0.1); border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 6px; padding: 1rem; font-family: monospace; color: #ba944f; margin-bottom: 1rem;">
                        ${this.backupCodes.map((code, i) => `<div style="padding: 0.25rem 0;">${i + 1}. ${code}</div>`).join('')}
                    </div>
                    <button id="copy-backup-codes-btn" style="background: rgba(186, 148, 79, 0.2); border: 1px solid #ba944f; color: #ba944f; padding: 0.5rem 1rem; border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif;">
                        📋 Copy Backup Codes
                    </button>
                </div>

                <div style="display: flex; gap: 1rem; justify-content: flex-end;">
                    <button id="2fa-cancel-btn" style="background: transparent; border: 1px solid rgba(255, 255, 255, 0.3); color: rgba(255, 255, 255, 0.7); padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif;">
                        Cancel
                    </button>
                    <button id="2fa-enable-btn" style="background: #ba944f; border: none; color: #000; padding: 0.75rem 1.5rem; border-radius: 6px; cursor: pointer; font-family: 'Raleway', sans-serif; font-weight: 600;">
                        Enable 2FA
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        document.getElementById('copy-secret-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.secret);
            alert('Secret copied to clipboard!');
        });

        document.getElementById('copy-backup-codes-btn').addEventListener('click', () => {
            navigator.clipboard.writeText(this.backupCodes.join('\n'));
            alert('Backup codes copied to clipboard!');
        });

        document.getElementById('2fa-verify-code').addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/\D/g, '');
        });

        document.getElementById('2fa-enable-btn').addEventListener('click', () => {
            const code = document.getElementById('2fa-verify-code').value;
            if (code.length !== 6) {
                alert('Please enter a 6-digit code');
                return;
            }
            this.verifyAndEnable(code);
        });

        document.getElementById('2fa-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    /**
     * Verify TOTP code and enable 2FA
     */
    async verifyAndEnable(code) {
        try {
            // In production, verify the TOTP code using a library like 'otplib'
            // For now, we'll do a simple verification
            const isValid = await this.verifyTOTP(code, this.secret);

            if (!isValid) {
                alert('Invalid code. Please try again.');
                return;
            }

            // Save to Supabase
            if (window.supabase && this.currentUser) {
                const { error } = await window.supabase
                    .from('user_2fa')
                    .upsert({
                        user_id: this.currentUser.id,
                        secret: this.secret,
                        backup_codes: this.backupCodes,
                        enabled: true,
                        created_at: new Date().toISOString()
                    });

                if (error) throw error;
            }

            // Save to localStorage as fallback
            if (!window.supabase) {
                localStorage.setItem('2fa-enabled', 'true');
                localStorage.setItem('2fa-secret', this.secret);
                localStorage.setItem('2fa-backup-codes', JSON.stringify(this.backupCodes));
            }

            alert('✅ Two-Factor Authentication enabled successfully!');
            document.getElementById('2fa-setup-modal').remove();

        } catch (error) {
            console.error('Error enabling 2FA:', error);
            alert('Failed to enable 2FA. Please try again.');
        }
    }

    /**
     * Verify TOTP code (simplified - use a proper library in production)
     */
    async verifyTOTP(code, secret) {
        // SECURITY UPDATE: Verification moved to backend

        if (window.supabase) {
            try {
                const { data, error } = await window.supabase.functions.invoke('verify-2fa', {
                    body: {
                        action: 'verify',
                        code: code,
                        secret: secret,
                        userId: this.currentUser?.id
                    }
                });

                if (error) {
                    console.error('2FA Verification Error:', error);
                    return false;
                }

                return data.valid;
            } catch (e) {
                console.error('2FA Verification Exception:', e);
                return false;
            }
        }

        // Fallback for demo/offline (INSECURE)
        console.warn('⚠️ using insecure client-side verification fallback');
        return code.length === 6 && /^\d{6}$/.test(code);
    }

    /**
     * Disable 2FA
     */
    async disable2FA() {
        if (!confirm('Are you sure you want to disable Two-Factor Authentication? This will make your account less secure.')) {
            return;
        }

        try {
            if (window.supabase && this.currentUser) {
                const { error } = await window.supabase
                    .from('user_2fa')
                    .delete()
                    .eq('user_id', this.currentUser.id);

                if (error) throw error;
            }

            localStorage.removeItem('2fa-enabled');
            localStorage.removeItem('2fa-secret');
            localStorage.removeItem('2fa-backup-codes');

            this.secret = null;
            this.backupCodes = [];

            alert('✅ Two-Factor Authentication disabled.');
        } catch (error) {
            console.error('Error disabling 2FA:', error);
            alert('Failed to disable 2FA. Please try again.');
        }
    }

    /**
     * Check if 2FA is enabled
     */
    isEnabled() {
        return localStorage.getItem('2fa-enabled') === 'true' || this.secret !== null;
    }

    /**
     * Verify code during login
     */
    async verifyLoginCode(code) {
        if (!this.secret) {
            return false;
        }

        return await this.verifyTOTP(code, this.secret);
    }
}

// Initialize 2FA globally
if (typeof window !== 'undefined') {
    window.twoFactorAuth = new TwoFactorAuth();

    // Make available globally
    window.get2FA = () => window.twoFactorAuth;
}
