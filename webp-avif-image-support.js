/**
 * WebP/AVIF Image Format Support
 * Modern image format support with fallbacks
 */

class WebPAVIFImageSupport {
    constructor() {
        this.supportsWebP = false;
        this.supportsAVIF = false;
        this.init();
    }
    
    init() {
        this.checkSupport();
    }
    
    async checkSupport() {
        this.supportsWebP = await this.checkFormat('webp');
        this.supportsAVIF = await this.checkFormat('avif');
        
        if (this.supportsAVIF || this.supportsWebP) {
            this.enhanceImages();
        }
    }
    
    checkFormat(format) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = `data:image/${format};base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA`;
        });
    }
    
    enhanceImages() {
        document.querySelectorAll('img[data-src]').forEach(img => {
            const src = img.getAttribute('data-src');
            if (src) {
                if (this.supportsAVIF) {
                    img.src = src.replace(/\.(jpg|jpeg|png)$/i, '.avif');
                } else if (this.supportsWebP) {
                    img.src = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                }
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.webpAVIFImageSupport = new WebPAVIFImageSupport(); });
} else {
    window.webpAVIFImageSupport = new WebPAVIFImageSupport();
}


