const Tax = require('../tax-calculation');
const Subs = require('../subscription-management');
const Discounts = require('../discount-codes-coupons');

try {
    console.log('Loading modules...');
    const tax = new Tax();
    const subs = new Subs();
    const discounts = new Discounts();
    console.log('Modules loaded.');

    console.log('Testing Tax...');
    tax.setTaxRate('US-CA', 8.25);
    const taxRes = tax.calculateSimple(100, 'US-CA');
    if (!taxRes.tax) throw new Error('Tax calculation failed');

    console.log('Testing Subs...');
    subs.addPlan('test-plan', { price: 10, currency: 'USD' });
    const subId = subs.createSubscription('user1', 'test-plan');
    if (!subs.getSubscription(subId)) throw new Error('Subscription retrieval failed');

    console.log('Testing Discounts...');
    discounts.createDiscountCode('TEST10', { type: 'percent', value: 10 });
    const discountRes = discounts.applyDiscountCode('TEST10', 100);
    if (discountRes.discountAmount !== 10) throw new Error('Discount application failed');

    console.log('✅ All backend utils verification passed');
} catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
}
