class RealTimeAnalyticsDashboard {
    constructor() {
        this.widgets = new Map();
        this.dataSource = null;
    }
    setDataSource(source) {
        this.dataSource = source;
    }
    registerWidget(name, renderFn) {
        if (typeof renderFn !== 'function') return;
        this.widgets.set(name, renderFn);
    }
    renderAll(container) {
        const target = typeof container === 'string' ? document.querySelector(container) : container;
        if (!target) return 0;
        const snapshot = (this.dataSource && this.dataSource.getSnapshot) ? this.dataSource.getSnapshot() : { counters: {}, metrics: {} };
        let count = 0;
        this.widgets.forEach((fn, name) => {
            const node = document.createElement('div');
            node.dataset.widget = name;
            fn(node, snapshot);
            target.appendChild(node);
            count++;
        });
        return count;
    }
}
const realTimeAnalyticsDashboard = new RealTimeAnalyticsDashboard();
if (typeof window !== 'undefined') {
    window.realTimeAnalyticsDashboard = realTimeAnalyticsDashboard;
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RealTimeAnalyticsDashboard;
}
