/**
 * Print-Friendly Page Layouts
 * 
 * Optimizes page layouts for printing with proper page breaks, headers, footers,
 * and removes unnecessary elements when printing.
 * 
 * @class PrintFriendlyLayouts
 * @example
 * // Auto-initializes on page load
 * // Access via: window.printFriendlyLayouts()
 * 
 * // Trigger print-optimized view
 * const printLayouts = window.printFriendlyLayouts();
 * printLayouts.prepareForPrint();
 * window.print();
 */
class PrintFriendlyLayouts {
    constructor() {
        this.originalStyles = new Map();
        this.printStyles = null;
        this.init();
    }

    init() {
        // Setup print event listeners
        this.setupPrintListeners();
        
        // Inject print styles
        this.injectPrintStyles();
        
        console.log('✅ Print-Friendly Layouts initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_ri_nt_fr_ie_nd_ly_la_yo_ut_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Setup print event listeners
     * 
     * @method setupPrintListeners
     * @returns {void}
     */
    setupPrintListeners() {
        window.addEventListener('beforeprint', () => {
            this.prepareForPrint();
        });

        window.addEventListener('afterprint', () => {
            this.restoreAfterPrint();
        });
    }

    /**
     * Prepare page for printing
     * 
     * Hides non-essential elements and optimizes layout for printing.
     * 
     * @method prepareForPrint
     * @returns {void}
     */
    prepareForPrint() {
        // Hide navigation, music player, toolbars
        const elementsToHide = [
            '#navigation',
            '#cosmic-music-player',
            '#quick-actions-toolbar',
            '.share-widget',
            '.notification',
            'button[data-export-user-data]',
            'button[data-import-user-data]'
        ];

        elementsToHide.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
                if (el && !this.originalStyles.has(el)) {
                    this.originalStyles.set(el, {
                        display: el.style.display,
                        visibility: el.style.visibility
                    });
                    el.style.display = 'none';
                }
            });
        });

        // Add print header/footer
        this.addPrintHeaderFooter();
    }

    /**
     * Restore page after printing
     * 
     * @method restoreAfterPrint
     * @returns {void}
     */
    restoreAfterPrint() {
        // Restore hidden elements
        this.originalStyles.forEach((styles, element) => {
            if (element) {
                element.style.display = styles.display || '';
                element.style.visibility = styles.visibility || '';
            }
        });
        this.originalStyles.clear();

        // Remove print header/footer
        this.removePrintHeaderFooter();
    }

    /**
     * Add print header and footer
     * 
     * @method addPrintHeaderFooter
     * @returns {void}
     * @private
     */
    addPrintHeaderFooter() {
        const header = document.createElement('div');
        header.className = 'print-header';
        header.innerHTML = `
            <div class="print-header-content">
                <h1>${document.title}</h1>
                <p>Printed from: ${window.location.href}</p>
                <p>Date: ${new Date().toLocaleString()}</p>
            </div>
        `;

        const footer = document.createElement('div');
        footer.className = 'print-footer';
        footer.innerHTML = `
            <div class="print-footer-content">
                <p>Adriano To The Star - Interstellar Travel Agency</p>
                <p>Page <span class="page-number"></span></p>
            </div>
        `;

        document.body.insertBefore(header, document.body.firstChild);
        document.body.appendChild(footer);
    }

    /**
     * Remove print header and footer
     * 
     * @method removePrintHeaderFooter
     * @returns {void}
     * @private
     */
    removePrintHeaderFooter() {
        const header = document.querySelector('.print-header');
        const footer = document.querySelector('.print-footer');
        if (header) header.remove();
        if (footer) footer.remove();
    }

    /**
     * Inject print-specific CSS styles
     * 
     * @method injectPrintStyles
     * @returns {void}
     * @private
     */
    injectPrintStyles() {
        if (document.getElementById('print-friendly-styles')) return;

        const style = document.createElement('style');
        style.id = 'print-friendly-styles';
        style.textContent = `
            @media print {
                /* Hide non-essential elements */
                nav, #navigation, #cosmic-music-player, 
                #quick-actions-toolbar, .share-widget,
                .notification, button[data-export-user-data],
                button[data-import-user-data] {
                    display: none !important;
                }

                /* Page setup */
                @page {
                    size: A4;
                    margin: 2cm;
                }

                /* Print header */
                .print-header {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    height: 3cm;
                    background: white;
                    border-bottom: 2px solid #ba944f;
                    padding: 1cm;
                    page-break-after: avoid;
                }

                .print-header-content h1 {
                    color: #ba944f;
                    font-size: 18pt;
                    margin: 0 0 0.5cm 0;
                }

                .print-header-content p {
                    font-size: 10pt;
                    color: #666;
                    margin: 0.25cm 0;
                }

                /* Print footer */
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 2cm;
                    background: white;
                    border-top: 2px solid #ba944f;
                    padding: 0.5cm 1cm;
                    page-break-before: avoid;
                }

                .print-footer-content {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    font-size: 10pt;
                    color: #666;
                }

                /* Content adjustments */
                body {
                    background: white !important;
                    color: black !important;
                }

                main {
                    margin-top: 3.5cm;
                    margin-bottom: 2.5cm;
                }

                /* Page breaks */
                section {
                    page-break-inside: avoid;
                }

                h1, h2, h3 {
                    page-break-after: avoid;
                }

                img {
                    max-width: 100% !important;
                    page-break-inside: avoid;
                }

                /* Links */
                a {
                    color: #000 !important;
                    text-decoration: underline !important;
                }

                a[href^="http"]:after {
                    content: " (" attr(href) ")";
                    font-size: 0.8em;
                    color: #666;
                }

                /* Tables */
                table {
                    page-break-inside: avoid;
                    border-collapse: collapse;
                }

                tr {
                    page-break-inside: avoid;
                }

                /* Charts and canvas */
                canvas {
                    max-width: 100% !important;
                    page-break-inside: avoid;
                }
            }
        `;

        document.head.appendChild(style);
    }
}

// Initialize globally
let printFriendlyLayoutsInstance = null;

function initPrintFriendlyLayouts() {
    if (!printFriendlyLayoutsInstance) {
        printFriendlyLayoutsInstance = new PrintFriendlyLayouts();
    }
    return printFriendlyLayoutsInstance;
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPrintFriendlyLayouts);
} else {
    initPrintFriendlyLayouts();
}

// Export globally
window.PrintFriendlyLayouts = PrintFriendlyLayouts;
window.printFriendlyLayouts = () => printFriendlyLayoutsInstance;


