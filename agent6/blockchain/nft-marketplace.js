class NftMarketplace {
  constructor() { this.listings = []; this.fees = { listing: 0.01, sale: 0.025 }; }
  list(tokenId, seller, price) {
    const listing = {
      listingId: this.listings.length,
      tokenId,
      seller,
      price,
      status: 'active',
      createdAt: Date.now()
    };
    this.listings.push(listing);
    return listing;
  }
  buy(listingId, buyer) {
    const listing = this.listings.find(l => l.listingId === listingId && l.status === 'active');
    if (!listing) return false;
    listing.status = 'sold';
    listing.buyer = buyer;
    listing.soldAt = Date.now();
    const fee = listing.price * this.fees.sale;
    listing.finalPrice = listing.price - fee;
    return { success: true, fee, finalPrice: listing.finalPrice };
  }
  cancel(listingId, seller) {
    const listing = this.listings.find(l => l.listingId === listingId && l.seller === seller && l.status === 'active');
    if (!listing) return false;
    listing.status = 'cancelled';
    listing.cancelledAt = Date.now();
    return true;
  }
  getActiveListings() {
    return this.listings.filter(l => l.status === 'active');
  }
  getSoldListings() {
    return this.listings.filter(l => l.status === 'sold');
  }
  getUserListings(user) {
    return this.listings.filter(l => l.seller === user);
  }
  getUserPurchases(user) {
    return this.listings.filter(l => l.buyer === user && l.status === 'sold');
  }
  getListings() {
    return this.listings;
  }
  setFee(type, rate) {
    if (this.fees.hasOwnProperty(type)) {
      this.fees[type] = rate;
      return true;
    }
    return false;
  }
  getVolume() {
    return this.listings
      .filter(l => l.status === 'sold')
      .reduce((sum, l) => sum + l.price, 0);
  }
}
window.NftMarketplace = NftMarketplace;