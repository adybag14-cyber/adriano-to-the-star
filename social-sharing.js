/**
 * Social Sharing System
 * 
 * Provides functionality to share content across multiple social media platforms
 * including Twitter, Facebook, LinkedIn, Reddit, Pinterest, WhatsApp, Telegram,
 * Email, and clipboard. Supports Web Share API for native sharing.
 * 
 * @class SocialSharing
 * @example
 * // Auto-initializes on page load
 * // Access via: window.socialSharing()
 * 
 * // Show share widget
 * const sharing = window.socialSharing();
 * sharing.showShareWidget({
 *   title: 'My Planet',
 *   text: 'Check out this amazing planet!',
 *   url: 'https://example.com/planet/123'
 * });
 */
class SocialSharing {
    constructor() {
        this.shareData = {
            title: 'Adriano To The Star',
            text: 'Explore exoplanets and celestial bodies',
            url: window.location.href
        };
        this.init();
    }

    init() {
        // Setup share buttons
        this.setupShareButtons();
        
        // Setup Web Share API
        this.setupWebShareAPI();
        
        console.log('✅ Social Sharing initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_oc_ia_ls_ha_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup share buttons
     */
    setupShareButtons() {
        // Find all share buttons
        document.addEventListener('click', (e) => {
            const shareBtn = e.target.closest('[data-share]');
            if (shareBtn) {
                const platform = shareBtn.dataset.share;
                const customData = shareBtn.dataset.shareData ? 
                    JSON.parse(shareBtn.dataset.shareData) : null;
                
                this.share(platform, customData);
            }
        });
    }

    /**
     * Setup Web Share API
     */
    setupWebShareAPI() {
        // Check if Web Share API is available
        if (navigator.share) {
            // Add native share button to share containers
            this.addNativeShareButton();
        }
    }

    /**
     * Add native share button
     */
    addNativeShareButton() {
        const shareContainers = document.querySelectorAll('.share-container, [data-share-container]');
        shareContainers.forEach(container => {
            if (container.querySelector('.native-share-btn')) return;
            
            const btn = document.createElement('button');
            btn.className = 'share-btn native-share-btn';
            btn.innerHTML = '📱 Share';
            btn.title = 'Share via native share dialog';
            btn.addEventListener('click', () => {
                this.nativeShare();
            });
            container.appendChild(btn);
        });
    }

    /**
     * Share content to a specific platform
     * 
     * @method share
     * @param {string} platform - Platform name (twitter, facebook, linkedin, reddit, pinterest, whatsapp, telegram, email, copy)
     * @param {Object|null} [customData=null] - Custom share data (title, text, url)
     * @returns {void}
     * @example
     * sharing.share('twitter', {
     *   title: 'My Planet',
     *   text: 'Check this out!',
     *   url: 'https://example.com'
     * });
     */
    share(platform, customData = null) {
        const data = customData || this.shareData;
        
        const shareUrls = {
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url)}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url)}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(data.url)}`,
            reddit: `https://reddit.com/submit?url=${encodeURIComponent(data.url)}&title=${encodeURIComponent(data.title)}`,
            pinterest: `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(data.url)}&description=${encodeURIComponent(data.text)}`,
            email: `mailto:?subject=${encodeURIComponent(data.title)}&body=${encodeURIComponent(data.text + '\n\n' + data.url)}`,
            whatsapp: `https://wa.me/?text=${encodeURIComponent(data.text + ' ' + data.url)}`,
            telegram: `https://t.me/share/url?url=${encodeURIComponent(data.url)}&text=${encodeURIComponent(data.text)}`,
            copy: null // Special case for clipboard
        };

        if (platform === 'copy') {
            this.copyToClipboard(data.url);
            return;
        }

        const url = shareUrls[platform.toLowerCase()];
        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        } else {
            console.warn('Unknown platform:', platform);
        }
    }

    /**
     * Share using native Web Share API
     * 
     * Falls back to clipboard copy if Web Share API is not available.
     * 
     * @method nativeShare
     * @param {Object|null} [customData=null] - Custom share data
     * @returns {Promise<void>}
     * @throws {Error} If sharing fails (user cancellation is not an error)
     */
    async nativeShare(customData = null) {
        const data = customData || this.shareData;
        
        if (navigator.share) {
            try {
                await navigator.share({
                    title: data.title,
                    text: data.text,
                    url: data.url
                });
                this.showNotification('Shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Error sharing:', error);
                    this.showNotification('Failed to share', 'error');
                }
            }
        } else {
            // Fallback to copy
            this.copyToClipboard(data.url);
        }
    }

    /**
     * Copy text to clipboard
     * 
     * Uses modern Clipboard API with fallback for older browsers.
     * 
     * @method copyToClipboard
     * @param {string} text - Text to copy
     * @returns {Promise<void>}
     * @throws {Error} If clipboard access fails
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                this.showNotification('Link copied to clipboard!', 'success');
            } else {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                this.showNotification('Link copied to clipboard!', 'success');
            }
        } catch (error) {
            console.error('Failed to copy:', error);
            this.showNotification('Failed to copy link', 'error');
        }
    }

    /**
     * Create a share widget modal with platform buttons
     * 
     * @method createShareWidget
     * @param {Object|null} [data=null] - Share data (title, text, url)
     * @returns {HTMLElement} Share widget DOM element
     */
    createShareWidget(data = null) {
        const widget = document.createElement('div');
        widget.className = 'share-widget';
        widget.innerHTML = `
            <div class="share-widget-header">
                <h3>Share</h3>
                <button class="close-share-widget" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            <div class="share-platforms">
                ${navigator.share ? `
                <button class="share-platform-btn native-share" data-share="native">
                    <span class="share-icon">📱</span>
                    <span class="share-label">Native Share</span>
                </button>
                ` : ''}
                <button class="share-platform-btn" data-share="twitter">
                    <span class="share-icon">🐦</span>
                    <span class="share-label">Twitter</span>
                </button>
                <button class="share-platform-btn" data-share="facebook">
                    <span class="share-icon">📘</span>
                    <span class="share-label">Facebook</span>
                </button>
                <button class="share-platform-btn" data-share="linkedin">
                    <span class="share-icon">💼</span>
                    <span class="share-label">LinkedIn</span>
                </button>
                <button class="share-platform-btn" data-share="reddit">
                    <span class="share-icon">🤖</span>
                    <span class="share-label">Reddit</span>
                </button>
                <button class="share-platform-btn" data-share="pinterest">
                    <span class="share-icon">📌</span>
                    <span class="share-label">Pinterest</span>
                </button>
                <button class="share-platform-btn" data-share="whatsapp">
                    <span class="share-icon">💬</span>
                    <span class="share-label">WhatsApp</span>
                </button>
                <button class="share-platform-btn" data-share="telegram">
                    <span class="share-icon">✈️</span>
                    <span class="share-label">Telegram</span>
                </button>
                <button class="share-platform-btn" data-share="email">
                    <span class="share-icon">📧</span>
                    <span class="share-label">Email</span>
                </button>
                <button class="share-platform-btn" data-share="copy">
                    <span class="share-icon">📋</span>
                    <span class="share-label">Copy Link</span>
                </button>
            </div>
        `;

        // Store share data
        if (data) {
            widget.dataset.shareData = JSON.stringify(data);
            this.shareData = { ...this.shareData, ...data };
        }

        // Add event listeners
        widget.querySelectorAll('.share-platform-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = btn.dataset.share;
                if (platform === 'native') {
                    this.nativeShare(data);
                } else {
                    this.share(platform, data);
                }
            });
        });

        this.injectStyles();
        return widget;
    }

    /**
     * Show share widget
     */
    showShareWidget(data = null) {
        // Remove existing widget
        const existing = document.querySelector('.share-widget');
        if (existing) {
            existing.remove();
        }

        const widget = this.createShareWidget(data);
        document.body.appendChild(widget);

        // Animate in
        requestAnimationFrame(() => {
            widget.style.opacity = '1';
            widget.style.transform = 'scale(1)';
        });
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `share-notification share-notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        this.injectStyles();

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateY(0)';
        });

        // Auto-remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 3000);
    }

    /**
     * Inject CSS styles
     */
    injectStyles() {
        if (document.getElementById('social-sharing-styles')) return;

        const style = document.createElement('style');
        style.id = 'social-sharing-styles';
        style.textContent = `
            .share-widget {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) scale(0.9);
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 16px;
                padding: 2rem;
                z-index: 10001;
                max-width: 500px;
                width: 90%;
                opacity: 0;
                transition: all 0.3s ease;
                font-family: 'Raleway', sans-serif;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
            }

            .share-widget-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(186, 148, 79, 0.3);
            }

            .share-widget-header h3 {
                color: #ba944f;
                margin: 0;
                font-size: 1.5rem;
            }

            .close-share-widget {
                background: transparent;
                border: none;
                color: rgba(255, 255, 255, 0.7);
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: color 0.2s;
            }

            .close-share-widget:hover {
                color: #ba944f;
            }

            .share-platforms {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 1rem;
            }

            .share-platform-btn {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 0.5rem;
                padding: 1rem;
                background: rgba(186, 148, 79, 0.1);
                border: 1px solid rgba(186, 148, 79, 0.3);
                border-radius: 12px;
                color: rgba(255, 255, 255, 0.8);
                cursor: pointer;
                transition: all 0.2s;
                font-family: 'Raleway', sans-serif;
            }

            .share-platform-btn:hover {
                background: rgba(186, 148, 79, 0.2);
                border-color: rgba(186, 148, 79, 0.5);
                color: #ba944f;
                transform: translateY(-2px);
            }

            .share-icon {
                font-size: 2rem;
            }

            .share-label {
                font-size: 0.9rem;
            }

            .share-notification {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(20, 20, 30, 0.98));
                border: 2px solid rgba(186, 148, 79, 0.5);
                border-radius: 12px;
                padding: 1rem 1.5rem;
                color: white;
                font-family: 'Raleway', sans-serif;
                z-index: 10002;
                opacity: 0;
                transform: translateY(-20px);
                transition: all 0.3s ease;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            }

            .share-notification-success {
                border-color: rgba(68, 255, 68, 0.5);
            }

            .share-notification-error {
                border-color: rgba(220, 53, 69, 0.5);
            }

            @media (max-width: 768px) {
                .share-widget {
                    width: 95%;
                    padding: 1.5rem;
                }

                .share-platforms {
                    grid-template-columns: repeat(2, 1fr);
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let socialSharingInstance = null;

function initSocialSharing() {
    if (!socialSharingInstance) {
        socialSharingInstance = new SocialSharing();
    }
    return socialSharingInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSocialSharing);
} else {
    initSocialSharing();
}

// Export globally
window.SocialSharing = SocialSharing;
window.socialSharing = () => socialSharingInstance;

