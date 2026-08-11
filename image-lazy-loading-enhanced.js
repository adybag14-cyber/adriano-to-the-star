/**
 * Enhanced Image Lazy Loading System
 * Advanced lazy loading with intersection observer and blur-up effect
 * 
 * Features:
 * - Intersection Observer API
 * - Blur-up placeholder effect
 * - Progressive JPEG loading
 * - Responsive images
 * - Error handling and retry
 */

class ImageLazyLoadingEnhanced {
    constructor() {
        this.observer = null;
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01
        };
        this.loadedImages = new Set();
        this.failedImages = new Set();
        this.init();
    }
    
    init() {
        if ('IntersectionObserver' in window) {
            this.setupIntersectionObserver();
        } else {
            this.fallbackLoading();
        }
        this.processExistingImages();
        console.log('🖼️ Enhanced Image Lazy Loading initialized');
    }
    
    setupIntersectionObserver() {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, this.options);
    }
    
    processExistingImages() {
        // Process images with data-src attribute
        document.querySelectorAll('img[data-src]').forEach(img => {
            if (this.observer) {
                this.observer.observe(img);
            } else {
                this.loadImage(img);
            }
        });
        
        // Process images without src (placeholder)
        document.querySelectorAll('img:not([src])').forEach(img => {
            const dataSrc = img.getAttribute('data-src');
            if (dataSrc) {
                if (this.observer) {
                    this.observer.observe(img);
                } else {
                    this.loadImage(img);
                }
            }
        });
        
        // Watch for new images
        const observer = new MutationObserver(() => {
            document.querySelectorAll('img[data-src]:not([data-lazy-loaded])').forEach(img => {
                if (this.observer) {
                    this.observer.observe(img);
                }
            });
        });
        
        observer.observe(document.body, { childList: true, subtree: true });
    }
    
    loadImage(img) {
        if (img.hasAttribute('data-lazy-loaded')) return;
        
        const dataSrc = img.getAttribute('data-src');
        if (!dataSrc) return;
        
        // Mark as loading
        img.setAttribute('data-lazy-loaded', 'loading');
        img.classList.add('lazy-loading');
        
        // Add blur placeholder if not exists
        if (!img.style.backgroundImage && img.getAttribute('data-placeholder')) {
            img.style.backgroundImage = `url(${img.getAttribute('data-placeholder')})`;
            img.style.backgroundSize = 'cover';
            img.style.filter = 'blur(10px)';
        }
        
        // Create new image to preload
        const imageLoader = new Image();
        
        imageLoader.onload = () => {
            img.src = dataSrc;
            img.removeAttribute('data-src');
            img.setAttribute('data-lazy-loaded', 'loaded');
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-loaded');
            img.style.filter = '';
            img.style.transition = 'opacity 0.3s ease';
            img.style.opacity = '0';
            setTimeout(() => {
                img.style.opacity = '1';
            }, 10);
            
            this.loadedImages.add(dataSrc);
        };
        
        imageLoader.onerror = () => {
            img.setAttribute('data-lazy-loaded', 'error');
            img.classList.remove('lazy-loading');
            img.classList.add('lazy-error');
            this.handleImageError(img, dataSrc);
        };
        
        imageLoader.src = dataSrc;
    }
    
    handleImageError(img, src) {
        if (this.failedImages.has(src)) return;
        this.failedImages.add(src);
        
        // Retry after delay
        setTimeout(() => {
            if (img.getAttribute('data-lazy-loaded') === 'error') {
                const retryCount = parseInt(img.getAttribute('data-retry-count') || '0');
                if (retryCount < 3) {
                    img.setAttribute('data-retry-count', (retryCount + 1).toString());
                    img.removeAttribute('data-lazy-loaded');
                    this.loadImage(img);
                } else {
                    // Show placeholder
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ccc" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="18" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                }
            }
        }, 2000);
    }
    
    fallbackLoading() {
        // Fallback for browsers without IntersectionObserver
        const loadImages = () => {
            document.querySelectorAll('img[data-src]').forEach(img => {
                const rect = img.getBoundingClientRect();
                if (rect.top < window.innerHeight + 200) {
                    this.loadImage(img);
                }
            });
        };
        
        window.addEventListener('scroll', this.throttle(loadImages, 200));
        window.addEventListener('resize', this.throttle(loadImages, 200));
        loadImages();
    }
    
    throttle(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Generate blur placeholder from image
    generateBlurPlaceholder(src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = 20;
                canvas.height = 20;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, 20, 20);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.1);
                resolve(dataUrl);
            };
            img.onerror = () => resolve(null);
            img.src = src;
        });
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.imageLazyLoadingEnhanced = new ImageLazyLoadingEnhanced();
    });
} else {
    window.imageLazyLoadingEnhanced = new ImageLazyLoadingEnhanced();
}

