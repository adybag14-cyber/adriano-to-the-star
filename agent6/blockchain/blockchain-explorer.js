class BlockchainExplorer {
  constructor() {
    this.blocks = [];
    this.txs = [];
  }
  async init() {}
  addBlock(block) {
    if (!block || !block.hash) return false;
    this.blocks.push({
      hash: String(block.hash),
      height: Number(block.height || this.blocks.length),
      time: Number(block.time || Date.now()),
    });
    return true;
  }
  addTransaction(tx) {
    if (!tx || !tx.hash) return false;
    this.txs.push({
      hash: String(tx.hash),
      from: String(tx.from || ""),
      to: String(tx.to || ""),
      value: Number(tx.value || 0),
      time: Number(tx.time || Date.now()),
    });
    return true;
  }
  getBlocks() {
    return this.blocks.slice();
  }
  findBlockByHash(hash) {
    return this.blocks.find(b => b.hash === String(hash)) || null;
  }
  getTransactionsByAddress(addr) {
    const a = String(addr || "");
    return this.txs.filter(t => t.from === a || t.to === a);
  }
}
window.BlockchainExplorer = BlockchainExplorer;
