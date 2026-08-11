class CapacityPlanning {
  constructor() {}
  async init() {}
  requiredCapacity({ projectedDemand, targetUtilization }) {
    const d = Number(projectedDemand||0);
    const u = Math.max(0.1, Math.min(0.99, Number(targetUtilization||0.7)));
    return Math.ceil(d / u);
  }
}
window.CapacityPlanning = CapacityPlanning;
