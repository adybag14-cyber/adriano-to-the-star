/** Browser-local compatibility adapter for Exoplanet Pioneer saves and rankings. */
(function () {
  'use strict';
  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) || '') ?? fallback; } catch { return fallback; }
  };
  const store = (key, value) => localStorage.setItem(key, JSON.stringify(value));

  class PioneerLocalService {
    constructor() {
      this.user = window.authManager?.getCurrentUser?.() || null;
      this.isEnabled = true;
      this.unavailableReason = null;
      addEventListener('ita:auth-changed', event => { this.user = event.detail?.user || null; });
    }

    async checkSession() {
      this.user = window.authManager?.getCurrentUser?.() || null;
      return { data: { session: this.user ? { user: this.user } : null }, error: null };
    }

    async signUp(email, password, username) {
      const result = await window.authManager.register(username || email.split('@')[0], email, password, username || 'Pioneer');
      if (result.success) this.user = result.user;
      return { data: result.success ? { user: result.user } : null, error: result.success ? null : new Error(result.error) };
    }

    async signIn(email, password) {
      const result = await window.authManager.login(email, password);
      if (result.success) this.user = result.user;
      return { data: result.success ? { user: result.user } : null, error: result.success ? null : new Error(result.error) };
    }

    async signOut() {
      window.authManager?.logout?.();
      this.user = null;
      return { error: null };
    }

    userKey(suffix) {
      return `ita_pioneer_v2:${this.user?.id || 'guest'}:${suffix}`;
    }

    async saveGame(gameId, slotId, saveData) {
      if (!this.user) return { data: null, error: new Error('Open a browser-local profile before saving.') };
      try {
        store(this.userKey(`save:${gameId}:${slotId}`), { saveData, updatedAt: new Date().toISOString() });
        return { data: saveData, error: null };
      } catch (error) {
        return { data: null, error };
      }
    }

    async loadGame(gameId, slotId) {
      if (!this.user) return { data: null, error: new Error('Open a browser-local profile before loading.') };
      const record = parse(this.userKey(`save:${gameId}:${slotId}`), null);
      return { data: record?.saveData || null, error: null };
    }

    async submitScore(gameId, score, details) {
      if (!this.user) return { error: new Error('No local profile is active.') };
      try {
        const key = `ita_pioneer_v2:rankings:${gameId}`;
        const rows = parse(key, []);
        rows.push({
          id: crypto.randomUUID(),
          score: Number(score) || 0,
          details: details || {},
          submitted_at: new Date().toISOString(),
          profiles: { username: this.user.username || this.user.email }
        });
        store(key, rows.sort((a, b) => b.score - a.score).slice(0, 100));
        return { error: null };
      } catch (error) {
        return { error };
      }
    }

    async getLeaderboard(gameId, limit = 10) {
      return { data: parse(`ita_pioneer_v2:rankings:${gameId}`, []).slice(0, limit), error: null };
    }

    async claimSystem(systemId, systemName, coordinates) {
      if (!this.user) return { data: null, error: new Error('No local profile is active.') };
      try {
        const key = this.userKey('claims');
        const claims = parse(key, []);
        const record = {
          system_id: systemId,
          system_name: systemName,
          coordinates,
          claimed_at: new Date().toISOString(),
          profiles: { username: this.user.username || this.user.email }
        };
        const index = claims.findIndex(item => item.system_id === systemId);
        if (index >= 0) claims[index] = record;
        else claims.push(record);
        store(key, claims);
        return { data: [record], error: null };
      } catch (error) {
        return { data: null, error };
      }
    }

    async getClaimedSystems() {
      return { data: this.user ? parse(this.userKey('claims'), []) : [], error: null };
    }
  }

  window.PioneerLocalService = PioneerLocalService;
})();
