class BlockValidation {
  constructor() {}
  async init() {}
  async hash(data) {
    const te = new TextEncoder();
    const d = await crypto.subtle.digest('SHA-256', te.encode(JSON.stringify(data)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async validate(block, previousBlock, txHashes) {
    if (!block || !previousBlock) return false;
    if (block.prevHash !== previousBlock.hash) return false;
    const mt = new (window.MerkleTree || function(){})();
    const tree = await mt.build(txHashes || []);
    const root = mt.root(tree);
    if (block.merkleRoot !== root) return false;
    const h = await this.hash({ prevHash: block.prevHash, merkleRoot: block.merkleRoot, nonce: block.nonce });
    return h === block.hash;
  }
}
window.BlockValidation = BlockValidation;
