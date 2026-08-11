/**
 * Planet Discovery Error Reporting
 * Enhanced error reporting with user context and screenshots
 */

class PlanetDiscoveryErrorReporting {
    constructor() {
        this.reports = [];
        this.init();
    }

    init() {
        this.setupErrorHandling();
        console.log('📧 Error reporting initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_la_ne_td_is_co_ve_ry_er_ro_rr_ep_or_ti_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    setupErrorHandling() {
        // Integrate with error boundary
        if (window.planetDiscoveryErrorBoundary) {
            window.addEventListener('error', (event) => {
                this.reportError({
                    type: 'JavaScript Error',
                    message: event.message,
                    stack: event.error?.stack,
                    filename: event.filename,
                    lineno: event.lineno,
                    colno: event.colno
                });
            });

            window.addEventListener('unhandledrejection', (event) => {
                this.reportError({
                    type: 'Unhandled Promise Rejection',
                    message: event.reason?.message || String(event.reason),
                    stack: event.reason?.stack
                });
            });
        }
    }

    async reportError(errorInfo, userContext = {}) {
        const report = {
            ...errorInfo,
            context: {
                ...userContext,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                screen: {
                    width: window.screen.width,
                    height: window.screen.height
                },
                language: navigator.language,
                platform: navigator.platform
            }
        };

        this.reports.push(report);

        // Send to error reporting service
        await this.sendReport(report);

        // Store locally
        this.storeReport(report);

        return report;
    }

    async sendReport(report) {
        // Send to Supabase
        if (typeof supabase !== 'undefined' && supabase) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                
                await supabase
                    .from('error_reports')
                    .insert({
                        error_type: report.type,
                        message: report.message,
                        stack: report.stack,
                        context: report.context,
                        user_id: user?.id || null,
                        resolved: false,
                        created_at: report.context.timestamp
                    });
            } catch (error) {
                console.error('Error sending report to Supabase:', error);
            }
        }

        // Send to external error reporting service (e.g., Sentry)
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(new Error(report.message), {
                extra: report.context,
                tags: {
                    error_type: report.type
                }
            });
        }
    }

    storeReport(report) {
        try {
            const stored = JSON.parse(localStorage.getItem('error-reports') || '[]');
            stored.push(report);
            
            // Keep only last 50 reports
            if (stored.length > 50) {
                stored.shift();
            }
            
            localStorage.setItem('error-reports', JSON.stringify(stored));
        } catch (error) {
            console.error('Error storing report:', error);
        }
    }

    getReports(limit = null) {
        const reports = this.reports;
        return limit ? reports.slice(-limit) : reports;
    }

    async captureScreenshot() {
        // Note: Browser security prevents direct screenshot capture
        // This would need to be implemented server-side or with a browser extension
        return null;
    }

    renderErrorReportForm(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="error-report-form" style="background: rgba(0, 0, 0, 0.6); border: 2px solid rgba(186, 148, 79, 0.3); border-radius: 15px; padding: 2rem; margin-top: 2rem;">
                <h3 style="color: #ba944f; margin-bottom: 1.5rem;">📧 Report an Error</h3>
                <form id="error-report-form">
                    <div style="margin-bottom: 1rem;">
                        <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 0.5rem;">What happened?</label>
                        <textarea id="error-description" rows="4" required
                            style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px; resize: vertical;"></textarea>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="color: rgba(255, 255, 255, 0.9); display: block; margin-bottom: 0.5rem;">Steps to reproduce (optional)</label>
                        <textarea id="error-steps" rows="3"
                            style="width: 100%; padding: 0.75rem; background: rgba(0, 0, 0, 0.5); color: white; border: 1px solid rgba(186, 148, 79, 0.3); border-radius: 5px; resize: vertical;"></textarea>
                    </div>
                    <div style="margin-bottom: 1rem;">
                        <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                            <input type="checkbox" id="include-context" checked
                                style="width: 20px; height: 20px; cursor: pointer;">
                            <span style="color: rgba(255, 255, 255, 0.9);">Include browser and system information</span>
                        </label>
                    </div>
                    <button type="submit" style="width: 100%; padding: 0.75rem; background: rgba(186, 148, 79, 0.2); border: 2px solid rgba(186, 148, 79, 0.5); border-radius: 10px; color: #ba944f; cursor: pointer; font-weight: 600;">
                        Submit Report
                    </button>
                </form>
            </div>
        `;

        document.getElementById('error-report-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const description = document.getElementById('error-description').value;
            const steps = document.getElementById('error-steps').value;
            const includeContext = document.getElementById('include-context').checked;

            await this.reportError({
                type: 'User Reported Error',
                message: description,
                steps: steps
            }, includeContext ? {} : null);

            alert('Thank you for reporting this error! We will look into it.');
            document.getElementById('error-report-form').reset();
        });
    }
}

// Initialize and make available globally
if (typeof window !== 'undefined') {
    window.planetDiscoveryErrorReporting = new PlanetDiscoveryErrorReporting();
}

