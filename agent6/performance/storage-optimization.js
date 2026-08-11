class StorageOptimization {
  constructor() {}
  async init() {}
  estimateCompression(text) {
    const s = String(text||'');
    if (s.length === 0) return { original:0, compressed:0, ratio:1 };
    let comp = '';
    let i = 0;
    while (i < s.length) {
      let j = i+1;
      while (j < s.length && s[j] === s[i]) j++;
      comp += s[i] + (j-i);
      i = j;
    }
    const ratio = comp.length / s.length;
    return { original: s.length, compressed: comp.length, ratio };
  }
}
window.StorageOptimization = StorageOptimization;
