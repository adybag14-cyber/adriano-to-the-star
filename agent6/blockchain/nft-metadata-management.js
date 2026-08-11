class NftMetadataManagement {
  constructor() { this.metadata = {}; this.schemas = {}; }
  set(tokenId, metadata) {
    this.metadata[tokenId] = { ...metadata, updatedAt: Date.now() };
    return true;
  }
  get(tokenId) {
    return this.metadata[tokenId] || null;
  }
  update(tokenId, updates) {
    if (!this.metadata[tokenId]) return false;
    this.metadata[tokenId] = { ...this.metadata[tokenId], ...updates, updatedAt: Date.now() };
    return true;
  }
  remove(tokenId) {
    delete this.metadata[tokenId];
    return true;
  }
  validate(tokenId, schema) {
    const data = this.metadata[tokenId];
    if (!data) return false;
    for (const key in schema) {
      if (schema[key].required && !data[key]) return false;
      if (data[key] && schema[key].type && typeof data[key] !== schema[key].type) return false;
    }
    return true;
  }
  defineSchema(name, schema) {
    this.schemas[name] = schema;
    return true;
  }
  getSchema(name) {
    return this.schemas[name] || null;
  }
  listByAttribute(attribute, value) {
    return Object.entries(this.metadata)
      .filter(([_, data]) => data[attribute] === value)
      .map(([tokenId, data]) => ({ tokenId, ...data }));
  }
  getHistory(tokenId) {
    return this.metadata[tokenId] ? [{ timestamp: this.metadata[tokenId].updatedAt, data: this.metadata[tokenId] }] : [];
  }
}
window.NftMetadataManagement = NftMetadataManagement;