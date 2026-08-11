class EconomicOrderQuantity {
  calculate(demand, orderingCost, holdingCost) {
    return Math.sqrt((2 * demand * orderingCost) / holdingCost);
  }
  
  totalCost(demand, orderQuantity, orderingCost, holdingCost, unitCost) {
    const orderingCostTotal = (demand / orderQuantity) * orderingCost;
    const holdingCostTotal = (orderQuantity / 2) * holdingCost;
    const purchaseCost = demand * unitCost;
    return orderingCostTotal + holdingCostTotal + purchaseCost;
  }
  
  reorderPoint(demand, leadTime) {
    return demand * leadTime;
  }
}

window.EconomicOrderQuantity = EconomicOrderQuantity;