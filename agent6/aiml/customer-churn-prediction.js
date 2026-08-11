class CustomerChurnPrediction {
  constructor() {}
  async init() {}
  probability(features) {
    const f = features || {}; // logistic-ish
    const z = 0.5*Number(f.tickets||0) + 0.3*Number(f.downtime||0) - 0.4*Number(f.engagement||0);
    return 1/(1+Math.exp(-z));
  }
}
window.CustomerChurnPrediction = CustomerChurnPrediction;
