class AutoScalingPolicies {
  constructor() {}
  async init() {}
  desiredReplicas({ cpu, min, max, scaleUpThreshold, scaleDownThreshold }) {
    const c = Number(cpu||0);
    let r = Number(min||1);
    if (c > Number(scaleUpThreshold||0.7)) r++;
    if (c < Number(scaleDownThreshold||0.3)) r--;
    r = Math.max(Number(min||1), Math.min(Number(max||10), r));
    return r;
  }
}
window.AutoScalingPolicies = AutoScalingPolicies;
