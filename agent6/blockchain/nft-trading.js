class NftTrading {
  constructor() { this.trades = []; this.offers = []; }
  createOffer(tokenId, seller, price) {
    const offer = {
      offerId: this.offers.length,
      tokenId,
      seller,
      price,
      status: 'active',
      createdAt: Date.now()
    };
    this.offers.push(offer);
    return offer;
  }
  acceptOffer(offerId, buyer) {
    const offer = this.offers.find(o => o.offerId === offerId && o.status === 'active');
    if (!offer) return false;
    offer.status = 'accepted';
    offer.buyer = buyer;
    offer.acceptedAt = Date.now();
    const trade = {
      tradeId: this.trades.length,
      tokenId: offer.tokenId,
      seller: offer.seller,
      buyer,
      price: offer.price,
      timestamp: Date.now()
    };
    this.trades.push(trade);
    return trade;
  }
  cancelOffer(offerId, seller) {
    const offer = this.offers.find(o => o.offerId === offerId && o.seller === seller);
    if (!offer || offer.status !== 'active') return false;
    offer.status = 'cancelled';
    offer.cancelledAt = Date.now();
    return true;
  }
  getActiveOffers() {
    return this.offers.filter(o => o.status === 'active');
  }
  getTradeHistory(tokenId) {
    return this.trades.filter(t => t.tokenId === tokenId);
  }
  getUserOffers(user) {
    return this.offers.filter(o => o.seller === user);
  }
  getUserTrades(user) {
    return this.trades.filter(t => t.seller === user || t.buyer === user);
  }
}
window.NftTrading = NftTrading;