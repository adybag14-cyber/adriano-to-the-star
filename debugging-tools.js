/**
 * Debugging Tools
 * Development debugging tools
 */

class DebuggingTools {
    constructor() {
        this.debugMode = false;
        this.init();
    }
    
    init() {
        this.setupDebugging();
    }
    
    setupDebugging() {
        // Setup debugging tools
    }
    
    enableDebugMode() {
        this.debugMode = true;
        console.log('Debug mode enabled');
    }
    
    disableDebugMode() {
        this.debugMode = false;
    }
    
    log(message, data) {
        if (this.debugMode) {
            console.log(`[DEBUG] ${message}`, data);
        }
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.debuggingTools = new DebuggingTools(); });
} else {
    window.debuggingTools = new DebuggingTools();
}

