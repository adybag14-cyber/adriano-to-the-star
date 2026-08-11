/**
 * Image Lazy Loading
 * Optimizes page load by loading images only when they enter the viewport
 * 
 * Features:
 * - Intersection Observer API for performance
 * - Placeholder images while loading
 * - Progressive loading with blur-up effect
 * - Support for background images
 * - Automatic retry on failure
 */

class LazyImageLoader {
    constructor() {
        this.observer = null;
        this.images = [];
        this.loadedCount = 0;
        this.failedCount = 0;
        this.init();
    }
    
    init() {
        // Check if Intersection Observer is supported
        if (!('IntersectionObserver' in window)) {
            console.warn('Intersection Observer not supported - loading all images immediately');
            this.loadAllImages();
            return;
        }
        
        // Create observer
        this.createObserver();
        
        // Find all images that need lazy loading
        this.findImages();
        
        // Start observing
        this.observeImages();
        
        console.log(`🖼️ Lazy loading initialized for ${this.images.length} images`);
    }
    
    createObserver() {
        const options = {
            root: null,
            rootMargin: '50px', // Start loading 50px before image enters viewport
            threshold: 0.01
        };
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.observer.unobserve(entry.target);
                }
            });
        }, options);
    }
    
    findImages() {
        // Find images with data-src or data-lazy attributes
        const lazyImages = document.querySelectorAll('img[data-src], img[data-lazy], img[loading="lazy"]');
        
        // Also find background images
        const lazyBackgrounds = document.querySelectorAll('[data-bg-src], [data-lazy-bg]');
        
        lazyImages.forEach(img => {
            this.images.push({
                element: img,
                type: 'image',
                src: img.dataset.src || img.dataset.lazy || img.src,
                placeholder: img.dataset.placeholder || null
            });
        });
        
        lazyBackgrounds.forEach(el => {
            this.images.push({
                element: el,
                type: 'background',
                src: el.dataset.bgSrc || el.dataset.lazyBg,
                placeholder: el.dataset.placeholder || null
            });
        });
    }
    
    observeImages() {
        this.images.forEach(image => {
            // Set placeholder if provided
            if (image.placeholder && image.type === 'image') {
                image.element.src = image.placeholder;
                image.element.classList.add('lazy-placeholder');
            }
            
            // Add loading class
            image.element.classList.add('lazy-loading');
            
            // Start observing
            this.observer.observe(image.element);
        });
    }
    
    loadImage(imageData) {
        const { element, type, src, placeholder } = imageData;
        
        // Create new image to preload
        const img = new Image();
        
        img.onload = () => {
            if (type === 'image') {
                // Fade in effect
                element.classList.add('lazy-loaded');
                element.classList.remove('lazy-loading', 'lazy-placeholder');
                
                // Set actual src
                element.src = src;
                
                // Remove data attributes
                element.removeAttribute('data-src');
                element.removeAttribute('data-lazy');
            } else {
                // Background image
                element.style.backgroundImage = `url(${src})`;
                element.classList.add('lazy-loaded');
                element.classList.remove('lazy-loading');
            }
            
            this.loadedCount++;
            this.onImageLoaded(element);
        };
        
        img.onerror = () => {
            element.classList.add('lazy-error');
            element.classList.remove('lazy-loading');
            this.failedCount++;
            console.warn(`Failed to load image: ${src}`);
            
            // Retry once after 2 seconds
            setTimeout(() => {
                if (!element.classList.contains('lazy-loaded')) {
                    img.src = src;
                }
            }, 2000);
        };
        
        // Start loading
        img.src = src;
    }
    
    onImageLoaded(element) {
        // Trigger custom event
        element.dispatchEvent(new CustomEvent('lazyloaded', {
            bubbles: true,
            detail: { element }
        }));
    }
    
    loadAllImages() {
        // Fallback: load all images immediately
        this.images.forEach(imageData => {
            if (imageData.type === 'image') {
                imageData.element.src = imageData.src;
            } else {
                imageData.element.style.backgroundImage = `url(${imageData.src})`;
            }
        });
    }
    
    // Public API
    refresh() {
        // Re-scan for new images
        this.images = [];
        this.findImages();
        this.observeImages();
    }
    
    getStats() {
        return {
            total: this.images.length,
            loaded: this.loadedCount,
            failed: this.failedCount,
            pending: this.images.length - this.loadedCount - this.failedCount
        };
    }
}

// Add CSS for lazy loading
const lazyLoadingCSS = `
    img.lazy-loading {
        opacity: 0.3;
        filter: blur(5px);
        transition: opacity 0.3s ease, filter 0.3s ease;
    }
    
    img.lazy-loaded {
        opacity: 1;
        filter: blur(0);
    }
    
    img.lazy-placeholder {
        background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
    }
    
    @keyframes shimmer {
        0% { background-position: -200% 0; }
        100% { background-position: 200% 0; }
    }
    
    img.lazy-error {
        opacity: 0.5;
        background: rgba(255, 0, 0, 0.1);
    }
    
    [data-bg-src].lazy-loading,
    [data-lazy-bg].lazy-loading {
        opacity: 0.3;
        transition: opacity 0.3s ease;
    }
    
    [data-bg-src].lazy-loaded,
    [data-lazy-bg].lazy-loaded {
        opacity: 1;
    }
`;

// Inject CSS
const style = document.createElement('style');
style.textContent = lazyLoadingCSS;
document.head.appendChild(style);

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.lazyImageLoader = new LazyImageLoader();
    });
} else {
    window.lazyImageLoader = new LazyImageLoader();
}
