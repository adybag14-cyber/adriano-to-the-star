/**
 * Fullscreen Mode Toggle
 * Fullscreen API wrapper
 */

class FullscreenModeToggle {
    constructor() {
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Fullscreen Mode Toggle initialized' };
    }

    isSupported() {
        return !!(document.fullscreenEnabled || document.webkitFullscreenEnabled);
    }

    async enterFullscreen(element) {
        if (element.requestFullscreen) {
            await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
            await element.webkitRequestFullscreen();
        }
    }

    async exitFullscreen() {
        if (document.exitFullscreen) {
            await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen();
        }
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FullscreenModeToggle;
}
