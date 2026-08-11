/**
 * Shipping Calculator v2
 * Advanced shipping calculator
 */

class ShippingCalculatorV2 {
    constructor() {
        this.methods = new Map();
        this.calculations = [];
        this.initialized = false;
    }

    async initialize() {
        this.initialized = true;
        return { success: true, message: 'Shipping Calculator v2 initialized' };
    }

    addMethod(name, baseCost, costPerKg, costPerKm) {
        if (baseCost < 0 || costPerKg < 0 || costPerKm < 0) {
            throw new Error('Costs must be non-negative');
        }
        const method = {
            id: Date.now().toString(),
            name,
            baseCost,
            costPerKg,
            costPerKm,
            addedAt: new Date()
        };
        this.methods.set(method.id, method);
        return method;
    }

    calculate(methodId, weight, distance) {
        if (weight < 0 || distance < 0) {
            throw new Error('Weight and distance must be non-negative');
        }
        const method = this.methods.get(methodId);
        if (!method) {
            throw new Error('Shipping method not found');
        }
        const cost = method.baseCost + (method.costPerKg * weight) + (method.costPerKm * distance);
        const calculation = {
            methodId,
            weight,
            distance,
            cost,
            calculatedAt: new Date()
        };
        this.calculations.push(calculation);
        return calculation;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = ShippingCalculatorV2;
}

