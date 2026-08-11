/**
 * Starsector Authentication System
 * Password protected access with persistent login
 */

const StarsectorAuth = {
    // SHA-256 hash of the password "hashmenow1234"
    PASSWORD_HASH: 'e4cbcd18c1e096553198b463132bc9356ccfebe2e889680524215ff259ba6fe0',

    SESSION_KEY: 'starsector_session',
    SESSION_DURATION: 7 * 24 * 60 * 60 * 1000, // 7 days in ms

    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    async verifyPassword(inputPassword) {
        const inputHash = await this.hashPassword(inputPassword);
        // Simple comparison - in production use constant-time comparison
        return inputHash === this.PASSWORD_HASH;
    },

    createSession() {
        const session = {
            valid: true,
            created: Date.now(),
            expires: Date.now() + this.SESSION_DURATION
        };
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
        return session;
    },

    getSession() {
        try {
            const data = localStorage.getItem(this.SESSION_KEY);
            if (!data) return null;

            const session = JSON.parse(data);
            if (Date.now() > session.expires) {
                this.clearSession();
                return null;
            }
            return session;
        } catch {
            return null;
        }
    },

    isAuthenticated() {
        return this.getSession() !== null;
    },

    clearSession() {
        localStorage.removeItem(this.SESSION_KEY);
    },

    async login(password) {
        const valid = await this.verifyPassword(password);
        if (valid) {
            this.createSession();
            return true;
        }
        return false;
    },

    logout() {
        this.clearSession();
        window.location.href = 'starsector-login.html';
    },

    requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'starsector-login.html';
            return false;
        }
        return true;
    }
};

window.StarsectorAuth = StarsectorAuth;
