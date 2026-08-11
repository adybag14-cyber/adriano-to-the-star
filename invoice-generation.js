class InvoiceGeneration {
    constructor() {
        this.invoices = new Map();
    }
    generate(order) {
        const id = 'inv_' + Date.now().toString(36) + Math.random().toString(36).slice(2);
        const inv = {
            id,
            orderId: order?.id || null,
            issuedAt: new Date(),
            totals: order?.totals || {},
            lines: (order?.cart?.items || []).map(i => ({ itemId: i.itemId, qty: i.qty, unitPrice: i.price, lineTotal: i.price * i.qty }))
        };
        this.invoices.set(id, inv);
        return inv;
    }
    get(id) {
        return this.invoices.get(id) || null;
    }
}
const invoiceGeneration = new InvoiceGeneration();
if (typeof window !== 'undefined') {
    window.invoiceGeneration = invoiceGeneration;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = InvoiceGeneration;
}
