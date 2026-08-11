(() => {
  'use strict';

  const SESSION_KEY = 'ita_session_token';
  const USER_KEY = 'ita_auth_user';

  class D1AuthManager {
    constructor() {
      this.supabase = null;
      this.useSupabase = false;
      this.backend = 'cloudflare-d1';
      this.user = null;
      this.session = null;
      this.token = localStorage.getItem(SESSION_KEY) || null;
      this.isReady = false;
      this.apiBase = window.EXOPLANET_API_BASE || ((location.hostname === 'localhost' || location.hostname === '127.0.0.1') ? 'http://localhost:3002' : 'https://api.adrianotothestar.com');
      this.ready = this.init();
    }

    async init() {
      if (this.token) {
        try {
          const response = await fetch(`${this.apiBase}/api/auth/me`, {
            headers: this.getHeaders(),
            cache: 'no-store',
            signal: AbortSignal.timeout ? AbortSignal.timeout(6000) : undefined
          });
          if (response.ok) {
            const data = await response.json();
            if (data?.success && data.user) {
              this.user = data.user;
              this.session = { access_token: this.token, expires_at: data.expiresAt || null };
              localStorage.setItem(USER_KEY, JSON.stringify(this.user));
            } else {
              this.clearSession();
            }
          } else if (response.status === 401) {
            this.clearSession();
          } else {
            this.restoreCachedUser();
          }
        } catch (error) {
          console.warn('[ITA auth] D1 API unavailable; keeping the existing session cached until it can be revalidated.', error?.message || error);
          this.restoreCachedUser();
        }
      }
      this.updateUI();
      this.markReady();
      return this;
    }

    restoreCachedUser() {
      if (!this.token) return;
      try {
        const cached = JSON.parse(localStorage.getItem(USER_KEY) || 'null');
        if (cached?.id) {
          this.user = cached;
          this.session = { access_token: this.token, cached: true };
        }
      } catch { /* invalid cache is ignored */ }
    }

    clearSession() {
      this.token = null;
      this.user = null;
      this.session = null;
      localStorage.removeItem(SESSION_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    async request(path, options = {}) {
      const headers = new Headers(options.headers || {});
      if (!headers.has('Content-Type') && options.body) headers.set('Content-Type', 'application/json');
      if (this.token && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${this.token}`);
      const response = await fetch(`${this.apiBase}${path}`, { ...options, headers, cache: 'no-store' });
      let data = null;
      try { data = await response.json(); } catch { data = null; }
      return { response, data };
    }

    async register(username, email, password, fullName) {
      username = String(username || '').trim();
      email = String(email || '').trim().toLowerCase();
      fullName = String(fullName || '').trim();
      if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters' };
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, error: 'Please enter a valid email address' };
      if (typeof password !== 'string' || password.length < 8) return { success: false, error: 'Password must be at least 8 characters' };
      try {
        const { response, data } = await this.request('/api/auth/register', {
          method: 'POST',
          body: JSON.stringify({ username, email, password, fullName: fullName || username })
        });
        if (!response.ok || !data?.success) return { success: false, error: data?.error || 'Registration failed' };
        this.acceptSession(data);
        this.updateUI();
        return { success: true, user: this.user };
      } catch (error) {
        console.error('[ITA auth] Registration failed', error);
        return { success: false, error: 'Registration service is temporarily unavailable. Please try again.' };
      }
    }

    async login(username, password) {
      const identifier = String(username || '').trim();
      if (!identifier || !password) return { success: false, error: 'Username/email and password are required' };
      try {
        const { response, data } = await this.request('/api/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username: identifier, password })
        });
        if (!response.ok || !data?.success) return { success: false, error: data?.error || 'Invalid credentials' };
        this.acceptSession(data);
        this.updateUI();
        return { success: true, user: this.user };
      } catch (error) {
        console.error('[ITA auth] Login failed', error);
        return { success: false, error: 'Login service is temporarily unavailable. Please try again.' };
      }
    }

    acceptSession(data) {
      this.token = data.token;
      this.user = data.user;
      this.session = { access_token: data.token, expires_at: data.expiresAt || null };
      localStorage.setItem(SESSION_KEY, data.token);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
    }

    async logout() {
      try {
        if (this.token) await this.request('/api/auth/logout', { method: 'POST' });
      } catch (error) {
        console.warn('[ITA auth] Logout request failed; clearing the local session anyway.', error?.message || error);
      }
      this.clearSession();
      this.updateUI();
      return { success: true };
    }

    async loadUser() {
      await this.ready;
      return this.user;
    }

    isAdmin() {
      return Boolean(this.user?.groups?.includes('admin') || this.user?.app_metadata?.role === 'admin');
    }

    isAuthenticated() {
      return Boolean(this.token && this.user);
    }

    getCurrentUser() {
      return this.user;
    }

    getHeaders() {
      const headers = { 'Content-Type': 'application/json' };
      if (this.token) headers.Authorization = `Bearer ${this.token}`;
      return headers;
    }

    updateUI() {
      const authenticated = this.isAuthenticated();
      document.querySelectorAll('.login-btn, [data-auth="logged-out"]').forEach(el => { el.style.display = authenticated ? 'none' : ''; });
      document.querySelectorAll('.logout-btn, .member-only, [data-auth="logged-in"]').forEach(el => { el.style.display = authenticated ? '' : 'none'; });
      document.querySelectorAll('.user-display').forEach(el => {
        if (authenticated) {
          el.textContent = this.user.fullName || this.user.username || this.user.email;
          el.style.display = '';
        } else {
          el.style.display = 'none';
        }
      });
      this.emitAuthEvent('auth:state-changed');
    }

    markReady() {
      if (this.isReady) return;
      this.isReady = true;
      this.emitAuthEvent('auth:ready');
    }

    emitAuthEvent(name) {
      document.dispatchEvent(new CustomEvent(name, {
        detail: {
          backend: this.backend,
          isAuthenticated: this.isAuthenticated(),
          user: this.user ? { id: this.user.id, username: this.user.username, email: this.user.email, fullName: this.user.fullName } : null
        }
      }));
    }
  }

  window.SupabaseAuthManager = D1AuthManager;
  window.D1AuthManager = D1AuthManager;
  window.authManager = new D1AuthManager();

  window.showModal = function showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  window.hideModal = function hideModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    modal.classList.remove('active');
    document.body.style.overflow = '';
  };

  document.addEventListener('click', event => {
    const modal = event.target.closest?.('.modal.active');
    if (modal && event.target === modal) window.hideModal(modal.id);
  });
})();
