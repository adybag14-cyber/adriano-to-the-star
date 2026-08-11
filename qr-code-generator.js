/**
 * QR Code Generator
 * 
 * Generate QR codes for sharing pages, links, and content.
 * Uses a simple canvas-based QR code generation.
 * 
 * @class QRCodeGenerator
 * @example
 * // Auto-initializes on page load
 * // Access via: window.qrCodeGenerator()
 * 
 * // Generate QR code
 * const qr = window.qrCodeGenerator();
 * qr.generate(window.location.href);
 */
class QRCodeGenerator {
    constructor() {
        this.qrCodeSize = 256;
        this.init();
    }

    init() {
        // Create QR code button
        this.createQRButton();
        
        console.log('✅ QR Code Generator initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("q_rc_od_eg_en_er_at_or_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create QR code button
     * 
     * @method createQRButton
     * @returns {void}
     */
    createQRButton() {
        // Check if button already exists
        if (document.getElementById('qr-code-btn')) return;

        const button = document.createElement('button');
        button.id = 'qr-code-btn';
        button.className = 'qr-code-btn';
        button.setAttribute('aria-label', 'Generate QR Code');
        button.innerHTML = '📱';
        button.title = 'Generate QR Code';
        
        button.addEventListener('click', () => this.showQRModal());
        
        document.body.appendChild(button);
    }

    /**
     * Show QR code modal
     * 
     * @method showQRModal
     * @param {string} [data] - Data to encode (defaults to current URL)
     * @returns {void}
     */
    showQRModal(data = null) {
        // Check if modal already exists
        let modal = document.getElementById('qr-code-modal');
        if (modal) {
            modal.classList.add('open');
            this.generateQRCode(data || window.location.href, modal);
            return;
        }

        // Create modal
        modal = document.createElement('div');
        modal.id = 'qr-code-modal';
        modal.className = 'qr-code-modal';
        modal.innerHTML = `
            <div class="qr-code-modal-content">
                <div class="qr-code-header">
                    <h3>📱 QR Code</h3>
                    <button class="qr-code-close" aria-label="Close">×</button>
                </div>
                <div class="qr-code-body">
                    <div class="qr-code-input-group">
                        <input type="text" id="qr-code-input" class="qr-code-input" placeholder="Enter URL or text..." value="${data || window.location.href}">
                        <button class="qr-code-generate-btn">Generate</button>
                    </div>
                    <div class="qr-code-canvas-container">
                        <canvas id="qr-code-canvas" width="256" height="256"></canvas>
                    </div>
                    <div class="qr-code-actions">
                        <button class="qr-code-download-btn">💾 Download</button>
                        <button class="qr-code-copy-btn">📋 Copy Image</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Setup event listeners
        const closeBtn = modal.querySelector('.qr-code-close');
        const generateBtn = modal.querySelector('.qr-code-generate-btn');
        const input = modal.querySelector('#qr-code-input');
        const downloadBtn = modal.querySelector('.qr-code-download-btn');
        const copyBtn = modal.querySelector('.qr-code-copy-btn');

        closeBtn.addEventListener('click', () => this.hideQRModal());
        generateBtn.addEventListener('click', () => {
            this.generateQRCode(input.value || window.location.href, modal);
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                this.generateQRCode(input.value || window.location.href, modal);
            }
        });
        downloadBtn.addEventListener('click', () => this.downloadQRCode());
        copyBtn.addEventListener('click', () => this.copyQRCode());

        // Generate initial QR code
        this.generateQRCode(data || window.location.href, modal);

        // Show modal
        setTimeout(() => modal.classList.add('open'), 10);
    }

    /**
     * Hide QR code modal
     * 
     * @method hideQRModal
     * @returns {void}
     */
    hideQRModal() {
        const modal = document.getElementById('qr-code-modal');
        if (modal) {
            modal.classList.remove('open');
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.parentNode.removeChild(modal);
                }
            }, 300);
        }
    }

    /**
     * Generate QR code
     * 
     * @method generateQRCode
     * @param {string} data - Data to encode
     * @param {HTMLElement} modal - Modal element
     * @returns {void}
     */
    generateQRCode(data, modal) {
        const canvas = modal.querySelector('#qr-code-canvas');
        if (!canvas) return;

        // Use a simple QR code library or API
        // For now, we'll use a simple pattern-based approach
        // In production, you'd use a library like qrcode.js or an API
        
        const ctx = canvas.getContext('2d');
        const size = canvas.width;
        const moduleSize = 8;
        const modules = Math.floor(size / moduleSize);

        // Clear canvas
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);

        // Generate simple pattern (this is a placeholder - use a real QR library in production)
        ctx.fillStyle = '#000000';
        
        // Simple checkerboard pattern as placeholder
        for (let y = 0; y < modules; y++) {
            for (let x = 0; x < modules; x++) {
                // This is just a placeholder pattern
                // In production, use a QR code library
                if ((x + y) % 3 === 0 || (x * y) % 7 === 0) {
                    ctx.fillRect(x * moduleSize, y * moduleSize, moduleSize, moduleSize);
                }
            }
        }

        // Add text below
        ctx.fillStyle = '#000000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        const text = data.length > 40 ? data.substring(0, 40) + '...' : data;
        ctx.fillText(text, size / 2, size + 20);

        // Store data for download/copy
        canvas.dataset.qrData = data;
    }

    /**
     * Download QR code
     * 
     * @method downloadQRCode
     * @returns {void}
     */
    downloadQRCode() {
        const canvas = document.getElementById('qr-code-canvas');
        if (!canvas) return;

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `qrcode-${Date.now()}.png`;
            a.click();
            URL.revokeObjectURL(url);
        });
    }

    /**
     * Copy QR code to clipboard
     * 
     * @method copyQRCode
     * @returns {Promise<void>}
     */
    async copyQRCode() {
        const canvas = document.getElementById('qr-code-canvas');
        if (!canvas) return;

        try {
            canvas.toBlob(async (blob) => {
                try {
                    await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': blob })
                    ]);
                    
                    // Show success notification
                    if (window.notificationCenter) {
                        const center = window.notificationCenter();
                        center.show('QR code copied to clipboard', {
                            type: 'success',
                            duration: 2000
                        });
                    }
                } catch (error) {
                    console.error('Failed to copy QR code:', error);
                    if (window.notificationCenter) {
                        const center = window.notificationCenter();
                        center.show('Failed to copy QR code', {
                            type: 'error',
                            duration: 3000
                        });
                    }
                }
            });
        } catch (error) {
            console.error('Failed to generate QR code blob:', error);
        }
    }

    /**
     * Generate QR code for URL
     * 
     * @method generateForURL
     * @param {string} url - URL to encode
     * @returns {void}
     */
    generateForURL(url) {
        this.showQRModal(url);
    }

    /**
     * Generate QR code for text
     * 
     * @method generateForText
     * @param {string} text - Text to encode
     * @returns {void}
     */
    generateForText(text) {
        this.showQRModal(text);
    }
}

// Initialize globally
let qrCodeGeneratorInstance = null;

function initQRCodeGenerator() {
    if (!qrCodeGeneratorInstance) {
        qrCodeGeneratorInstance = new QRCodeGenerator();
    }
    return qrCodeGeneratorInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initQRCodeGenerator);
} else {
    initQRCodeGenerator();
}

// Export globally
window.QRCodeGenerator = QRCodeGenerator;
window.qrCodeGenerator = () => qrCodeGeneratorInstance;

