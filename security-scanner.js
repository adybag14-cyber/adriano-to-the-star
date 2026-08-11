/**
 * Automated Security Scanner
 * Detects common vulnerabilities and security issues
 */

class SecurityScanner {
    constructor() {
        this.scanResults = [];
        this.vulnerabilities = [];
        this.isScanning = false;
        this.isInitialized = false;
        
        this.init();
    }

    init() {
        this.isInitialized = true;
        console.log('🔍 Security Scanner initialized');
        
        // Run initial scan
        this.scan();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ec_ur_it_ys_ca_nn_er_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Run comprehensive security scan
     */
    async scan() {
        if (this.isScanning) return;
        
        this.isScanning = true;
        this.vulnerabilities = [];
        
        console.log('🔍 Starting security scan...');
        
        // Run all scan checks
        await Promise.all([
            this.scanXSSVulnerabilities(),
            this.scanCSRFVulnerabilities(),
            this.scanInsecureStorage(),
            this.scanMissingHTTPS(),
            this.scanExposedSecrets(),
            this.scanInsecureCookies(),
            this.scanMissingCSP(),
            this.scanOutdatedDependencies(),
            this.scanInsecureAPIs(),
            this.scanSQLInjectionRisks()
        ]);
        
        this.isScanning = false;
        
        // Log results
        if (this.vulnerabilities.length > 0) {
            console.warn(`⚠️ Security scan found ${this.vulnerabilities.length} potential issues`);
            this.vulnerabilities.forEach(vuln => {
                console.warn(`  - ${vuln.severity}: ${vuln.title} - ${vuln.description}`);
            });
        } else {
            console.log('✅ Security scan completed - no issues found');
        }
        
        // Save results
        this.saveScanResults();
        
        // Log to security audit if available
        if (window.securityAuditLogging) {
            window.securityAuditLogging.logEvent('security.scan', {
                vulnerabilities: this.vulnerabilities.length,
                timestamp: new Date().toISOString()
            });
        }
        
        return this.vulnerabilities;
    }

    /**
     * Scan for XSS vulnerabilities
     */
    async scanXSSVulnerabilities() {
        // Check for innerHTML usage without sanitization
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent.includes('innerHTML') && 
                !script.textContent.includes('DOMPurify') &&
                !script.textContent.includes('textContent')) {
                this.addVulnerability({
                    severity: 'medium',
                    title: 'Potential XSS via innerHTML',
                    description: 'innerHTML usage detected without sanitization',
                    recommendation: 'Use textContent or DOMPurify for sanitization',
                    location: 'script'
                });
            }
        });

        // Check for eval() usage
        const allScripts = Array.from(document.scripts);
        for (const script of allScripts) {
            if (script.textContent.includes('eval(') || 
                script.textContent.includes('Function(') ||
                script.textContent.includes('setTimeout(') ||
                script.textContent.includes('setInterval(')) {
                // Check if it's using user input
                if (script.textContent.includes('userInput') || 
                    script.textContent.includes('userData')) {
                    this.addVulnerability({
                        severity: 'high',
                        title: 'Potential XSS via eval() with user input',
                        description: 'eval() or similar function used with potentially unsafe input',
                        recommendation: 'Avoid eval() and use safer alternatives',
                        location: 'script'
                    });
                }
            }
        }
    }

    /**
     * Scan for CSRF vulnerabilities
     */
    async scanCSRFVulnerabilities() {
        const forms = document.querySelectorAll('form');
        let formsWithoutCSRF = 0;
        
        forms.forEach(form => {
            const csrfToken = form.querySelector('input[name="csrf-token"]');
            if (!csrfToken && form.action && !form.action.startsWith('#')) {
                formsWithoutCSRF++;
            }
        });
        
        if (formsWithoutCSRF > 0) {
            this.addVulnerability({
                severity: 'medium',
                title: 'Forms without CSRF protection',
                description: `${formsWithoutCSRF} form(s) missing CSRF tokens`,
                recommendation: 'Add CSRF tokens to all forms',
                location: 'forms'
            });
        }
    }

    /**
     * Scan for insecure storage
     */
    async scanInsecureStorage() {
        // Check localStorage for sensitive data
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                const value = localStorage.getItem(key);
                
                // Check for potential sensitive data patterns
                if (key.toLowerCase().includes('password') ||
                    key.toLowerCase().includes('token') ||
                    key.toLowerCase().includes('secret') ||
                    key.toLowerCase().includes('api_key')) {
                    
                    // Check if it's encrypted or hashed
                    if (value && value.length < 64 && !value.startsWith('$2')) {
                        this.addVulnerability({
                            severity: 'high',
                            title: 'Potential sensitive data in localStorage',
                            description: `Sensitive data stored in localStorage: ${key}`,
                            recommendation: 'Encrypt sensitive data or use secure storage',
                            location: 'localStorage'
                        });
                    }
                }
            }
        } catch (error) {
            // Ignore errors
        }
    }

    /**
     * Scan for missing HTTPS
     */
    async scanMissingHTTPS() {
        if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
            this.addVulnerability({
                severity: 'high',
                title: 'Site not using HTTPS',
                description: 'Site is accessible via HTTP, which is insecure',
                recommendation: 'Enable HTTPS for all connections',
                location: 'protocol'
            });
        }
    }

    /**
     * Scan for exposed secrets
     */
    async scanExposedSecrets() {
        // Check for API keys in scripts
        const scripts = document.querySelectorAll('script');
        const secretPatterns = [
            /api[_-]?key\s*[:=]\s*['"]([^'"]+)['"]/gi,
            /secret\s*[:=]\s*['"]([^'"]+)['"]/gi,
            /password\s*[:=]\s*['"]([^'"]+)['"]/gi,
            /token\s*[:=]\s*['"]([^'"]+)['"]/gi
        ];
        
        scripts.forEach(script => {
            secretPatterns.forEach(pattern => {
                const matches = script.textContent.match(pattern);
                if (matches) {
                    matches.forEach(match => {
                        // Check if it's a real secret (not a placeholder)
                        if (!match.includes('YOUR_') && 
                            !match.includes('PLACEHOLDER') &&
                            match.length > 10) {
                            this.addVulnerability({
                                severity: 'critical',
                                title: 'Potential secret exposed in code',
                                description: 'Possible API key or secret found in script',
                                recommendation: 'Move secrets to environment variables or secure storage',
                                location: 'script'
                            });
                        }
                    });
                }
            });
        });
    }

    /**
     * Scan for insecure cookies
     */
    async scanInsecureCookies() {
        // Check document.cookie for insecure flags
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            if (!cookie.includes('Secure') && !cookie.includes('HttpOnly')) {
                // Only flag if it's a session or auth cookie
                if (cookie.toLowerCase().includes('session') ||
                    cookie.toLowerCase().includes('auth') ||
                    cookie.toLowerCase().includes('token')) {
                    this.addVulnerability({
                        severity: 'medium',
                        title: 'Insecure cookie detected',
                        description: 'Cookie missing Secure or HttpOnly flags',
                        recommendation: 'Add Secure and HttpOnly flags to sensitive cookies',
                        location: 'cookies'
                    });
                }
            }
        });
    }

    /**
     * Scan for missing CSP
     */
    async scanMissingCSP() {
        const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!cspMeta) {
            this.addVulnerability({
                severity: 'medium',
                title: 'Missing Content Security Policy',
                description: 'No CSP header or meta tag found',
                recommendation: 'Add CSP to prevent XSS attacks',
                location: 'headers'
            });
        }
    }

    /**
     * Scan for outdated dependencies
     */
    async scanOutdatedDependencies() {
        // Check for known vulnerable libraries
        const vulnerableLibs = [
            { name: 'jquery', version: '3.0.0', issue: 'Known XSS vulnerabilities' },
            { name: 'lodash', version: '4.17.0', issue: 'Prototype pollution' }
        ];
        
        // This would typically check package.json or CDN versions
        // For now, just check if old versions are loaded
        const scripts = Array.from(document.scripts);
        scripts.forEach(script => {
            if (script.src) {
                vulnerableLibs.forEach(lib => {
                    if (script.src.includes(lib.name)) {
                        // Check version in URL
                        const versionMatch = script.src.match(/(\d+\.\d+\.\d+)/);
                        if (versionMatch) {
                            const version = versionMatch[1];
                            if (this.compareVersions(version, lib.version) < 0) {
                                this.addVulnerability({
                                    severity: 'medium',
                                    title: `Outdated ${lib.name} version`,
                                    description: `${lib.name} ${version} may have vulnerabilities: ${lib.issue}`,
                                    recommendation: `Update ${lib.name} to latest version`,
                                    location: 'dependencies'
                                });
                            }
                        }
                    }
                });
            }
        });
    }

    /**
     * Scan for insecure API calls
     */
    async scanInsecureAPIs() {
        // Check for HTTP API calls (should be HTTPS)
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent.includes('http://') && 
                !script.textContent.includes('localhost') &&
                !script.textContent.includes('127.0.0.1')) {
                this.addVulnerability({
                    severity: 'medium',
                    title: 'Insecure API call detected',
                    description: 'HTTP API call found (should use HTTPS)',
                    recommendation: 'Use HTTPS for all API calls',
                    location: 'api'
                });
            }
        });
    }

    /**
     * Scan for SQL injection risks
     */
    async scanSQLInjectionRisks() {
        // Check for direct SQL string concatenation
        const scripts = document.querySelectorAll('script');
        scripts.forEach(script => {
            if (script.textContent.includes('SELECT') || 
                script.textContent.includes('INSERT') ||
                script.textContent.includes('UPDATE')) {
                
                // Check for string concatenation with user input
                if (script.textContent.includes('+') && 
                    (script.textContent.includes('userInput') ||
                     script.textContent.includes('userData'))) {
                    this.addVulnerability({
                        severity: 'high',
                        title: 'Potential SQL injection risk',
                        description: 'SQL query construction with string concatenation detected',
                        recommendation: 'Use parameterized queries or ORM',
                        location: 'database'
                    });
                }
            }
        });
    }

    /**
     * Add vulnerability to list
     */
    addVulnerability(vuln) {
        // Check if already exists
        const exists = this.vulnerabilities.some(v => 
            v.title === vuln.title && v.location === vuln.location
        );
        
        if (!exists) {
            this.vulnerabilities.push({
                ...vuln,
                id: `vuln-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Compare version strings
     */
    compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 < part2) return -1;
            if (part1 > part2) return 1;
        }
        
        return 0;
    }

    /**
     * Save scan results
     */
    saveScanResults() {
        try {
            const results = {
                timestamp: new Date().toISOString(),
                vulnerabilities: this.vulnerabilities,
                summary: {
                    total: this.vulnerabilities.length,
                    critical: this.vulnerabilities.filter(v => v.severity === 'critical').length,
                    high: this.vulnerabilities.filter(v => v.severity === 'high').length,
                    medium: this.vulnerabilities.filter(v => v.severity === 'medium').length,
                    low: this.vulnerabilities.filter(v => v.severity === 'low').length
                }
            };
            
            localStorage.setItem('security-scan-results', JSON.stringify(results));
            
            // Save to Supabase if available
            if (window.supabase) {
                window.supabase
                    .from('security_scans')
                    .insert({
                        scan_id: `scan-${Date.now()}`,
                        timestamp: results.timestamp,
                        vulnerabilities: results.vulnerabilities,
                        summary: results.summary
                    })
                    .catch(error => {
                        console.warn('Could not save scan to Supabase:', error);
                    });
            }
        } catch (error) {
            console.error('Error saving scan results:', error);
        }
    }

    /**
     * Get scan results
     */
    getScanResults() {
        try {
            const stored = localStorage.getItem('security-scan-results');
            return stored ? JSON.parse(stored) : null;
        } catch (error) {
            console.error('Error loading scan results:', error);
            return null;
        }
    }
}

// Initialize globally
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        if (!window.securityScanner) {
            window.securityScanner = new SecurityScanner();
        }
    });
}

