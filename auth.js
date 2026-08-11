// Frontend Authentication Manager
// Handles login, registration, token management, and authentication state
// Uses Supabase for secure authentication

class AuthManager {
    constructor() {
        // Supabase Configuration (from supabase-config.js)
        this.supabaseUrl = 'https://sepesbfytkmbgjyfqriw.supabase.co';
        this.supabaseKey = 'sb_publishable_aU2YdyJxTZFH9D5JJJPzeQ_oND2bpw0';

        this.supabase = null;
        this.user = null;

        this.init();
    }

    async init() {
        this.trackEvent('a_ut_hm_an_ag_er_initialized');

        // Load Supabase JS if not already loaded
        if (typeof window.supabase === 'undefined') {
            await this.loadSupabaseScript();
        }

        // Initialize Supabase client
        if (window.supabase && window.supabase.createClient) {
            this.supabase = window.supabase.createClient(this.supabaseUrl, this.supabaseKey);
            console.log('✅ Supabase client initialized');

            // Check for existing session
            const { data: { session } } = await this.supabase.auth.getSession();
            if (session) {
                this.user = session.user;
                // Add useful metadata to user object for compatibility
                this.user.username = this.user.user_metadata.username || this.user.email.split('@')[0];
                this.user.fullName = this.user.user_metadata.full_name;
                console.log('👤 User session restored:', this.user.email);
            }

            // Listen for auth changes
            this.supabase.auth.onAuthStateChange((event, session) => {
                console.log('Auth event:', event);
                if (session) {
                    this.user = session.user;
                    this.user.username = this.user.user_metadata.username || this.user.email.split('@')[0];
                    this.user.fullName = this.user.user_metadata.full_name;
                } else {
                    this.user = null;
                }
                this.updateUI();
            });
        } else {
            console.error('❌ Failed to initialize Supabase client');
        }

        this.updateUI();
        this.trackEvent('auth_mgr_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`auth_mgr_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    loadSupabaseScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Register new user
    async register(username, email, password, fullName) {
        console.log(`📝 Registering user: ${username}`);

        if (!this.supabase) return { success: false, error: 'Auth system not initialized' };

        try {
            const { data, error } = await this.supabase.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        username: username,
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;

            if (data.user) {
                console.log('✓ Registration successful');
                return { success: true, user: data.user };
            } else {
                return { success: false, error: 'Registration failed - check email for confirmation' };
            }
        } catch (error) {
            console.error('✗ Registration error:', error);
            return { success: false, error: error.message };
        }
    }

    // Login user
    async login(username, password) {
        console.log(`🔑 Logging in: ${username}`);

        if (!this.supabase) return { success: false, error: 'Auth system not initialized' };

        try {
            // Supabase uses email for login by default
            // If username is provided, we assume it's an email or we'd need a cloud function to map username->email
            // For now, we'll try to treat it as an email.
            // TODO: If you want username login, you need to store username in a public table and query it first.

            const { data, error } = await this.supabase.auth.signInWithPassword({
                email: username, // Assuming username field contains email
                password: password
            });

            if (error) throw error;

            console.log('✓ Login successful');
            return { success: true, user: data.user };
        } catch (error) {
            console.error('✗ Login error:', error);
            return { success: false, error: error.message };
        }
    }

    // Logout user
    async logout() {
        console.log('👋 Logging out');
        if (this.supabase) {
            await this.supabase.auth.signOut();
        }
        this.user = null;
        this.updateUI();
        window.location.href = 'index.html';
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.user;
    }

    // Get current user
    getCurrentUser() {
        return this.user;
    }

    // Update UI based on authentication state
    updateUI() {
        const isAuth = this.isAuthenticated();

        // Update login/logout buttons
        const loginButtons = document.querySelectorAll('.login-button');
        const logoutButtons = document.querySelectorAll('.logout-button');
        const memberButtons = document.querySelectorAll('.members-only');

        loginButtons.forEach((btn) => {
            btn.style.display = isAuth ? 'none' : 'block';
        });

        logoutButtons.forEach((btn) => {
            btn.style.display = isAuth ? 'block' : 'none';
        });

        memberButtons.forEach((btn) => {
            btn.style.display = isAuth ? 'block' : 'none';
        });

        // Update user info displays
        const userDisplays = document.querySelectorAll('.user-display');
        userDisplays.forEach((display) => {
            if (this.user) {
                const displayName = this.user.user_metadata?.full_name || this.user.user_metadata?.username || this.user.email;
                display.textContent = displayName;
                display.style.display = 'inline';
            } else {
                display.style.display = 'none';
            }
        });

        console.log(`🎨 UI updated - Auth status: ${isAuth}`);
    }
}

// Initialize global auth manager only if one is not already provided
if (!window.authManager) {
    const _authManager = new AuthManager();
    // Make it available globally
    window.authManager = _authManager;
}

// Modal helpers
function _showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}
window.showModal = _showModal;

function _hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }
}

// Close modals when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal') && e.target.classList.contains('active')) {
        e.target.classList.remove('active');
        document.body.style.overflow = '';
    }
});
