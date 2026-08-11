/**
 * Screenshot Tool
 * 
 * Capture screenshots of the page or specific elements using
 * html2canvas or native browser APIs.
 * 
 * @class ScreenshotTool
 * @example
 * // Auto-initializes on page load
 * // Access via: window.screenshotTool()
 * 
 * // Capture full page
 * const tool = window.screenshotTool();
 * tool.captureFullPage();
 */
class ScreenshotTool {
    constructor() {
        this.init();
    }

    init() {
        // Create screenshot button
        this.createScreenshotButton();
        
        console.log('✅ Screenshot Tool initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_cr_ee_ns_ho_tt_oo_l_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create screenshot button
     * 
     * @method createScreenshotButton
     * @returns {void}
     */
    createScreenshotButton() {
        // Check if button already exists
        if (document.getElementById('screenshot-btn')) return;

        const button = document.createElement('button');
        button.id = 'screenshot-btn';
        button.className = 'screenshot-btn';
        button.setAttribute('aria-label', 'Take Screenshot');
        button.innerHTML = '📸';
        button.title = 'Take Screenshot';
        
        button.addEventListener('click', () => this.showScreenshotMenu());
        
        document.body.appendChild(button);
    }

    /**
     * Show screenshot menu
     * 
     * @method showScreenshotMenu
     * @returns {void}
     */
    showScreenshotMenu() {
        // Check if menu already exists
        let menu = document.getElementById('screenshot-menu');
        if (menu) {
            menu.classList.toggle('open');
            return;
        }

        // Create menu
        menu = document.createElement('div');
        menu.id = 'screenshot-menu';
        menu.className = 'screenshot-menu';
        menu.innerHTML = `
            <button class="screenshot-option" data-type="full">📄 Full Page</button>
            <button class="screenshot-option" data-type="visible">👁️ Visible Area</button>
            <button class="screenshot-option" data-type="selection">✂️ Select Area</button>
        `;

        document.body.appendChild(menu);

        // Position menu
        const btn = document.getElementById('screenshot-btn');
        if (btn) {
            const rect = btn.getBoundingClientRect();
            menu.style.top = `${rect.top - 120}px`;
            menu.style.right = `${window.innerWidth - rect.right}px`;
        }

        // Add event listeners
        menu.querySelectorAll('.screenshot-option').forEach(option => {
            option.addEventListener('click', () => {
                const type = option.dataset.type;
                this.capture(type);
                menu.classList.remove('open');
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target) && e.target !== btn) {
                menu.classList.remove('open');
            }
        });

        // Show menu
        setTimeout(() => menu.classList.add('open'), 10);
    }

    /**
     * Capture screenshot
     * 
     * @method capture
     * @param {string} type - Capture type (full, visible, selection)
     * @returns {Promise<void>}
     */
    async capture(type = 'visible') {
        try {
            let blob;

            if (type === 'full') {
                blob = await this.captureFullPage();
            } else if (type === 'visible') {
                blob = await this.captureVisible();
            } else if (type === 'selection') {
                blob = await this.captureSelection();
            }

            if (blob) {
                this.downloadScreenshot(blob);
                this.showSuccessNotification();
            }
        } catch (error) {
            console.error('Failed to capture screenshot:', error);
            this.showErrorNotification();
        }
    }

    /**
     * Capture full page
     * 
     * @method captureFullPage
     * @returns {Promise<Blob>} Screenshot blob
     */
    async captureFullPage() {
        // Use html2canvas if available, otherwise use native API
        if (window.html2canvas) {
            const canvas = await html2canvas(document.body, {
                height: document.body.scrollHeight,
                width: document.body.scrollWidth,
                useCORS: true
            });
            return new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
        } else {
            // Fallback: use native screenshot API (if available)
            return this.captureVisible();
        }
    }

    /**
     * Capture visible area
     * 
     * @method captureVisible
     * @returns {Promise<Blob>} Screenshot blob
     */
    async captureVisible() {
        // Use html2canvas if available
        if (window.html2canvas) {
            const canvas = await html2canvas(document.body, {
                useCORS: true
            });
            return new Promise(resolve => {
                canvas.toBlob(resolve, 'image/png');
            });
        } else {
            // Fallback: try native screenshot API
            try {
                const stream = await navigator.mediaDevices.getDisplayMedia({
                    video: { mediaSource: 'screen' }
                });
                const video = document.createElement('video');
                video.srcObject = stream;
                video.play();
                
                return new Promise((resolve) => {
                    video.addEventListener('loadedmetadata', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0);
                        stream.getTracks().forEach(track => track.stop());
                        canvas.toBlob(resolve, 'image/png');
                    });
                });
            } catch (error) {
                // Final fallback: show message
                this.showFallbackMessage();
                return null;
            }
        }
    }

