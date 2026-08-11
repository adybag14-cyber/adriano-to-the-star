class FraudDetectionMl {
  constructor() {}
  async init() {}
  score(tx) {
    const amount=Number(tx?.amount||0), country=String(tx?.country||'');
    let s=0; if(amount>1000) s+=0.5; if(/(?:NG|RU|UA)/.test(country)) s+=0.3; if(tx?.midnight) s+=0.2; return Math.min(1,s);
  }
}
window.FraudDetectionMl = FraudDetectionMl;
