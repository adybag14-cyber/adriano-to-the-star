class GraphQLApiLayer {
    constructor({ cart, orders, shipping, tax, fx } = {}) {
        this.ctx = { cart, orders, shipping, tax, fx };
    }
    execute(queryObj) {
        const q = queryObj || {};
        if (q.cart && this.ctx.cart) {
            const id = q.cart.id;
            return { cart: this.ctx.cart.snapshot(id), totals: this.ctx.cart.total(id) };
        }
        if (q.order && this.ctx.orders) {
            const id = q.order.id;
            return { order: this.ctx.orders.get(id) };
        }
        if (q.shipping && this.ctx.shipping) {
            const p = q.shipping;
            return { rates: this.ctx.shipping.rates(p) };
        }
        if (q.tax && this.ctx.tax) {
            const p = q.tax;
            return this.ctx.tax.calculateSimple(p.amount, p.region);
        }
        if (q.fx && this.ctx.fx) {
            const p = q.fx;
            return { amount: this.ctx.fx.convert(p.amount, p.from, p.to) };
        }
        return { error: 'unsupported_operation' };
    }
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GraphQLApiLayer;
}
