/**
 * Security Scanning Automation
 * Automated security vulnerability scanning
 * 
 * Features:
 * - Dependency vulnerability scanning
 * - XSS vulnerability detection
 * - SQL injection pattern detection
 * - Security header validation
 * - Content Security Policy validation
 * - Security audit logging
 */

class SecurityScanningAutomation {
    constructor() {
        this.scanResults = [];
        this.vulnerabilities = [];
        this.init();
    }

    init() {
        this.scanDependencies();
        this.scanCode();
        this.validateSecurityHeaders();
        console.log('✅ Security Scanning Automation initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_ys_ca_nn_in_ga_ut_om_at_io_n_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Scan dependencies for vulnerabilities
     */
    async scanDependencies() {
        if (typeof window === 'undefined') return;

        try {
            // Check if package.json exists and scan
            const response = await fetch('/package.json');
            if (response.ok) {
                const packageJson = await response.json();
                const dependencies = {
                    ...packageJson.dependencies,
                    ...packageJson.devDependencies
                };

                // Check for known vulnerable packages
                const vulnerablePackages = await this.checkVulnerablePackages(Object.keys(dependencies));
                
                if (vulnerablePackages.length > 0) {
                    this.recordVulnerability('dependency', {
                        packages: vulnerablePackages,
                        severity: 'high',
                        message: 'Vulnerable dependencies detected'
                    });
                }
            }
        } catch (error) {
            console.warn('Dependency scanning skipped:', error.message);
        }
    }

    /**
     * Scan code for security issues
     */
    scanCode() {
        if (typeof window === 'undefined') return;

        // Scan script tags for potential XSS
        document.querySelectorAll('script').forEach(script => {
            const content = script.textContent || script.innerHTML;
            
            // Check for dangerous patterns
            if (this.detectXSSPatterns(content)) {
                this.recordVulnerability('xss', {
                    location: 'inline-script',
                    severity: 'high',
                    message: 'Potential XSS vulnerability detected in inline script'
                });
            }

            if (this.detectSQLInjectionPatterns(content)) {
                this.recordVulnerability('sql-injection', {
                    location: 'inline-script',
                    severity: 'high',
                    message: 'Potential SQL injection vulnerability detected'
                });
            }
        });

        // Scan event handlers
        document.querySelectorAll('[onclick], [onerror], [onload]').forEach(element => {
            const handlers = Array.from(element.attributes)
                .filter(attr => attr.name.startsWith('on'))
                .map(attr => attr.value);

            handlers.forEach(handler => {
                if (this.detectXSSPatterns(handler)) {
                    this.recordVulnerability('xss', {
                        location: `inline-handler-${element.tagName}`,
                        severity: 'medium',
                        message: 'Potential XSS in inline event handler'
                    });
                }
            });
        });
    }

    /**
     * Validate security headers
     */
    async validateSecurityHeaders() {
        if (typeof window === 'undefined') return;

        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const headers = {
                'content-security-policy': response.headers.get('content-security-policy'),
                'x-frame-options': response.headers.get('x-frame-options'),
                'x-content-type-options': response.headers.get('x-content-type-options'),
                'strict-transport-security': response.headers.get('strict-transport-security'),
                'x-xss-protection': response.headers.get('x-xss-protection')
            };

            const missingHeaders = [];
            if (!headers['content-security-policy']) {
                missingHeaders.push('Content-Security-Policy');
            }
            if (!headers['x-frame-options']) {
                missingHeaders.push('X-Frame-Options');
            }
            if (!headers['x-content-type-options']) {
                missingHeaders.push('X-Content-Type-Options');
            }

            if (missingHeaders.length > 0) {
                this.recordVulnerability('security-headers', {
                    missing: missingHeaders,
                    severity: 'medium',
                    message: 'Missing security headers'
                });
            }

            // Validate CSP
            if (headers['content-security-policy']) {
                this.validateCSP(headers['content-security-policy']);
            }
        } catch (error) {
            console.warn('Security header validation skipped:', error.message);
        }
    }

    detectXSSPatterns(code) {
        const dangerousPatterns = [
            /innerHTML\s*=\s*[^"']*\+/,
            /document\.write\s*\(/,
            /eval\s*\(/,
            /Function\s*\(/,
            /<script[^>]*>.*<\/script>/i,
            /javascript:/i,
            /on\w+\s*=\s*["'][^"']*["']/i
        ];

        return dangerousPatterns.some(pattern => pattern.test(code));
    }

    detectSQLInjectionPatterns(code) {
        const sqlPatterns = [
            /SELECT\s+.*\s+FROM\s+.*\s+WHERE\s+.*\+/i,
            /INSERT\s+INTO\s+.*\s+VALUES\s*\([^)]*\+/i,
            /UPDATE\s+.*\s+SET\s+.*\s+WHERE\s+.*\+/i,
            /DELETE\s+FROM\s+.*\s+WHERE\s+.*\+/i,
            /'.*OR\s+.*=.*'/i,
            /'.*UNION\s+SELECT.*'/i
        ];

        return sqlPatterns.some(pattern => pattern.test(code));
    }

    validateCSP(cspHeader) {
        const requiredDirectives = ['default-src', 'script-src', 'style-src'];
        const directives = cspHeader.split(';').map(d => d.trim().split(' ')[0]);

        const missing = requiredDirectives.filter(req => 
            !directives.some(dir => dir.toLowerCase() === req.toLowerCase())
        );

        if (missing.length > 0) {
            this.recordVulnerability('csp', {
                missing: missing,
                severity: 'medium',
                message: 'CSP missing required directives'
            });
        }

        // Check for unsafe-inline
        if (cspHeader.includes("'unsafe-inline'")) {
            this.recordVulnerability('csp', {
                issue: 'unsafe-inline',
                severity: 'low',
                message: 'CSP allows unsafe-inline'
            });
        }
    }

    async checkVulnerablePackages(packages) {
        // This would typically call a vulnerability database API
        // For now, return empty array as placeholder
        const knownVulnerable = []; // Would be populated from security database
        
        return packages.filter(pkg => knownVulnerable.includes(pkg));
    }

    recordVulnerability(type, data) {
        const vulnerability = {
            type,
            ...data,
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
        };

        this.vulnerabilities.push(vulnerability);
        console.warn('🔒 Security Vulnerability Detected:', vulnerability);
    }

    /**
     * Get security scan report
     */
    getReport() {
        const report = {
            timestamp: new Date().toISOString(),
            totalVulnerabilities: this.vulnerabilities.length,
            bySeverity: {
                high: this.vulnerabilities.filter(v => v.severity === 'high').length,
                medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
                low: this.vulnerabilities.filter(v => v.severity === 'low').length
            },
            byType: {},
            vulnerabilities: this.vulnerabilities
        };

        // Group by type
        this.vulnerabilities.forEach(v => {
            report.byType[v.type] = (report.byType[v.type] || 0) + 1;
        });

        return report;
    }

    /**
     * Export security report
     */
    exportReport(format = 'json') {
        const report = this.getReport();
        
        if (format === 'json') {
            return JSON.stringify(report, null, 2);
        } else if (format === 'csv') {
            return this.exportToCSV();
        }
        
        return report;
    }

    exportToCSV() {
        const headers = ['Type', 'Severity', 'Message', 'Timestamp'];
        const rows = this.vulnerabilities.map(v => [
            v.type,
            v.severity,
            v.message,
            v.timestamp
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    }
}

// Initialize global instance
if (typeof window !== 'undefined') {
    window.securityScanning = new SecurityScanningAutomation();
}

