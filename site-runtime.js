/** Shared, dependency-free runtime for the static production shell. */
(function () {
  'use strict';

  if (window.__itaSiteRuntimeLoaded) return;
  window.__itaSiteRuntimeLoaded = true;

  function currentYear() {
    const year = String(new Date().getFullYear());
    document.querySelectorAll('[data-current-year]').forEach(node => { node.textContent = year; });
    const walker = document.createTreeWalker(document.body, window.NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if (!/©\s*20\d{2}/.test(node.nodeValue || '')) return;
      node.nodeValue = node.nodeValue.replace(/©\s*20\d{2}/g, `© ${year}`);
    });
  }

  function establishMainLandmark() {
    const main = document.querySelector('main,[role="main"]');
    if (!main) return;
    if (!main.id) main.id = 'main-content';
    if (!main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  }

  function bindSkipLinks() {
    document.querySelectorAll('a.ita-skip-link[href^="#"]').forEach(link => {
      link.addEventListener('click', () => {
        const target = document.querySelector(link.getAttribute('href'));
        requestAnimationFrame(() => target?.focus({ preventScroll: true }));
      });
    });
  }

  function modalElement(id) {
    const value = String(id || '').replace(/^#/, '');
    return value ? document.getElementById(value) : null;
  }

  function showModal(id) {
    const modal = modalElement(id);
    if (!modal) return false;
    modal.hidden = false;
    modal.classList.add('active', 'is-open');
    modal.setAttribute('aria-hidden', 'false');
    if (!modal.hasAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    document.body.classList.add('ita-modal-open');
    requestAnimationFrame(() => {
      const focusTarget = modal.querySelector('[autofocus],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),button:not([disabled]),a[href]');
      focusTarget?.focus({ preventScroll: true });
    });
    return true;
  }

  function hideModal(id) {
    const modal = modalElement(id);
    if (!modal) return false;
    modal.classList.remove('active', 'is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.hidden = true;
    if (!document.querySelector('.modal.active,.modal.is-open,[role="dialog"][aria-hidden="false"]')) {
      document.body.classList.remove('ita-modal-open');
    }
    return true;
  }

  function bindLegacyModalControls() {
    document.querySelectorAll('[onclick*="showModal("]').forEach(control => {
      const source = control.getAttribute('onclick') || '';
      const match = source.match(/showModal\(\s*['"]([^'"]+)['"]\s*\)/);
      if (!match || control.dataset.itaModalBound) return;
      control.dataset.itaModalBound = 'true';
      control.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        showModal(match[1]);
      });
    });

    document.querySelectorAll('[onclick*="hideModal("]').forEach(control => {
      const source = control.getAttribute('onclick') || '';
      const match = source.match(/hideModal\(\s*['"]([^'"]+)['"]\s*\)/);
      if (!match || control.dataset.itaModalBound) return;
      control.dataset.itaModalBound = 'true';
      control.addEventListener('click', event => {
        event.preventDefault();
        event.stopImmediatePropagation();
        hideModal(match[1]);
      });
    });

    document.querySelectorAll('.modal,[id$="-modal"]').forEach(modal => {
      if (modal.classList.contains('active') || modal.classList.contains('is-open')) return;
      modal.hidden = true;
      modal.setAttribute('aria-hidden', 'true');
    });
  }

  function init() {
    currentYear();
    establishMainLandmark();
    bindSkipLinks();
    bindLegacyModalControls();
  }

  window.showModal = window.showModal || showModal;
  window.hideModal = window.hideModal || hideModal;
  window.switchAuthModal = window.switchAuthModal || function (event, view) {
    event?.preventDefault?.();
    hideModal(view === 'register' ? 'login-modal' : 'register-modal');
    showModal(view === 'register' ? 'register-modal' : 'login-modal');
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
