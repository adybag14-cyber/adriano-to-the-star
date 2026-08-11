class ChainReorganization {
  constructor() {
    this.chain = [];
  }
  async init() {}
  addBlock(block) {
    const b = { hash:String(block.hash), prevHash:String(block.prevHash||''), height:Number(block.height||this.chain.length), time:Number(block.time||Date.now()) };
    const tip = this.chain[this.chain.length-1];
    if (tip && b.prevHash !== tip.hash) return false;
    this.chain.push(b);
    return true;
  }
  reorg(newBlocks) {
    const altTip = newBlocks[newBlocks.length-1];
    const curTip = this.chain[this.chain.length-1];
    if (!altTip || !curTip) return false;
    if (altTip.height <= curTip.height) return false;
    this.chain = newBlocks.map(b => ({ hash:String(b.hash), prevHash:String(b.prevHash||''), height:Number(b.height), time:Number(b.time||Date.now()) }));
    return true;
  }
}
window.ChainReorganization = ChainReorganization;
