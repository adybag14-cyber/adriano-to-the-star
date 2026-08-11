/**
 * OAuth Integration with Third-Party Services
 * 
 * Adds comprehensive integration with third-party services (OAuth).
 * 
 * @module OAuthIntegrationSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class OAuthIntegrationSystem {
    constructor() {
        this.providers = new Map();
        this.tokens = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize OAuth system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('OAuthIntegrationSystem already initialized');
            return;
        }

        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
        if (!isLocal) {
            return;
        }

        this.setupProviders();
        this.loadTokens();
        this.handleCallback();
        
        this.isInitialized = true;
        console.log('✅ OAuth Integration System initialized');
    }

    /**
     * Set up OAuth providers
     * @private
     */
    setupProviders() {
        // Google OAuth
        this.registerProvider('google', {
            authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
            tokenUrl: 'https://oauth2.googleapis.com/token',
            scope: 'openid email profile',
            clientId: null, // Should be set via config
            redirectUri: `${window.location.origin}/oauth/callback`
        });

        // GitHub OAuth
        this.registerProvider('github', {
            authUrl: 'https://github.com/login/oauth/authorize',
            tokenUrl: 'https://github.com/login/oauth/access_token',
            scope: 'user:email',
            clientId: null, // Should be set via config
            redirectUri: `${window.location.origin}/oauth/callback`
        });

        // Facebook OAuth
        this.registerProvider('facebook', {
            authUrl: 'https://www.facebook.com/v18.0/dialog/oauth',
            tokenUrl: 'https://graph.facebook.com/v18.0/oauth/access_token',
            scope: 'email',
            clientId: null, // Should be set via config
            redirectUri: `${window.location.origin}/oauth/callback`
        });
    }

    /**
     * Register OAuth provider
     * @public
     * @param {string} name - Provider name
     * @param {Object} config - Provider configuration
     */
    registerProvider(name, config) {
        this.providers.set(name, config);
    }

    /**
     * Configure provider
     * @public
     * @param {string} name - Provider name
     * @param {string} clientId - Client ID
     * @param {string} clientSecret - Client secret (optional, for server-side)
     */
    configureProvider(name, clientId, clientSecret = null) {
        const provider = this.providers.get(name);
        if (provider) {
            provider.clientId = clientId;
            provider.clientSecret = clientSecret;
        }
    }

    /**
     * Initiate OAuth flow
     * @public
     * @param {string} provider - Provider name
     * @returns {Promise<string>} Authorization URL
     */
    async initiateAuth(provider) {
        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            throw new Error(`Provider '${provider}' not found`);
        }

        if (!providerConfig.clientId) {
            throw new Error(`Provider '${provider}' not configured`);
        }

        // Generate state for CSRF protection
        const state = this.generateState();
        sessionStorage.setItem(`oauth-state-${provider}`, state);

        // Build authorization URL
        const params = new URLSearchParams({
            client_id: providerConfig.clientId,
            redirect_uri: providerConfig.redirectUri,
            response_type: 'code',
            scope: providerConfig.scope,
            state: state
        });

        const authUrl = `${providerConfig.authUrl}?${params.toString()}`;
        
        // Redirect to authorization URL
        window.location.href = authUrl;

        return authUrl;
    }

    /**
     * Handle OAuth callback
     * @private
     */
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const provider = urlParams.get('provider') || this.detectProvider();

        if (code && state && provider) {
            this.exchangeCodeForToken(provider, code, state);
        }
    }

    async fetchJSON(url, options = {}) {
        try {
            const res = await fetch(url, options);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return await res.json();
        } catch (e) {
            console.warn(`[oauth-integration] Direct fetch failed for ${url}, attempting proxy...`, e.message);
            
            // Try AllOrigins first
            try {
                const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                const data = await proxyRes.json();
                if (data && data.contents) {
                    return JSON.parse(data.contents);
                }
            } catch (proxyError) {
                console.warn('[oauth-integration] AllOrigins proxy failed, trying corsproxy.io...', proxyError.message);
            }

            // Fallback to corsproxy.io
            try {
                const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
                const proxyRes = await fetch(proxyUrl, options);
                if (!proxyRes.ok) throw new Error(`Proxy HTTP ${proxyRes.status}`);
                return await proxyRes.json();
            } catch (proxyError) {
                console.error('[oauth-integration] All proxies failed:', proxyError.message);
                throw e; // Re-throw original error
            }
        }
    }

    /**
     * Exchange code for token
     * @private
     * @param {string} provider - Provider name
     * @param {string} code - Authorization code
     * @param {string} state - State parameter
     */
    async exchangeCodeForToken(provider, code, state) {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0';
        if (!isLocal) {
            return;
        }

        // Verify state
        const savedState = sessionStorage.getItem(`oauth-state-${provider}`);
        if (state !== savedState) {
            console.error('Invalid state parameter');
            return;
        }

        sessionStorage.removeItem(`oauth-state-${provider}`);

        const providerConfig = this.providers.get(provider);
        if (!providerConfig) {
            return;
        }

        try {
            if (providerConfig.clientSecret) {
                return;
            }

            const tokenData = await this.fetchJSON(providerConfig.tokenUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    client_id: providerConfig.clientId,
                    code: code,
                    redirect_uri: providerConfig.redirectUri,
                    grant_type: 'authorization_code'
                })
            });

            if (tokenData) {
                this.saveToken(provider, tokenData);
                
                // Get user info
                await this.getUserInfo(provider, tokenData.access_token);
            }
        } catch (error) {
            console.error('Token exchange failed:', error);
        }
    }

    /**
     * Get user info
     * @private
     * @param {string} provider - Provider name
     * @param {string} accessToken - Access token
     */
    async getUserInfo(provider, accessToken) {
        const userInfoUrls = {
            google: 'https://www.googleapis.com/oauth2/v2/userinfo',
            github: 'https://api.github.com/user',
            facebook: 'https://graph.facebook.com/me?fields=id,name,email'
        };

        const url = userInfoUrls[provider];
        if (!url) {
            return;
        }

        try {
            const userInfo = await this.fetchJSON(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            if (userInfo) {
                this.handleUserInfo(provider, userInfo);
            }
        } catch (error) {
            console.error('Failed to get user info:', error);
        }
    }

    /**
     * Handle user info
     * @private
     * @param {string} provider - Provider name
     * @param {Object} userInfo - User information
     */
    handleUserInfo(provider, userInfo) {
        // Store user info
        const user = {
            id: userInfo.id || userInfo.sub,
            name: userInfo.name,
            email: userInfo.email,
            provider: provider,
            avatar: userInfo.picture || userInfo.avatar_url
        };

        localStorage.setItem('stellar-ai-user', JSON.stringify(user));

        // Dispatch event
        window.dispatchEvent(new CustomEvent('oauth-login-success', {
            detail: { provider, user }
        }));
    }

    /**
     * Save token
     * @private
     * @param {string} provider - Provider name
     * @param {Object} tokenData - Token data
     */
    saveToken(provider, tokenData) {
        this.tokens.set(provider, {
            ...tokenData,
            expiresAt: tokenData.expires_in 
                ? Date.now() + (tokenData.expires_in * 1000)
                : null
        });
        this.saveTokens();
    }

    /**
     * Get token
     * @public
     * @param {string} provider - Provider name
     * @returns {Object|null} Token data
     */
    getToken(provider) {
        const token = this.tokens.get(provider);
        if (!token) {
            return null;
        }

        // Check if expired
        if (token.expiresAt && Date.now() > token.expiresAt) {
            this.tokens.delete(provider);
            this.saveTokens();
            return null;
        }

        return token;
    }

    /**
     * Detect provider from URL
     * @private
     * @returns {string|null} Provider name
     */
    detectProvider() {
        const referrer = document.referrer;
        if (referrer.includes('google.com')) {
            return 'google';
        }
        if (referrer.includes('github.com')) {
            return 'github';
        }
        if (referrer.includes('facebook.com')) {
            return 'facebook';
        }
        return null;
    }

    /**
     * Generate state
     * @private
     * @returns {string} State string
     */
    generateState() {
        return Math.random().toString(36).substring(2, 15) + 
               Math.random().toString(36).substring(2, 15);
    }

    /**
     * Save tokens
     * @private
     */
    saveTokens() {
        try {
            const tokens = Object.fromEntries(this.tokens);
            localStorage.setItem('oauth-tokens', JSON.stringify(tokens));
        } catch (e) {
            console.warn('Failed to save tokens:', e);
        }
    }

    /**
     * Load tokens
     * @private
     */
    loadTokens() {
        try {
            const saved = localStorage.getItem('oauth-tokens');
            if (saved) {
                const tokens = JSON.parse(saved);
                Object.entries(tokens).forEach(([key, value]) => {
                    this.tokens.set(key, value);
                });
            }
        } catch (e) {
            console.warn('Failed to load tokens:', e);
        }
    }
}

// Create global instance
window.OAuthIntegrationSystem = OAuthIntegrationSystem;
window.oauthIntegration = new OAuthIntegrationSystem();
window.oauthIntegration.init();

