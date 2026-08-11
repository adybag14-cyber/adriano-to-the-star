/**
 * Lazy Loading for Non-Critical Resources
 * Implements lazy loading for images, scripts, and other resources
 */

class LazyLoadingNonCritical {
    constructor() {
        this.observer = null;
        this.init();
    }
    
    init() {
        this.setupIntersectionObserver();
        this.lazyLoadImages();
        this.lazyLoadScripts();
        this.lazyLoadIframes();
    }
    
    setupIntersectionObserver() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadResource(entry.target);
                        this.observer.unobserve(entry.target);
                    }
                });
            }, {
                rootMargin: '50px'
            });
        }
    }
    
    lazyLoadImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (this.observer) {
                this.observer.observe(img);
            } else {
                // Fallback: load immediately
                this.loadImage(img);
            }
        });
    }
    
    loadImage(img) {
        const src = img.getAttribute('data-src');
        if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            img.classList.add('loaded');
        }
    }
    
    lazyLoadScripts() {
        document.querySelectorAll('script[data-src]').forEach(script => {
            if (this.observer) {
                this.observer.observe(script);
            } else {
                this.loadScript(script);
            }
        });
    }
    
    loadScript(script) {
        const src = script.getAttribute('data-src');
        if (src) {
            const newScript = document.createElement('script');
            newScript.src = src;
            newScript.async = true;
            script.parentNode.replaceChild(newScript, script);
        }
    }
    
    lazyLoadIframes() {
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            if (this.observer) {
                this.observer.observe(iframe);
            } else {
                this.loadIframe(iframe);
            }
        });
    }
    
    loadIframe(iframe) {
        const src = iframe.getAttribute('data-src');
        if (src) {
            iframe.src = src;
            iframe.removeAttribute('data-src');
        }
    }
    
    loadResource(element) {
        if (element.tagName === 'IMG') {
            this.loadImage(element);
        } else if (element.tagName === 'SCRIPT') {
            this.loadScript(element);
        } else if (element.tagName === 'IFRAME') {
            this.loadIframe(element);
        }
    }
    
    lazyLoadCSS(href) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.media = 'print';
        link.onload = function() {
            this.media = 'all';
        };
        document.head.appendChild(link);
    }
    
    preloadOnHover(element, resource) {
        element.addEventListener('mouseenter', () => {
            if (resource.type === 'image') {
                const img = new Image();
                img.src = resource.url;
            } else if (resource.type === 'script') {
                const link = document.createElement('link');
                link.rel = 'prefetch';
                link.href = resource.url;
                link.as = 'script';
                document.head.appendChild(link);
            }
        }, { once: true });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.lazyLoadingNonCritical = new LazyLoadingNonCritical(); });
} else {
    window.lazyLoadingNonCritical = new LazyLoadingNonCritical();
}

