class CustomerLifetimeValue {
  constructor() {}
  async init() {}
  clv({ arpu, retentionMonths, margin }) {
    const a=Number(arpu||0), r=Number(retentionMonths||0), m=Number(margin||1);
    return a * r * m;
  }
}
window.CustomerLifetimeValue = CustomerLifetimeValue;
