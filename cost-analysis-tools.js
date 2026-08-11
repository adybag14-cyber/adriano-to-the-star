/**
 * Cost Analysis Tools
 * Tools for analyzing costs and financial metrics
 */

class CostAnalysisTools {
    constructor() {
        this.costs = new Map();
        this.categories = new Map();
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('cost_analysis_tools_initialized');
    }

    addCost(costId, category, amount, description, date) {
        this.costs.set(costId, {
            id: costId,
            category,
            amount,
            description,
            date: date || new Date(),
            createdAt: new Date()
        });
        
        // Update category totals
        const categoryData = this.categories.get(category) || { total: 0, count: 0 };
        categoryData.total += amount;
        categoryData.count++;
        this.categories.set(category, categoryData);
        
        console.log(`Cost added: ${costId}`);
    }

    createCategory(categoryId, name, budget = null) {
        this.categories.set(categoryId, {
            id: categoryId,
            name,
            budget,
            total: 0,
            count: 0
        });
        console.log(`Category created: ${categoryId}`);
    }

    analyzeCosts(period, category = null) {
        const costs = Array.from(this.costs.values());
        const filtered = costs.filter(c => {
            const costDate = new Date(c.date);
            const periodStart = new Date(period.start);
            const periodEnd = new Date(period.end);
            const inPeriod = costDate >= periodStart && costDate <= periodEnd;
            const inCategory = !category || c.category === category;
            return inPeriod && inCategory;
        });
        
        const total = filtered.reduce((sum, c) => sum + c.amount, 0);
        const avg = filtered.length > 0 ? total / filtered.length : 0;
        
        const byCategory = {};
        filtered.forEach(cost => {
            byCategory[cost.category] = (byCategory[cost.category] || 0) + cost.amount;
        });
        
        return {
            period,
            total,
            average: avg,
            count: filtered.length,
            byCategory
        };
    }

    comparePeriods(period1, period2) {
        const analysis1 = this.analyzeCosts(period1);
        const analysis2 = this.analyzeCosts(period2);
        
        const change = analysis2.total - analysis1.total;
        const changePercent = analysis1.total > 0 
            ? (change / analysis1.total) * 100 
            : 0;
        
        return {
            period1: analysis1,
            period2: analysis2,
            change,
            changePercent
        };
    }

    getBudgetStatus(categoryId) {
        const category = this.categories.get(categoryId);
        if (!category || !category.budget) {
            return null;
        }
        
        const spent = category.total;
        const budget = category.budget;
        const remaining = budget - spent;
        const percentage = (spent / budget) * 100;
        
        return {
            category: category.name,
            budget,
            spent,
            remaining,
            percentage,
            status: percentage > 100 ? 'over' : percentage > 80 ? 'warning' : 'ok'
        };
    }

    getCost(costId) {
        return this.costs.get(costId);
    }

    getAllCosts() {
        return Array.from(this.costs.values());
    }

    getAllCategories() {
        return Array.from(this.categories.values());
    }

    trackEvent(eventName, data = {}) {
        try {
            if (window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric(`cost_analysis_tools_${eventName}`, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }
}

if (typeof window !== 'undefined') {
    window.costAnalysisTools = new CostAnalysisTools();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CostAnalysisTools;
}

