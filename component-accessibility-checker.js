/**
 * Component Accessibility Checker
 * WCAG compliance validation and reporting for UI components
 * @author Agent 3 - Adriano To The Star
 */

class ComponentAccessibilityChecker {
    constructor() {
        this.rules = this.initializeRules();
        this.violations = [];
        this.reports = new Map();
        this.init();
    }

    initializeRules() {
        return {
            // WCAG 2.1 Level AA compliance rules
            'keyboard-accessible': {
                test: (element) => {
                    const tabIndex = element.tabIndex;
                    const interactive = ['button', 'a', 'input', 'select', 'textarea'].includes(element.tagName.toLowerCase());
                    return interactive && tabIndex < 0;
                },
                message: 'Interactive elements must be keyboard accessible',
                level: 'AA'
            },
            'aria-labels': {
                test: (element) => {
                    const hasAria = element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby');
                    const needsAria = ['button', 'link'].includes(element.getAttribute('role')) && !element.textContent.trim();
                    return needsAria && !hasAria;
                },
                message: 'Elements without text content need aria-label or aria-labelledby',
                level: 'AA'
            },
            'contrast-ratio': {
                test: (element) => {
                    const styles = window.getComputedStyle(element);
                    const color = styles.color;
                    const background = styles.backgroundColor;
                    return this.getContrastRatio(color, background) < 4.5;
                },
                message: 'Text contrast ratio must be at least 4.5:1 (Level AA)',
                level: 'AA'
            },
            'focus-indicators': {
                test: (element) => {
                    const styles = window.getComputedStyle(element, ':focus');
                    return styles.outline === 'none' && styles.boxShadow === 'none';
                },
                message: 'Focusable elements must have visible focus indicators',
                level: 'AA'
            },
            'alt-text': {
                test: (element) => {
                    return element.tagName.toLowerCase() === 'img' && !element.alt;
                },
                message: 'Images must have alt text for screen readers',
                level: 'A'
            },
            'heading-structure': {
                test: (element) => {
                    if (!['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(element.tagName.toLowerCase())) return false;
                    const level = parseInt(element.tagName[1]);
                    const prevHeading = this.findPreviousHeading(element);
                    if (prevHeading) {
                        const prevLevel = parseInt(prevHeading.tagName[1]);
                        return level > prevLevel + 1;
                    }
                    return level > 1;
                },
                message: 'Heading levels should not be skipped (e.g., h1 to h3)',
                level: 'AA'
            }
        };
    }

    init() {
        this.setupKeyboardNavigation();
        this.createAccessibilityPanel();
        this.trackEvent('a11y_checker_initialized');
    }

    checkComponent(container) {
        const violations = [];
        const elements = container.querySelectorAll('*');
        
        elements.forEach(element => {
            Object.entries(this.rules).forEach(([ruleId, rule]) => {
                if (rule.test(element)) {
                    violations.push({
                        element,
                        ruleId,
                        message: rule.message,
                        level: rule.level,
                        elementInfo: this.getElementInfo(element)
                    });
                }
            });
        });

        this.violations = violations;
        this.generateReport(container);
        return violations;
    }

    getElementInfo(element) {
        return {
            tagName: element.tagName,
            id: element.id,
            classes: element.className,
            textContent: element.textContent.substring(0, 50),
            role: element.getAttribute('role'),
            ariaLabel: element.getAttribute('aria-label')
        };
    }

    getContrastRatio(color1, color2) {
        const rgb1 = this.hexToRgb(color1);
        const rgb2 = this.hexToRgb(color2);
        
        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    hexToRgb(hex) {
        const result = /^rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(hex);
        return result ? {
            r: parseInt(result[1]),
            g: parseInt(result[2]),
            b: parseInt(result[3])
        } : { r: 0, g: 0, b: 0 };
    }

    getLuminance(rgb) {
        const rsRGB = rgb.r / 255;
        const gsRGB = rgb.g / 255;
        const bsRGB = rgb.b / 255;
        
        const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
        const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
        const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
        
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    }

    findPreviousHeading(element) {
        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
        const index = headings.indexOf(element);
        return index > 0 ? headings[index - 1] : null;
    }

    generateReport(container) {
        const report = {
            timestamp: new Date().toISOString(),
            container: container.id || container.className || 'unknown',
            violations: this.violations,
            score: this.calculateScore(),
            summary: this.generateSummary()
        };
        
        this.reports.set(container, report);
        this.displayReport(report);
    }

    calculateScore() {
        const totalChecks = Object.keys(this.rules).length;
        const violations = this.violations.length;
        return Math.max(0, 100 - (violations / totalChecks * 100));
    }

    generateSummary() {
        const summary = {
            total: this.violations.length,
            byLevel: {},
            byRule: {}
        };
        
        this.violations.forEach(violation => {
            summary.byLevel[violation.level] = (summary.byLevel[violation.level] || 0) + 1;
            summary.byRule[violation.ruleId] = (summary.byRule[violation.ruleId] || 0) + 1;
        });
        
        return summary;
    }

    createAccessibilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'accessibility-panel';
        panel.innerHTML = `
            <div class="a11y-panel-header">
                <h3>Accessibility Checker</h3>
                <button class="a11y-toggle">×</button>
            </div>
            <div class="a11y-panel-content">
                <div class="a11y-score"></div>
                <div class="a11y-violations"></div>
                <div class="a11y-actions">
                    <button class="a11y-check-btn">Check Current Page</button>
                    <button class="a11y-export-btn">Export Report</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.setupPanelEvents(panel);
        this.addPanelStyles();
    }

    setupPanelEvents(panel) {
        const toggle = panel.querySelector('.a11y-toggle');
        const checkBtn = panel.querySelector('.a11y-check-btn');
        const exportBtn = panel.querySelector('.a11y-export-btn');
        
        toggle.addEventListener('click', () => {
            panel.classList.toggle('collapsed');
        });
        
        checkBtn.addEventListener('click', () => {
            this.checkPage();
        });
        
        exportBtn.addEventListener('click', () => {
            this.exportReport();
        });
    }

    checkPage() {
        const violations = this.checkComponent(document.body);
        this.displayNotification(`Found ${violations.length} accessibility issues`);
    }

    displayReport(report) {
        const scoreElement = document.querySelector('.a11y-score');
        const violationsElement = document.querySelector('.a11y-violations');
        
        scoreElement.innerHTML = `
            <div class="score-display">
                <div class="score-value ${report.score >= 80 ? 'good' : report.score >= 60 ? 'warning' : 'poor'}">
                    ${report.score.toFixed(1)}%
                </div>
                <div class="score-label">Accessibility Score</div>
            </div>
        `;
        
        violationsElement.innerHTML = `
            <h4>Violations (${report.violations.length})</h4>
            <div class="violations-list">
                ${report.violations.map(violation => `
                    <div class="violation-item level-${violation.level.toLowerCase()}">
                        <div class="violation-message">${violation.message}</div>
                        <div class="violation-element">${violation.elementInfo.tagName}${violation.elementInfo.id ? '#' + violation.elementInfo.id : ''}</div>
                        <button class="highlight-element" data-element-id="${violation.elementInfo.id}">Highlight</button>
                    </div>
                `).join('')}
            </div>
        `;
        
        // Add highlight functionality
        violationsElement.querySelectorAll('.highlight-element').forEach(btn => {
            btn.addEventListener('click', () => {
                const element = document.getElementById(btn.dataset.elementId);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.style.outline = '3px solid red';
                    setTimeout(() => {
                        element.style.outline = '';
                    }, 3000);
                }
            });
        });
    }

    exportReport() {
        const reports = Array.from(this.reports.values());
        const dataStr = JSON.stringify(reports, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                document.body.classList.add('keyboard-navigation');
            }
        });
        
        document.addEventListener('mousedown', () => {
            document.body.classList.remove('keyboard-navigation');
        });
    }

    displayNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'a11y-notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    addPanelStyles() {
        if (document.querySelector('#a11y-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'a11y-styles';
        style.textContent = `
            #accessibility-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 80vh;
                background: var(--color-surface);
                border: 1px solid var(--color-background);
                border-radius: 8px;
                box-shadow: var(--effect-shadow);
                z-index: 10000;
                font-family: system-ui, sans-serif;
            }
            
            #accessibility-panel.collapsed {
                max-height: 60px;
            }
            
            .a11y-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 15px;
                border-bottom: 1px solid var(--color-background);
            }
            
