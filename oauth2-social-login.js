/**
 * OAuth2 Social Login Providers
 * Social media authentication
 */

class OAuth2SocialLogin {
    constructor() {
        this.providers = ['google', 'github', 'facebook', 'twitter'];
        this.init();
    }
    
    init() {
        this.createSocialButtons();
    }
    
    createSocialButtons() {
        const container = document.createElement('div');
        container.id = 'social-login-buttons';
        container.style.cssText = 'display:flex;gap:10px;margin-top:15px;';
        
        this.providers.forEach(provider => {
            const btn = document.createElement('button');
            btn.textContent = provider.charAt(0).toUpperCase() + provider.slice(1);
            btn.style.cssText = `
                flex: 1;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: white;
                border-radius: 6px;
                cursor: pointer;
            `;
            btn.addEventListener('click', () => this.loginWithProvider(provider));
            container.appendChild(btn);
        });
        
        document.querySelectorAll('form[data-login]').forEach(form => {
            form.appendChild(container.cloneNode(true));
        });
    }
    
    async loginWithProvider(provider) {
        try {
            if (window.supabase) {
                const { data, error } = await window.supabase.auth.signInWithOAuth({
                    provider: provider,
                    options: {
                        redirectTo: window.location.origin
                    }
                });
                
                if (error) throw error;
            }
        } catch (e) {
            console.error(`Failed to login with ${provider}:`, e);
            if (window.toastNotificationQueue) {
                window.toastNotificationQueue.show(`Login with ${provider} failed`, 'error');
            }
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.oauth2SocialLogin = new OAuth2SocialLogin(); });
} else {
    window.oauth2SocialLogin = new OAuth2SocialLogin();
}


