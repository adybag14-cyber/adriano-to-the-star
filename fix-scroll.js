// Emergency scroll fix - ensures scrolling always works
(function() {
    // Force enable scrolling immediately
    function enableScroll() {
        // Remove all overflow restrictions
        if (document.documentElement) {
            document.documentElement.style.overflow = 'visible';
            document.documentElement.style.overflowY = 'auto';
            document.documentElement.style.overflowX = 'hidden';
            document.documentElement.style.position = '';
            document.documentElement.style.height = '';
        }
        
        if (document.body) {
            document.body.style.overflow = 'visible';
            document.body.style.overflowY = 'auto';
            document.body.style.overflowX = 'hidden';
            document.body.style.position = '';
            document.body.style.height = '';
            document.body.style.width = '';
        }
        
        console.log('✅ Scroll forcefully enabled!');
    }
    
    // Enable immediately
    enableScroll();
    
    // Enable after loader with optimized timing
    const enableTimes = [100, 500, 1000, 2000, 3500, 5000];
    enableTimes.forEach(time => setTimeout(enableScroll, time));
    
    // Also enable when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', enableScroll);
    }
    
    // Final fallback
    window.addEventListener('load', enableScroll);
    
    // Watch for any changes that might disable scrolling
    const observer = new MutationObserver(() => {
        const body = document.body;
        const docEl = document.documentElement;

        if ((body && body.style.overflow === 'hidden') || 
            (docEl && docEl.style.overflow === 'hidden') ||
            (body && body.style.position === 'fixed')) {
            console.log('⚠️ Scroll was disabled, re-enabling...');
            enableScroll();
        }
    });
    
    setTimeout(() => {
        if (document.body) {
            observer.observe(document.body, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
        if (document.documentElement) {
            observer.observe(document.documentElement, {
                attributes: true,
                attributeFilter: ['style']
            });
        }
    }, 100);
})();
