/**
 * RTL (Right-to-Left) Support
 * Right-to-left language support
 */

class RTLSupport {
    constructor() {
        this.rtlLanguages = ['ar', 'he', 'fa', 'ur'];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'RTL Support initialized' };
    }

    isRTL(language) {
        return this.rtlLanguages.includes(language);
    }

    setDirection(language) {
        document.documentElement.dir = this.isRTL(language) ? 'rtl' : 'ltr';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = RTLSupport;
}

