/** Browser-local profile support for the static GitLab Pages deployment. */
(function () {
  'use strict';

  if (window.authManager?.isLocalPlatform) return;

  const ACCOUNTS_KEY = 'ita_local_accounts_v1';
  const SESSION_KEY = 'ita_local_session_v1';

  const readJson = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; }
    catch { return fallback; }
  };

  const writeJson = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };

  async function legacyHashPassword(password, salt) {
    const bytes = new TextEncoder().encode(`${salt}:${password}`);
    const digest = await crypto.subtle.digest('SHA-256', bytes);
    return [...new Uint8Array(digest)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  async function hashPassword(password, salt, iterations = 600000) {
    const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt: new TextEncoder().encode(salt),
      iterations,
      hash: 'SHA-256'
    }, material, 256);
    return [...new Uint8Array(bits)].map(value => value.toString(16).padStart(2, '0')).join('');
  }

  class LocalAuthManager {
    constructor() {
      this.isLocalPlatform = true;
      this.useSupabase = false;
      this.supabase = null;
      this.token = '';
      this.isReady = true;
      this.user = readJson(SESSION_KEY, null);
      this.currentUser = this.user;
      queueMicrotask(() => {
        this.updateUI();
        document.dispatchEvent(new CustomEvent('auth:ready', { detail: { user: this.user } }));
      });
    }

    getCurrentUser() { return this.user; }
    isAuthenticated() { return Boolean(this.user); }
    getHeaders() { return { 'Content-Type': 'application/json' }; }

    async register(username, email, password, fullName = '') {
      const cleanUsername = String(username || '').trim();
      const cleanEmail = String(email || '').trim().toLowerCase();
      if (cleanUsername.length < 2) return { success: false, error: 'Choose a username with at least two characters.' };
      if (!/^[\p{L}\p{N} _.-]+$/u.test(cleanUsername)) return { success: false, error: 'Username may contain letters, numbers, spaces, dots, underscores, and hyphens.' };
      if (!/^\S+@\S+\.\S+$/.test(cleanEmail)) return { success: false, error: 'Enter a valid email address.' };
      if (/[<>"'\u0000-\u001f]/.test(cleanEmail)) return { success: false, error: 'Email contains unsupported characters.' };
      if (String(password || '').length < 8) return { success: false, error: 'Use at least eight characters for this browser-local profile.' };

      const accounts = readJson(ACCOUNTS_KEY, []);
      if (accounts.some(account => account.email === cleanEmail || account.username.toLowerCase() === cleanUsername.toLowerCase())) {
        return { success: false, error: 'That browser-local profile already exists.' };
      }

      const salt = crypto.randomUUID();
      const passwordHash = await hashPassword(password, salt);
      const user = {
        id: crypto.randomUUID(),
        username: cleanUsername,
        email: cleanEmail,
        fullName: String(fullName || cleanUsername).trim().replace(/[<>\u0000-\u001f]/g, ''),
        groups: [],
        createdAt: new Date().toISOString(),
        storage: 'browser-local'
      };
      accounts.push({ ...user, salt, passwordHash, passwordAlgorithm: 'pbkdf2-sha256', passwordIterations: 600000 });
      if (!writeJson(ACCOUNTS_KEY, accounts)) return { success: false, error: 'Browser storage is unavailable.' };
      this.setSession(user);
      return { success: true, user };
    }

    async login(identifier, password) {
      const value = String(identifier || '').trim().toLowerCase();
      const accounts = readJson(ACCOUNTS_KEY, []);
      const account = accounts.find(entry => entry.email === value || entry.username.toLowerCase() === value);
      if (!account) return { success: false, error: 'No matching browser-local profile exists on this device.' };
      const passwordHash = account.passwordAlgorithm === 'pbkdf2-sha256'
        ? await hashPassword(password, account.salt, account.passwordIterations || 600000)
        : await legacyHashPassword(password, account.salt);
      if (passwordHash !== account.passwordHash) return { success: false, error: 'Incorrect local profile password.' };
      if (account.passwordAlgorithm !== 'pbkdf2-sha256') {
        account.passwordHash = await hashPassword(password, account.salt, 600000);
        account.passwordAlgorithm = 'pbkdf2-sha256';
        account.passwordIterations = 600000;
        writeJson(ACCOUNTS_KEY, accounts);
      }
      const { salt: _salt, passwordHash: _passwordHash, ...user } = account;
      this.setSession(user);
      return { success: true, user };
    }

    logout() {
      this.user = null;
      this.currentUser = null;
      try { localStorage.removeItem(SESSION_KEY); } catch {}
      this.updateUI();
      window.dispatchEvent(new CustomEvent('ita:auth-changed', { detail: { user: null } }));
      document.dispatchEvent(new CustomEvent('auth:state-changed', { detail: { user: null } }));
      return { success: true };
    }

    setSession(user) {
      this.user = user;
      this.currentUser = user;
      writeJson(SESSION_KEY, user);
      this.updateUI();
      window.dispatchEvent(new CustomEvent('ita:auth-changed', { detail: { user } }));
      document.dispatchEvent(new CustomEvent('auth:state-changed', { detail: { user } }));
    }

    updateUI() {
      const authenticated = this.isAuthenticated();
      document.querySelectorAll('.login-button,[data-auth-action="login"]').forEach(node => { node.hidden = authenticated; });
      document.querySelectorAll('.logout-button,[data-auth-action="logout"]').forEach(node => {
        node.hidden = !authenticated;
        node.style.display = authenticated ? '' : 'none';
      });
      document.querySelectorAll('.user-name,[data-current-user]').forEach(node => {
        node.textContent = authenticated ? (this.user.fullName || this.user.username) : 'Guest';
      });
    }
  }

  window.LocalAuthManager = LocalAuthManager;
  window.authManager = new LocalAuthManager();
})();
