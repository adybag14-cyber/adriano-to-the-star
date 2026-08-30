/** Compatibility shim for retired static-page password gates. */
(function () {
  'use strict';
  window.StarsectorAuth = {
    isAuthenticated: () => true,
    getSession: () => ({ valid: true, mode: 'public-launch' }),
    createSession: () => ({ valid: true, mode: 'public-launch' }),
    clearSession: () => {},
    login: async () => true,
    logout: () => { window.location.href = 'starsector-login.html'; },
    requireAuth: () => true
  };
})();
