/**
 * Invoice Management
 * Invoice management system
 */

class InvoiceManagement {
    constructor() {
        this.invoices = new Map();
        this.items = new Map();
        this.payments = new Map();
        this.init();
    }

    init() {
        this.trackEvent('invoice_mgmt_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`invoice_mgmt_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }

    async createInvoice(invoiceId, invoiceData) {
        const invoice = {
            id: invoiceId,
            ...invoiceData,
            number: invoiceData.number || invoiceId,
            amount: invoiceData.amount || 0,
            status: 'draft',
            createdAt: new Date()
        };
        
        this.invoices.set(invoiceId, invoice);
        return invoice;
    }

    async send(invoiceId) {
        const invoice = this.invoices.get(invoiceId);
        if (!invoice) {
            throw new Error(`Invoice ${invoiceId} not found`);
        }

        invoice.status = 'sent';
        invoice.sentAt = new Date();
        return invoice;
    }

    getInvoice(invoiceId) {
        return this.invoices.get(invoiceId);
    }

    getAllInvoices() {
        return Array.from(this.invoices.values());
    }
}

module.exports = InvoiceManagement;

