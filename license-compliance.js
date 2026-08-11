/**
 * License Compliance
 * License compliance checking
 */

class LicenseCompliance {
    constructor() {
        this.checkers = new Map();
        this.checks = new Map();
        this.licenses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('l_ic_en_se_co_mp_li_an_ce_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("l_ic_en_se_co_mp_li_an_ce_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createChecker(checkerId, checkerData) {
        const checker = {
            id: checkerId,
            ...checkerData,
            name: checkerData.name || checkerId,
            allowedLicenses: checkerData.allowedLicenses || [],
            blockedLicenses: checkerData.blockedLicenses || [],
            enabled: checkerData.enabled !== false,
            createdAt: new Date()
        };
        
        this.checkers.set(checkerId, checker);
        console.log(`License checker created: ${checkerId}`);
        return checker;
    }

    async check(checkerId, dependencies) {
        const checker = this.checkers.get(checkerId);
        if (!checker) {
            throw new Error('Checker not found');
        }
        
        const check = {
            id: `check_${Date.now()}`,
            checkerId,
            dependencies,
            status: 'checking',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.checks.set(check.id, check);
        
        const results = this.validateLicenses(checker, dependencies);
        
        check.status = 'completed';
        check.completedAt = new Date();
        check.results = results;
        check.compliant = results.every(r => r.compliant);
        
        return check;
    }

    validateLicenses(checker, dependencies) {
        return dependencies.map(dep => {
            const license = dep.license || 'unknown';
            const compliant = !checker.blockedLicenses.includes(license) &&
                (checker.allowedLicenses.length === 0 || checker.allowedLicenses.includes(license));
            
            const licenseRecord = {
                id: `license_${Date.now()}_${dep.name}`,
                package: dep.name,
                license,
                compliant,
                createdAt: new Date()
            };
            
            this.licenses.set(licenseRecord.id, licenseRecord);
            
            return licenseRecord;
        });
    }

    getChecker(checkerId) {
        return this.checkers.get(checkerId);
    }

    getCheck(checkId) {
        return this.checks.get(checkId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.licenseCompliance = new LicenseCompliance();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LicenseCompliance;
}

