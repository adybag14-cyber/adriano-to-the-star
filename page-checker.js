/**
 * On-the-Fly Page Checker & Debugger
 * 
 * Continuously monitors page state and reports issues
 */

(function() {
    'use strict';

    const checks = {
        // Check if page is blocked
        checkBlocking: () => {
            const issues = [];
            
            // Check body overflow
            if (document.body) {
                const bodyStyle = getComputedStyle(document.body);
                if (bodyStyle.overflow === 'hidden' && !document.body.classList.contains('loaded')) {
                    issues.push('Body overflow is hidden (page may be blocked)');
                }
            }

            // Check for loader blocking
            const loader = document.getElementById('space-loader');
            if (loader) {
                const loaderStyle = getComputedStyle(loader);
                if (loaderStyle.display !== 'none' && loaderStyle.pointerEvents !== 'none') {
                    issues.push('Loader element is visible and may be blocking');
                }
            }

            // Check for full-screen overlays
            const allElements = document.querySelectorAll('*');
            allElements.forEach(el => {
                const style = getComputedStyle(el);
                if (
                    style.position === 'fixed' &&
                    (style.width === '100%' || style.width === '100vw') &&
                    (style.height === '100%' || style.height === '100vh') &&
                    style.pointerEvents !== 'none' &&
                    style.display !== 'none' &&
                    parseInt(style.zIndex) > 1000
                ) {
                    issues.push(`Full-screen overlay found: ${el.id || el.className || el.tagName}`);
                }
            });

            return issues;
        },

        // Check script loading
        checkScripts: () => {
            const issues = [];
            const scripts = document.querySelectorAll('script[src]');
            scripts.forEach(script => {
                if (!script.complete && script.readyState === 'uninitialized') {
                    issues.push(`Script not loaded: ${script.src}`);
                }
            });
            return issues;
        },

        // Check CSS loading
        checkCSS: () => {
            const issues = [];
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
            stylesheets.forEach(link => {
                try {
                    const sheet = link.sheet;
                    if (!sheet && link.href) {
                        issues.push(`CSS not loaded: ${link.href}`);
                    }
                } catch (e) {
                    // Cross-origin stylesheet, can't check
                }
            });
            return issues;
        },

        // Check page interactivity
        checkInteractivity: () => {
            const issues = [];
            if (document.body) {
                const bodyStyle = getComputedStyle(document.body);
                if (bodyStyle.pointerEvents === 'none') {
                    issues.push('Body has pointer-events: none (page not clickable)');
                }
            }
            return issues;
        },

        // Check for console errors
        checkConsoleErrors: () => {
            return window.errorLog ? window.errorLog.length : 0;
        }
    };

    // Run all checks
    const runAllChecks = () => {
        const results = {
            blocking: checks.checkBlocking(),
            scripts: checks.checkScripts(),
            css: checks.checkCSS(),
            interactivity: checks.checkInteractivity(),
            errors: checks.checkConsoleErrors()
        };

        // Log results
        if (window.debugSystem) {
            const hasIssues = Object.values(results).some(r => Array.isArray(r) ? r.length > 0 : r > 0);
            if (hasIssues) {
                window.debugSystem.log('⚠️ PAGE CHECKER FOUND ISSUES:', 'warn');
                Object.entries(results).forEach(([check, issues]) => {
                    if (Array.isArray(issues) && issues.length > 0) {
                        window.debugSystem.log(`  ${check}: ${issues.join(', ')}`, 'warn');
                    } else if (typeof issues === 'number' && issues > 0) {
                        window.debugSystem.log(`  ${check}: ${issues} errors found`, 'warn');
                    }
                });
            } else {
                window.debugSystem.log('✅ Page checker: No issues found', 'info');
            }
        }

        return results;
    };

    // Run checks every 3 seconds
    setInterval(runAllChecks, 3000);
    
    // Run immediately
    setTimeout(runAllChecks, 1000);

    // Export checker
    window.pageChecker = {
        run: runAllChecks,
        checks
    };

    console.log('✅ Page checker initialized');
})();