    /**
     * Capture selection area
     * 
     * @method captureSelection
     * @returns {Promise<Blob>} Screenshot blob
     */
    async captureSelection() {
        // Show selection tool
        return new Promise((resolve) => {
            this.showSelectionTool((rect) => {
                if (window.html2canvas) {
                    html2canvas(document.body, {
                        x: rect.x,
                        y: rect.y,
                        width: rect.width,
                        height: rect.height,
                        useCORS: true
                    }).then(canvas => {
                        canvas.toBlob(resolve, 'image/png');
                    });
                } else {
                    resolve(null);
                }
            });
        });
    }

    /**
     * Show selection tool
     * 
     * @method showSelectionTool
     * @param {Function} callback - Callback with selection rect
     * @returns {void}
     */
    showSelectionTool(callback) {
        const overlay = document.createElement('div');
        overlay.className = 'screenshot-selection-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10006;
            cursor: crosshair;
        `;

        let startX, startY, isSelecting = false;
        const selection = document.createElement('div');
        selection.style.cssText = `
            position: absolute;
            border: 2px dashed #ba944f;
            background: rgba(186, 148, 79, 0.1);
            pointer-events: none;
        `;
        overlay.appendChild(selection);

        overlay.addEventListener('mousedown', (e) => {
            isSelecting = true;
            startX = e.clientX;
            startY = e.clientY;
            selection.style.left = `${startX}px`;
            selection.style.top = `${startY}px`;
            selection.style.width = '0px';
            selection.style.height = '0px';
        });

        overlay.addEventListener('mousemove', (e) => {
            if (!isSelecting) return;
            const width = Math.abs(e.clientX - startX);
            const height = Math.abs(e.clientY - startY);
            selection.style.left = `${Math.min(e.clientX, startX)}px`;
            selection.style.top = `${Math.min(e.clientY, startY)}px`;
            selection.style.width = `${width}px`;
            selection.style.height = `${height}px`;
        });

        overlay.addEventListener('mouseup', (e) => {
            if (!isSelecting) return;
            isSelecting = false;
            
            const rect = {
                x: Math.min(e.clientX, startX),
                y: Math.min(e.clientY, startY),
                width: Math.abs(e.clientX - startX),
                height: Math.abs(e.clientY - startY)
            };

            if (rect.width > 10 && rect.height > 10) {
                callback(rect);
            }
            
            overlay.remove();
        });

        document.body.appendChild(overlay);
    }

    /**
     * Download screenshot
     * 
     * @method downloadScreenshot
     * @param {Blob} blob - Screenshot blob
     * @returns {void}
     */
    downloadScreenshot(blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `screenshot-${new Date().toISOString().split('T')[0]}-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Show success notification
     * 
     * @method showSuccessNotification
     * @returns {void}
     */
    showSuccessNotification() {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show('Screenshot captured successfully!', {
                type: 'success',
                duration: 3000
            });
        }
    }

    /**
     * Show error notification
     * 
     * @method showErrorNotification
     * @returns {void}
     */
    showErrorNotification() {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show('Failed to capture screenshot', {
                type: 'error',
                duration: 3000
            });
        }
    }

    /**
     * Show fallback message
     * 
     * @method showFallbackMessage
     * @returns {void}
     */
    showFallbackMessage() {
        if (window.notificationCenter) {
            const center = window.notificationCenter();
            center.show('Screenshot feature requires html2canvas library. Please install it for full functionality.', {
                type: 'info',
                duration: 5000
            });
        }
    }
}

// Initialize globally
let screenshotToolInstance = null;

function initScreenshotTool() {
    if (!screenshotToolInstance) {
        screenshotToolInstance = new ScreenshotTool();
    }
    return screenshotToolInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initScreenshotTool);
} else {
    initScreenshotTool();
}

// Export globally
window.ScreenshotTool = ScreenshotTool;
window.screenshotTool = () => screenshotToolInstance;

