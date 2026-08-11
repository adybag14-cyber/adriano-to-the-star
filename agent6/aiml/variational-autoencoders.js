class VariationalAutoencoders {
  constructor() { this.encoder = null; this.decoder = null; this.latentDim = 20; }
  buildEncoder(inputDim) {
    this.encoder = {
      inputDim,
      encode: (input) => ({
        mean: Array(this.latentDim).fill(0).map(() => Math.random()),
        logVar: Array(this.latentDim).fill(0).map(() => Math.random() - 2)
      })
    };
    return this.encoder;
  }
  buildDecoder(outputDim) {
    this.decoder = {
      outputDim,
      decode: (z) => Array(outputDim).fill(0).map(() => Math.random())
    };
    return this.decoder;
  }
  reparameterize(mean, logVar) {
    const std = logVar.map(v => Math.exp(v * 0.5));
    const eps = Array(this.latentDim).fill(0).map(() => Math.random());
    return mean.map((m, i) => m + std[i] * eps[i]);
  }
  encode(input) {
    const params = this.encoder.encode(input);
    const z = this.reparameterize(params.mean, params.logVar);
    return { z, mean: params.mean, logVar: params.logVar };
  }
  decode(z) {
    return this.decoder.decode(z);
  }
  forward(input) {
    const encoded = this.encode(input);
    const reconstructed = this.decode(encoded.z);
    return { reconstructed, z: encoded.z, mean: encoded.mean, logVar: encoded.logVar };
  }
  loss(input, reconstructed, mean, logVar) {
    const reconLoss = input.reduce((sum, x, i) => sum + Math.pow(x - reconstructed[i], 2), 0);
    const klLoss = mean.reduce((sum, m, i) => {
      const varTerm = Math.exp(logVar[i]);
      return sum + 0.5 * (varTerm + m * m - 1 - logVar[i]);
    }, 0);
    return reconLoss + klLoss;
  }
  generate(samples=1) {
    const results = [];
    for (let i = 0; i < samples; i++) {
      const z = Array(this.latentDim).fill(0).map(() => Math.random());
      results.push(this.decode(z));
    }
    return results;
  }
}
window.VariationalAutoencoders = VariationalAutoencoders;