            .a11y-panel-header h3 {
                margin: 0;
                color: var(--color-text);
            }
            
            .a11y-toggle {
                background: none;
                border: none;
                font-size: 20px;
                cursor: pointer;
                color: var(--color-text);
            }
            
            .a11y-panel-content {
                padding: 15px;
                overflow-y: auto;
            }
            
            .score-display {
                text-align: center;
                margin-bottom: 20px;
            }
            
            .score-value {
                font-size: 48px;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .score-value.good { color: #22c55e; }
            .score-value.warning { color: #f59e0b; }
            .score-value.poor { color: #ef4444; }
            
            .score-label {
                color: var(--color-text-secondary);
            }
            
            .violations-list {
                max-height: 300px;
                overflow-y: auto;
            }
            
            .violation-item {
                padding: 10px;
                margin-bottom: 10px;
                border-radius: 4px;
                border-left: 4px solid;
            }
            
            .violation-item.level-a { border-left-color: #ef4444; }
            .violation-item.level-aa { border-left-color: #f59e0b; }
            .violation-item.level-aaa { border-left-color: #22c55e; }
            
            .violation-message {
                font-weight: 600;
                margin-bottom: 5px;
            }
            
            .violation-element {
                font-size: 12px;
                color: var(--color-text-secondary);
                margin-bottom: 8px;
            }
            
            .highlight-element {
                background: var(--color-primary);
                color: white;
                border: none;
                padding: 4px 8px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .a11y-actions {
                display: flex;
                gap: 10px;
                margin-top: 20px;
            }
            
            .a11y-actions button {
                flex: 1;
                padding: 10px;
                background: var(--color-primary);
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
            }
            
            .a11y-notification {
                position: fixed;
                top: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: var(--color-primary);
                color: white;
                padding: 12px 20px;
                border-radius: 4px;
                z-index: 10001;
            }
            
            .keyboard-navigation *:focus {
                outline: 2px solid var(--color-primary);
                outline-offset: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`a11y_checker_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

// Initialize
window.ComponentAccessibilityChecker = ComponentAccessibilityChecker;
window.a11yChecker = new ComponentAccessibilityChecker();
