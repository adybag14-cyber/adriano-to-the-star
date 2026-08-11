/**
 * Safe Page Loader
 * A minimal, safe loader that ensures the page becomes visible
 * without aggressive loops or forcing styles that break layout.
 */
(function () {
    console.log('🚀 Safe Loader: Initializing...');

    function ensureVisible() {
        // Ensure body is visible
        if (document.body) {
            document.body.style.opacity = '1';
            document.body.style.visibility = 'visible';
            document.body.classList.add('loaded');
        }

        // Remove any stuck loaders
        const loaders = document.querySelectorAll('#space-loader, .space-loader, #loader');
        loaders.forEach(loader => {
            loader.style.opacity = '0';
            setTimeout(() => {
                if (loader.parentNode) loader.parentNode.removeChild(loader);
            }, 500);
        });

        console.log('✅ Safe Loader: Page visibility ensured');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', ensureVisible);
        window.addEventListener('load', ensureVisible);
    } else {
        ensureVisible();
    }

    // Safety check after 2 seconds
    setTimeout(ensureVisible, 2000);
})();
