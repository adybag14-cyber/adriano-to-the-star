class InventoryOptimization {
  constructor() {}
  async init() {}
  eoq({ demand, setupCost, holdingCost }) {
    const D=Number(demand||0), S=Number(setupCost||1), H=Number(holdingCost||1);
    return Math.sqrt((2*D*S)/H);
  }
}
window.InventoryOptimization = InventoryOptimization;
