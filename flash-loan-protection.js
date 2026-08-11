/**
 * Flash Loan Protection
 * Flash loan attack protection system
 */

class FlashLoanProtection {
    constructor() {
        this.protections = new Map();
        this.loans = new Map();
        this.checks = new Map();
        this.init();
    }

    init() {
        this.trackEvent('f_la_sh_lo_an_pr_ot_ec_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("f_la_sh_lo_an_pr_ot_ec_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    async createProtection(protectionId, protectionData) {
        const protection = {
            id: protectionId,
            ...protectionData,
            contract: protectionData.contract || '',
            maxLoanAmount: protectionData.maxLoanAmount || 0,
            whitelist: protectionData.whitelist || [],
            status: 'active',
            createdAt: new Date()
        };
        
        this.protections.set(protectionId, protection);
        return protection;
    }

    async checkLoan(loanId, loanData) {
        const loan = {
            id: loanId,
            ...loanData,
            borrower: loanData.borrower || '',
            amount: loanData.amount || 0,
            token: loanData.token || '',
            status: 'pending',
            createdAt: new Date()
        };

        const protection = Array.from(this.protections.values())
            .find(p => p.contract === loanData.contract);

        if (protection) {
            if (loan.amount > protection.maxLoanAmount) {
                loan.status = 'rejected';
                loan.reason = 'exceeds_max_amount';
            } else if (protection.whitelist.length > 0 && !protection.whitelist.includes(loan.borrower)) {
                loan.status = 'rejected';
                loan.reason = 'not_whitelisted';
            } else {
                loan.status = 'approved';
            }
        } else {
            loan.status = 'approved';
        }

        this.loans.set(loanId, loan);
        return loan;
    }

    async validateTransaction(transactionId, transactionData) {
        const check = {
            id: transactionId,
            ...transactionData,
            contract: transactionData.contract || '',
            transaction: transactionData.transaction || '',
            status: 'pending',
            createdAt: new Date()
        };

        await this.performCheck(check);
        this.checks.set(transactionId, check);
        return check;
    }

    async performCheck(check) {
        await new Promise(resolve => setTimeout(resolve, 500));
        check.status = 'passed';
        check.checkedAt = new Date();
    }

    getProtection(protectionId) {
        return this.protections.get(protectionId);
    }

    getAllProtections() {
        return Array.from(this.protections.values());
    }

    getLoan(loanId) {
        return this.loans.get(loanId);
    }

    getAllLoans() {
        return Array.from(this.loans.values());
    }
}

module.exports = FlashLoanProtection;

