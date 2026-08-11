/**
 * Progressive Image Loading with Blur-Up Technique
 * 
 * Implements progressive image loading with blur-up technique for better perceived performance.
 * 
 * @module ProgressiveImageLoading
 * @version 1.0.0
 * @author Adriano To The Star
 */

class ProgressiveImageLoading {
    constructor() {
        this.images = new Map();
        this.intersectionObserver = null;
        this.isInitialized = false;
    }

    /**
     * Initialize the progressive image loading system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('ProgressiveImageLoading already initialized');
            return;
        }

        this.setupIntersectionObserver();
        this.injectStyles();
        this.processExistingImages();
        
        this.isInitialized = true;
        console.log('✅ Progressive Image Loading initialized');
    }

    /**
     * Set up Intersection Observer for lazy loading
     * @private
     */
    setupIntersectionObserver() {
        if (!('IntersectionObserver' in window)) {
            console.warn('IntersectionObserver not supported, falling back to immediate loading');
            return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadImage(entry.target);
                    this.intersectionObserver.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });
    }

    /**
     * Inject required styles
     * @private
     */
    injectStyles() {
        if (document.getElementById('progressive-image-styles')) {
            return;
        }

        const style = document.createElement('style');
        style.id = 'progressive-image-styles';
        style.textContent = `
            .progressive-image-container {
                position: relative;
                overflow: hidden;
                background: rgba(0, 0, 0, 0.1);
            }

            .progressive-image-placeholder {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    90deg,
                    rgba(255, 255, 255, 0.1) 0%,
                    rgba(255, 255, 255, 0.2) 50%,
                    rgba(255, 255, 255, 0.1) 100%
                );
                background-size: 200% 100%;
                animation: shimmer 1.5s infinite;
            }

            @keyframes shimmer {
                0% { background-position: -200% 0; }
                100% { background-position: 200% 0; }
            }

            .progressive-image-blur {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                filter: blur(20px);
                transform: scale(1.1);
                opacity: 0;
                transition: opacity 0.3s ease;
            }

            .progressive-image-blur.loaded {
                opacity: 1;
            }

            .progressive-image-full {
                position: relative;
                width: 100%;
                height: 100%;
                opacity: 0;
                transition: opacity 0.5s ease;
            }

            .progressive-image-full.loaded {
                opacity: 1;
            }

            .progressive-image-container.loading .progressive-image-placeholder {
                display: block;
            }

            .progressive-image-container.loaded .progressive-image-placeholder {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Process existing images on page
     * @private
     */
    processExistingImages() {
        const images = document.querySelectorAll('img[data-progressive], img[data-src]');
        images.forEach(img => {
            this.setupProgressiveImage(img);
        });
    }

    /**
     * Set up progressive image
     * @public
     * @param {HTMLImageElement} img - Image element
     * @param {Object} options - Options
     */
    setupProgressiveImage(img, options = {}) {
        const src = img.dataset.src || img.src;
        const thumbnailSrc = img.dataset.thumbnail || options.thumbnailSrc;
        
        if (!src) {
            console.warn('No source provided for progressive image');
            return;
        }

        // Create container
        const container = document.createElement('div');
        container.className = 'progressive-image-container loading';
        
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'progressive-image-placeholder';
        
        // Create blur image (thumbnail)
        const blurImg = document.createElement('img');
        blurImg.className = 'progressive-image-blur';
        if (thumbnailSrc) {
            blurImg.src = thumbnailSrc;
        }
        
        // Create full image
        const fullImg = document.createElement('img');
        fullImg.className = 'progressive-image-full';
        fullImg.src = src;
        fullImg.alt = img.alt || '';
        
        // Replace original image
        img.parentNode.insertBefore(container, img);
        container.appendChild(placeholder);
        if (thumbnailSrc) {
            container.appendChild(blurImg);
        }
        container.appendChild(fullImg);
        img.style.display = 'none';
        
        // Load image
        if (this.intersectionObserver) {
            this.intersectionObserver.observe(container);
        } else {
            this.loadImage(container);
        }
    }

    /**
     * Load image
     * @private
     * @param {HTMLElement} container - Container element
     */
    loadImage(container) {
        const blurImg = container.querySelector('.progressive-image-blur');
        const fullImg = container.querySelector('.progressive-image-full');
        
        // Load blur image first if available
        if (blurImg && blurImg.src) {
            blurImg.onload = () => {
                blurImg.classList.add('loaded');
            };
        }
        
        // Load full image
        fullImg.onload = () => {
            fullImg.classList.add('loaded');
            container.classList.remove('loading');
            container.classList.add('loaded');
        };
        
        fullImg.onerror = () => {
            container.classList.add('error');
            console.error('Failed to load image:', fullImg.src);
        };
    }

    /**
     * Generate thumbnail from image
     * @public
     * @param {string} src - Image source
     * @param {number} width - Thumbnail width
     * @param {number} quality - JPEG quality (0-1)
     * @returns {Promise<string>} Data URL of thumbnail
     */
    async generateThumbnail(src, width = 20, quality = 0.3) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const height = (img.height / img.width) * width;
                canvas.width = width;
                canvas.height = height;
                
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                
                try {
                    const dataUrl = canvas.toDataURL('image/jpeg', quality);
                    resolve(dataUrl);
                } catch (e) {
                    reject(e);
                }
            };
            
            img.onerror = reject;
            img.src = src;
        });
    }

    /**
     * Convert image to data URL
     * @public
     * @param {File|Blob} file - Image file
     * @returns {Promise<string>} Data URL
     */
    async fileToDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Create global instance
window.ProgressiveImageLoading = ProgressiveImageLoading;

// Auto-initialize if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.progressiveImageLoading = new ProgressiveImageLoading();
        window.progressiveImageLoading.init();
    });
} else {
    window.progressiveImageLoading = new ProgressiveImageLoading();
    window.progressiveImageLoading.init();
}

