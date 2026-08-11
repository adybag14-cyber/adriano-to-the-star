class DynamicPricing {
  calculate(basePrice, demandFactor, competitionFactor, inventoryFactor) {
    return basePrice * demandFactor * competitionFactor * inventoryFactor;
  }
  
  optimize(currentPrice, demand, inventory, competitionPrices) {
    const avgCompetition = competitionPrices.reduce((a, b) => a + b, 0) / competitionPrices.length;
    const demandFactor = 1 + (demand > 100 ? 0.1 : -0.1);
    const inventoryFactor = 1 + (inventory < 20 ? 0.15 : 0);
    const competitionFactor = avgCompetition > currentPrice ? 1.05 : 0.95;
    
    return this.calculate(currentPrice, demandFactor, competitionFactor, inventoryFactor);
  }
}

window.DynamicPricing = DynamicPricing;