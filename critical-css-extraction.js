/**
 * Critical CSS Extraction
 * Extract and inline critical CSS for above-the-fold content
 */

class CriticalCSSExtraction {
    constructor() {
        this.criticalCSS = new Map();
        this.extractionRules = new Map();
        this.init();
    }

    init() {
        this.trackEvent('critical_css_ext_initialized');
    }

    extractCriticalCSS(pageId, html, css, viewport = { width: 1920, height: 1080 }) {
        // Simulate critical CSS extraction
        const critical = this.identifyCriticalStyles(css, html);
        
        this.criticalCSS.set(pageId, {
            id: pageId,
            criticalCSS: critical,
            originalSize: css.length,
            criticalSize: critical.length,
            reduction: ((css.length - critical.length) / css.length * 100).toFixed(2) + '%',
            viewport,
            extractedAt: new Date()
        });
        
        console.log(`Critical CSS extracted for page: ${pageId}`);
        return this.criticalCSS.get(pageId);
    }

    identifyCriticalStyles(css, html) {
        // Mock critical CSS identification
        // In real implementation, this would analyze the DOM and CSS
        const criticalSelectors = [
            'body', 'html', '.header', '.navigation', '.hero',
            '.above-fold', '.main-content', '.button', '.link'
        ];
        
        const lines = css.split('\n');
        const critical = [];
        
        lines.forEach(line => {
            criticalSelectors.forEach(selector => {
                if (line.includes(selector)) {
                    critical.push(line);
                }
            });
        });
        
        return critical.join('\n');
    }

    inlineCriticalCSS(pageId) {
        const extraction = this.criticalCSS.get(pageId);
        if (!extraction) {
            throw new Error('Critical CSS not found for this page');
        }
        
        return {
            inline: `<style>${extraction.criticalCSS}</style>`,
            deferred: `<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">`
        };
    }

    addExtractionRule(ruleId, selector, priority) {
        this.extractionRules.set(ruleId, {
            id: ruleId,
            selector,
            priority,
            enabled: true,
            createdAt: new Date()
        });
        console.log(`Extraction rule added: ${ruleId}`);
    }

    getCriticalCSS(pageId) {
        return this.criticalCSS.get(pageId);
    }

    getAllExtractions() {
        return Array.from(this.criticalCSS.values());
    }

    optimizeCriticalCSS(pageId) {
        const extraction = this.criticalCSS.get(pageId);
        if (!extraction) {
            throw new Error('Critical CSS not found');
        }
        
        // Minify and optimize
        const optimized = extraction.criticalCSS
            .replace(/\s+/g, ' ')
            .replace(/;\s*}/g, '}')
            .trim();
        
        extraction.optimizedCSS = optimized;
        extraction.optimizedSize = optimized.length;
        
        return extraction;
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`critical_css_ext_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.criticalCSSExtraction = new CriticalCSSExtraction();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CriticalCSSExtraction;
}

