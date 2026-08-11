class CryptocurrencyPaymentGateway {
  constructor() { this.invoices = {}; this.transactions = []; this.supportedCoins = ['BTC', 'ETH', 'USDT']; }
  create(invoiceId, amount, address, coin='BTC') {
    if (!this.supportedCoins.includes(coin)) return null;
    const invoice = {
      id: invoiceId,
      amount,
      address,
      coin,
      status: 'pending',
      createdAt: Date.now(),
      paidAmount: 0
    };
    this.invoices[invoiceId] = invoice;
    return invoice;
  }
  markPaid(invoiceId, txHash, amount) {
    const invoice = this.invoices[invoiceId];
    if (!invoice) return false;
    invoice.paidAmount += amount;
    if (invoice.paidAmount >= invoice.amount) {
      invoice.status = 'paid';
      invoice.paidAt = Date.now();
      invoice.txHash = txHash;
    }
    this.transactions.push({
      txHash,
      invoiceId,
      amount,
      coin: invoice.coin,
      timestamp: Date.now()
    });
    return true;
  }
  getInvoice(invoiceId) {
    return this.invoices[invoiceId] || null;
  }
  getInvoicesByAddress(address) {
    return Object.values(this.invoices).filter(inv => inv.address === address);
  }
  getInvoicesByStatus(status) {
    return Object.values(this.invoices).filter(inv => inv.status === status);
  }
  addSupportedCoin(coin) {
    if (!this.supportedCoins.includes(coin)) {
      this.supportedCoins.push(coin);
      return true;
    }
    return false;
  }
  getTotalVolume() {
    return Object.values(this.invoices)
      .filter(inv => inv.status === 'paid')
      .reduce((sum, inv) => sum + inv.amount, 0);
  }
}
window.CryptocurrencyPaymentGateway = CryptocurrencyPaymentGateway;