class MerkleTree {
  constructor() {}
  async init() {}
  async hash(data) {
    const te = new TextEncoder();
    const d = await crypto.subtle.digest('SHA-256', te.encode(String(data)));
    return Array.from(new Uint8Array(d)).map(b=>b.toString(16).padStart(2,'0')).join('');
  }
  async build(leaves) {
    let level = [];
    for (let i = 0; i < leaves.length; i++) level.push(await this.hash(leaves[i]));
    if (level.length === 0) return [];
    const tree = [level.slice()];
    while (level.length > 1) {
      const next = [];
      for (let i = 0; i < level.length; i += 2) {
        if (i + 1 < level.length) {
          next.push(await this.hash(level[i] + level[i + 1]));
        } else {
          next.push(level[i]);
        }
      }
      level = next;
      tree.push(level.slice());
    }
    return tree;
  }
  root(tree) {
    if (!Array.isArray(tree) || tree.length === 0) return null;
    const top = tree[tree.length - 1];
    return top && top[0] ? top[0] : null;
  }
}
window.MerkleTree = MerkleTree;
