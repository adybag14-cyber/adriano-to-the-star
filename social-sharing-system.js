/**
 * Social Sharing System
 * 
 * Adds comprehensive social sharing functionality.
 * 
 * @module SocialSharingSystem
 * @version 1.0.0
 * @author Adriano To The Star
 */

class SocialSharingSystem {
    constructor() {
        this.platforms = new Map();
        this.isInitialized = false;
    }

    /**
     * Initialize social sharing system
     * @public
     */
    init() {
        if (this.isInitialized) {
            console.warn('SocialSharingSystem already initialized');
            return;
        }

        this.setupPlatforms();
        
        this.isInitialized = true;
        console.log('✅ Social Sharing System initialized');
    }

    /**
     * Set up sharing platforms
     * @private
     */
    setupPlatforms() {
        // Twitter/X
        this.platforms.set('twitter', {
            name: 'Twitter',
            url: (text, url) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
            icon: '🐦'
        });

        // Facebook
        this.platforms.set('facebook', {
            name: 'Facebook',
            url: (text, url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
            icon: '📘'
        });

        // LinkedIn
        this.platforms.set('linkedin', {
            name: 'LinkedIn',
            url: (text, url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
            icon: '💼'
        });

        // WhatsApp
        this.platforms.set('whatsapp', {
            name: 'WhatsApp',
            url: (text, url) => `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`,
            icon: '💬'
        });

        // Email
        this.platforms.set('email', {
            name: 'Email',
            url: (text, url) => `mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(url)}`,
            icon: '📧'
        });

        // Copy link
        this.platforms.set('copy', {
            name: 'Copy Link',
            url: null,
            icon: '🔗',
            action: async (text, url) => {
                try {
                    await navigator.clipboard.writeText(url);
                    if (window.notifications) {
                        window.notifications.notify('Link copied!', {
                            channels: ['toast'],
                            priority: 'success'
                        });
                    }
                } catch (e) {
                    console.error('Failed to copy link:', e);
                }
            }
        });
    }

    /**
     * Share content
     * @public
     * @param {string} platform - Platform name
     * @param {Object} options - Sharing options
     */
    share(platform, options = {}) {
        const {
            text = document.title,
            url = window.location.href,
            title = document.title
        } = options;

        const platformConfig = this.platforms.get(platform);
        if (!platformConfig) {
            console.warn(`Platform '${platform}' not found`);
            return;
        }

        // Use Web Share API if available
        if (platform === 'native' && navigator.share) {
            navigator.share({
                title,
                text,
                url
            }).then(() => {
                this.trackEvent('content_shared', { platform: 'native' });
            }).catch(err => {
                console.log('Share cancelled or failed:', err);
                this.trackEvent('share_failed', { platform: 'native', error: err.message });
            });
            return;
        }

        // Custom action
        if (platformConfig.action) {
            platformConfig.action(text, url);
            this.trackEvent('content_shared', { platform });
            return;
        }

        // Open sharing URL
        if (platformConfig.url) {
            const shareUrl = platformConfig.url(text, url);
            window.open(shareUrl, '_blank', 'width=600,height=400');
            this.trackEvent('content_shared', { platform });
        }
    }

    trackEvent(eventName, data = {}) {
        if (window.performanceMonitoring && typeof window.performanceMonitoring.recordMetric === 'function') {
            try {
                window.performanceMonitoring.recordMetric(`social:${eventName}`, 1, {
                    source: 'social-sharing-system',
                    ...data
                });
            } catch (e) {
                console.warn('Failed to record social event:', e);
            }
        }
        if (window.analytics && window.analytics.track) {
            window.analytics.track('Social Event', { event: eventName, ...data });
        }
    }

    /**
     * Create share button
     * @public
     * @param {string} platform - Platform name
     * @param {Object} options - Button options
     * @returns {HTMLElement} Button element
     */
    createShareButton(platform, options = {}) {
        const platformConfig = this.platforms.get(platform);
        if (!platformConfig) {
            return null;
        }

        const button = document.createElement('button');
        button.className = `share-btn share-${platform}`;
        button.innerHTML = `${platformConfig.icon} ${platformConfig.name}`;
        button.title = `Share on ${platformConfig.name}`;

        button.addEventListener('click', () => {
            this.share(platform, options);
        });

        return button;
    }

    /**
     * Create share menu
     * @public
     * @param {Object} options - Sharing options
     * @returns {HTMLElement} Share menu element
     */
    createShareMenu(options = {}) {
        const menu = document.createElement('div');
        menu.className = 'share-menu';

        // Native share button (if available)
        if (navigator.share) {
            const nativeBtn = document.createElement('button');
            nativeBtn.className = 'share-btn share-native';
            nativeBtn.innerHTML = '📤 Share';
            nativeBtn.addEventListener('click', () => {
                this.share('native', options);
            });
            menu.appendChild(nativeBtn);
        }

        // Platform buttons
        this.platforms.forEach((config, platform) => {
            if (platform !== 'native') {
                const btn = this.createShareButton(platform, options);
                if (btn) {
                    menu.appendChild(btn);
                }
            }
        });

        return menu;
    }

    /**
     * Get available platforms
     * @public
     * @returns {Array} Available platforms
     */
    getAvailablePlatforms() {
        return Array.from(this.platforms.keys());
    }
}

// Create global instance
window.SocialSharingSystem = SocialSharingSystem;
window.socialSharing = new SocialSharingSystem();
window.socialSharing.init();

