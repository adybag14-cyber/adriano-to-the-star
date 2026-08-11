class MultiCurrencySupport {
    constructor() {
        this.rates = new Map();
    }
    setRate(from, to, rate) {
        const key = `${from}_${to}`;
        this.rates.set(key, Number(rate || 1));
        return this.rates.get(key);
    }
    convert(amount, from, to) {
        if (from === to) return Number(amount || 0);
        const key = `${from}_${to}`;
        const r = this.rates.get(key);
        if (!r) return null;
        return Math.round(Number(amount || 0) * r * 100) / 100;
    }
}
const multiCurrencySupport = new MultiCurrencySupport();
if (typeof window !== 'undefined') {
    window.multiCurrencySupport = multiCurrencySupport;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiCurrencySupport;
}
