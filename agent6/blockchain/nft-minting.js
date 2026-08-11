class NftMinting {
  constructor() { this.nfts = {}; this.tokenId = 0; }
  mint(creator, metadata) {
    const tokenId = ++this.tokenId;
    const nft = {
      tokenId,
      creator,
      owner: creator,
      metadata,
      timestamp: Date.now(),
      uri: this.generateTokenUri(tokenId, metadata)
    };
    this.nfts[tokenId] = nft;
    return nft;
  }
  burn(tokenId, owner) {
    const nft = this.nfts[tokenId];
    if (!nft || nft.owner !== owner) return false;
    delete this.nfts[tokenId];
    return true;
  }
  transfer(tokenId, from, to) {
    const nft = this.nfts[tokenId];
    if (!nft || nft.owner !== from) return false;
    nft.owner = to;
    nft.transferHistory = nft.transferHistory || [];
    nft.transferHistory.push({ from, to, timestamp: Date.now() });
    return true;
  }
  getOwner(tokenId) {
    const nft = this.nfts[tokenId];
    return nft ? nft.owner : null;
  }
  getMetadata(tokenId) {
    const nft = this.nfts[tokenId];
    return nft ? nft.metadata : null;
  }
  generateTokenUri(tokenId, metadata) {
    return `https://api.nft.com/token/${tokenId}`;
  }
  listByOwner(owner) {
    return Object.values(this.nfts).filter(nft => nft.owner === owner);
  }
  getTotalSupply() {
    return Object.keys(this.nfts).length;
  }
}
window.NftMinting = NftMinting;