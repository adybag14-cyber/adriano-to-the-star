/* Conservative PWA registration and non-overlapping install prompt. */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator) || location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') return;
  const smoke = new URLSearchParams(location.search).get('cb') === 'smoke-functional';
  let deferredPrompt = null;

  function register() {
    if (smoke) return;
    const version = document.querySelector('script[src*="pwa-loader.js"]')?.src
      ? new URL(document.querySelector('script[src*="pwa-loader.js"]').src).searchParams.get('v')
      : '';
    const url = version ? `/sw.js?v=${encodeURIComponent(version)}` : '/sw.js';
    navigator.serviceWorker.register(url, { scope: '/', updateViaCache: 'none' }).catch(() => {
      // PWA support is optional; ordinary navigation remains unaffected.
    });
  }

  function schedule() {
    const run = () => 'requestIdleCallback' in window ? requestIdleCallback(register, { timeout: 3000 }) : setTimeout(register, 1000);
    if (document.readyState === 'complete') run();
    else addEventListener('load', run, { once: true });
  }

  function showInstallButton() {
    if (document.getElementById('pwa-install-btn')) return;
    const button = document.createElement('button');
    button.id = 'pwa-install-btn';
    button.type = 'button';
    button.textContent = 'Install I.T.A';
    button.setAttribute('aria-label', 'Install Adriano To The Star as an app');
    button.style.cssText = 'position:fixed;left:16px;bottom:170px;z-index:9500;min-height:44px;max-width:calc(100vw - 32px);padding:.75rem 1rem;border:1px solid rgba(103,232,249,.52);border-radius:999px;background:linear-gradient(135deg,#075985,#6d28d9);color:#fff;font:700 .78rem/1.2 system-ui,sans-serif;box-shadow:0 14px 38px rgba(0,0,0,.45);cursor:pointer';
    button.addEventListener('click', async () => {
      if (!deferredPrompt) { button.remove(); return; }
      button.disabled = true;
      button.textContent = 'Opening install…';
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
      } finally {
        deferredPrompt = null;
        button.remove();
      }
    });
    document.body.append(button);
  }

  addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    deferredPrompt = event;
    showInstallButton();
  });
  addEventListener('appinstalled', () => document.getElementById('pwa-install-btn')?.remove());
  schedule();
})();
