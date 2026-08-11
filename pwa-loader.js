/* global navigator */

/**
 * PWA Service Worker Register & Install Button
 * Handles registration of the service worker and custom install UI
 */

let deferredPrompt;

const isSmokeFunctionalPwaLoader = (() => {
    try {
        if (typeof window === 'undefined' || !window.location) return false;
        return new URLSearchParams(window.location.search || '').get('cb') === 'smoke-functional';
    } catch {
        return false;
    }
})();

const registerServiceWorker = () => {
    try {
        if (!navigator.serviceWorker || typeof navigator.serviceWorker.register !== 'function') return;

        const registrationPromise = navigator.serviceWorker.register('/sw.js');
        if (!registrationPromise || typeof registrationPromise.then !== 'function') {
            console.log('ServiceWorker registration did not return a Promise');
            return;
        }

        registrationPromise
            .then(registration => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch(err => {
                console.log('ServiceWorker registration failed: ', err);
            });
    } catch (err) {
        console.log('ServiceWorker registration failed: ', err);
    }
};

const scheduleServiceWorkerRegistration = () => {
    const runWhenIdle = () => {
        if (typeof window.requestIdleCallback === 'function') {
            window.requestIdleCallback(registerServiceWorker, { timeout: 3000 });
        } else {
            window.setTimeout(registerServiceWorker, 1000);
        }
    };

    if (document.readyState === 'complete') {
        runWhenIdle();
    } else {
        window.addEventListener('load', runWhenIdle, { once: true });
    }
};

if (!isSmokeFunctionalPwaLoader && 'serviceWorker' in navigator) {
    scheduleServiceWorkerRegistration();
}

// Handle PWA Install Prompt
window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent Chrome 67 and earlier from automatically showing the prompt
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;

    // Create and show the install button
    showInstallButton();
});

function showInstallButton() {
    // Check if button already exists
    if (document.getElementById('pwa-install-btn')) return;

    const btn = document.createElement('button');
    btn.id = 'pwa-install-btn';
    btn.textContent = '📲 Install App';
    btn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 12px 24px;
        background: linear-gradient(135deg, #ba944f, #8a6e3a);
        color: white;
        border: none;
        border-radius: 50px;
        font-family: 'Raleway', sans-serif;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        transition: transform 0.3s ease, opacity 0.3s ease;
        opacity: 0;
        transform: translateY(20px);
    `;

    btn.addEventListener('click', async () => {
        console.log('📲 PWA Install button clicked');

        if (deferredPrompt) {
            console.log('🚀 Triggering install prompt...');
            btn.textContent = 'Installing...';
            btn.disabled = true;
            btn.style.opacity = '0.7';
            btn.style.cursor = 'wait';

            try {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response to the install prompt: ${outcome}`);

                // We've used the prompt, so clear it
                deferredPrompt = null;

                // Hide button regardless of outcome (if accepted, app installs; if dismissed, we hide until next visit)
                btn.style.display = 'none';
            } catch (err) {
                console.error('❌ Error showing install prompt:', err);
                alert('Failed to open install prompt. Please try using your browser menu to install the app.');
                btn.textContent = '📲 Install App';
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        } else {
            console.warn('⚠️ deferredPrompt is missing!');
            alert('Installation is not available right now. Please try using your browser menu (Add to Home Screen).');
            btn.style.display = 'none';
        }
    });

    document.body.appendChild(btn);

    // Animate in
    requestAnimationFrame(() => {
        btn.style.opacity = '1';
        btn.style.transform = 'translateY(0)';
    });
}

window.addEventListener('appinstalled', () => {
    console.log('PWA was installed');
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'none';
});
