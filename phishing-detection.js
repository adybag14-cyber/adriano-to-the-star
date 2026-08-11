/**
 * Phishing Detection
 * Phishing email and website detection system
 */

class PhishingDetection {
    constructor() {
        this.reports = new Map();
        this.indicators = new Map();
        this.init();
    }

    init() {
        this.trackEvent('p_hi_sh_in_gd_et_ec_ti_on_initialized');
        this.loadIndicators();
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("p_hi_sh_in_gd_et_ec_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    loadIndicators() {
        const indicators = [
            { type: 'suspicious_domain', pattern: /\.tk$|\.ml$|\.ga$/, weight: 3 },
            { type: 'suspicious_url', pattern: /bit\.ly|tinyurl|goo\.gl/, weight: 2 },
            { type: 'urgent_language', pattern: /urgent|immediate|act now|limited time/i, weight: 2 },
            { type: 'suspicious_sender', pattern: /noreply|no-reply|support\d+/i, weight: 1 },
            { type: 'grammar_errors', pattern: /[A-Z]{3,}|[!]{2,}/, weight: 1 }
        ];
        
        indicators.forEach(indicator => {
            this.indicators.set(indicator.type, indicator);
        });
    }

    analyzeEmail(emailData) {
        const analysis = {
            emailId: emailData.id || `email_${Date.now()}`,
            sender: emailData.sender || '',
            subject: emailData.subject || '',
            body: emailData.body || '',
            links: emailData.links || [],
            attachments: emailData.attachments || [],
            riskScore: 0,
            indicators: [],
            isPhishing: false,
            analyzedAt: new Date()
        };
        
        let riskScore = 0;
        const detectedIndicators = [];
        
        this.indicators.forEach((indicator, type) => {
            const text = `${analysis.subject} ${analysis.body}`.toLowerCase();
            if (indicator.pattern.test(text)) {
                riskScore += indicator.weight;
                detectedIndicators.push({
                    type,
                    weight: indicator.weight,
                    description: this.getIndicatorDescription(type)
                });
            }
        });
        
        analysis.links.forEach(link => {
            if (this.isSuspiciousLink(link)) {
                riskScore += 3;
                detectedIndicators.push({
                    type: 'suspicious_link',
                    weight: 3,
                    description: 'Suspicious URL detected',
                    link
                });
            }
        });
        
        analysis.riskScore = Math.min(100, riskScore * 10);
        analysis.indicators = detectedIndicators;
        analysis.isPhishing = analysis.riskScore >= 50;
        
        const reportId = `report_${Date.now()}`;
        this.reports.set(reportId, analysis);
        
        return analysis;
    }

    isSuspiciousLink(url) {
        const suspiciousPatterns = [
            /bit\.ly|tinyurl|goo\.gl|t\.co/,
            /\.tk$|\.ml$|\.ga$/,
            /http:\/\/(?!www\.)/,
            /ip_address_pattern/
        ];
        
        return suspiciousPatterns.some(pattern => pattern.test(url));
    }

    getIndicatorDescription(type) {
        const descriptions = {
            'suspicious_domain': 'Suspicious domain detected',
            'suspicious_url': 'Suspicious URL shortening service',
            'urgent_language': 'Urgent or threatening language',
            'suspicious_sender': 'Suspicious sender address',
            'grammar_errors': 'Grammar or formatting errors',
            'suspicious_link': 'Suspicious link detected'
        };
        
        return descriptions[type] || 'Unknown indicator';
    }

    analyzeWebsite(url, htmlContent) {
        const analysis = {
            url,
            riskScore: 0,
            indicators: [],
            isPhishing: false,
            analyzedAt: new Date()
        };
        
        let riskScore = 0;
        const detectedIndicators = [];
        
        if (this.isSuspiciousLink(url)) {
            riskScore += 3;
            detectedIndicators.push({
                type: 'suspicious_url',
                weight: 3,
                description: 'Suspicious URL'
            });
        }
        
        if (htmlContent) {
            const lowerContent = htmlContent.toLowerCase();
            
            if (lowerContent.includes('password') && lowerContent.includes('verify')) {
                riskScore += 2;
                detectedIndicators.push({
                    type: 'credential_harvesting',
                    weight: 2,
                    description: 'Potential credential harvesting page'
                });
            }
            
            if (lowerContent.includes('ssl') && !url.startsWith('https://')) {
                riskScore += 2;
                detectedIndicators.push({
                    type: 'insecure_connection',
                    weight: 2,
                    description: 'SSL mentioned but connection not secure'
                });
            }
        }
        
        analysis.riskScore = Math.min(100, riskScore * 10);
        analysis.indicators = detectedIndicators;
        analysis.isPhishing = analysis.riskScore >= 50;
        
        const reportId = `report_${Date.now()}`;
        this.reports.set(reportId, analysis);
        
        return analysis;
    }

    getReport(reportId) {
        return this.reports.get(reportId);
    }

    getStatistics() {
        const reports = Array.from(this.reports.values());
        const total = reports.length;
        const phishing = reports.filter(r => r.isPhishing).length;
        
        return {
            totalReports: total,
            phishingDetected: phishing,
            falsePositives: total - phishing,
            detectionRate: total > 0 ? (phishing / total) * 100 : 0
        };
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.phishingDetection = new PhishingDetection();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PhishingDetection;
}

