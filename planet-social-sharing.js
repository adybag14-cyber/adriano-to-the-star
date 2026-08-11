/**
 * Planet Sharing via Social Media
 * Share planet discoveries
 */

class PlanetSocialSharing {
    constructor() {
        this.shareHistory = [];
        this.isInitialized = false;
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('📱 Planet Social Sharing initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_ts_oc_ia_ls_ha_ri_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    sharePlanet(planetData, platform = 'web') {
        const shareData = {
            title: `Check out ${planetData.kepler_name || planetData.kepoi_name}!`,
            text: `I discovered an amazing exoplanet: ${planetData.kepler_name || planetData.kepoi_name}`,
            url: window.location.href
        };

        if (platform === 'web' && navigator.share) {
            navigator.share(shareData).then(() => {
                this.recordShare(planetData, platform);
            }).catch(err => console.log('Share cancelled'));
        } else {
            this.shareToPlatform(planetData, platform);
        }
    }

    shareToPlatform(planetData, platform) {
        const planetName = planetData.kepler_name || planetData.kepoi_name;
        const text = encodeURIComponent(`Check out this amazing exoplanet: ${planetName}`);
        const url = encodeURIComponent(window.location.href);

        const urls = {
            twitter: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
            reddit: `https://reddit.com/submit?title=${text}&url=${url}`
        };

        if (urls[platform]) {
            window.open(urls[platform], '_blank', 'width=600,height=400');
            this.recordShare(planetData, platform);
        }
    }

    recordShare(planetData, platform) {
        this.shareHistory.push({
            planetId: planetData.kepid,
            planetName: planetData.kepler_name || planetData.kepoi_name,
            platform: platform,
            timestamp: new Date().toISOString()
        });
    }

    renderShareButtons(containerId, planetData) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="social-sharing" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin: 1rem 0;">
                <h3 style="color: #ba944f; margin: 0 0 1.5rem 0;">📱 Share Planet</h3>
                <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                    ${navigator.share ? `
                        <button onclick="planetSocialSharing.sharePlanet(${JSON.stringify(planetData).replace(/"/g, '&quot;')}, 'web')" style="padding: 0.75rem 1.5rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                            📤 Share
                        </button>
                    ` : ''}
                    <button onclick="planetSocialSharing.shareToPlatform(${JSON.stringify(planetData).replace(/"/g, '&quot;')}, 'twitter')" style="padding: 0.75rem 1.5rem; background: rgba(29, 161, 242, 0.2); border: 2px solid rgba(29, 161, 242, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        🐦 Twitter
                    </button>
                    <button onclick="planetSocialSharing.shareToPlatform(${JSON.stringify(planetData).replace(/"/g, '&quot;')}, 'facebook')" style="padding: 0.75rem 1.5rem; background: rgba(24, 119, 242, 0.2); border: 2px solid rgba(24, 119, 242, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        📘 Facebook
                    </button>
                    <button onclick="planetSocialSharing.shareToPlatform(${JSON.stringify(planetData).replace(/"/g, '&quot;')}, 'linkedin')" style="padding: 0.75rem 1.5rem; background: rgba(0, 119, 181, 0.2); border: 2px solid rgba(0, 119, 181, 0.5); border-radius: 10px; color: white; cursor: pointer; font-weight: 600;">
                        💼 LinkedIn
                    </button>
                </div>
            </div>
        `;
    }
}

if (typeof window !== 'undefined') {
    window.PlanetSocialSharing = PlanetSocialSharing;
    window.planetSocialSharing = new PlanetSocialSharing();
}

