class MarketSystem {
    constructor(game) {
        this.game = game;
        this.basePrices = {
            energy: 2,
            oxygen: 1,
            minerals: 3,
            food: 4,
            alloys: 15,
            circuits: 25,
            helium3: 50
        };
        this.prices = { ...this.basePrices };
        this.volatility = {
            energy: 0.2,
            oxygen: 0.1,
            minerals: 0.3,
            food: 0.2,
            alloys: 0.15,
            circuits: 0.25,
            helium3: 0.4
        };
        this.trends = {}; // 'up', 'down', 'stable'
        this.history = {}; // Store last 7 days?

        this.init();
    }

    init() {
        Object.keys(this.basePrices).forEach(k => {
            this.trends[k] = 'stable';
            this.history[k] = [];
        });
        console.log("Market System Initialized");
    }

    updatePrices() {
        Object.keys(this.basePrices).forEach(res => {
            const base = this.basePrices[res];
            const vol = this.volatility[res];

            // Random fluctuation: +/- volatility
            const change = (Math.random() - 0.5) * 2 * vol;

            // Supply/Demand Simulation (Fake for now, or based on player stock?)
            // If player has tons, price drops slightly? 
            const supplyMod = 0;
            // let playerStock = this.game.resources[res];
            // if (playerStock > 1000) supplyMod = -0.1;

            let newPrice = this.prices[res] * (1 + change + supplyMod);

            // Clamp to 50% - 200% of base
            newPrice = Math.max(base * 0.5, Math.min(base * 3.0, newPrice));

            // Set Trend
            if (newPrice > this.prices[res]) this.trends[res] = 'up';
            else if (newPrice < this.prices[res]) this.trends[res] = 'down';
            else this.trends[res] = 'stable';

            this.prices[res] = parseFloat(newPrice.toFixed(2));

            // History
            this.history[res].push(this.prices[res]);
            if (this.history[res].length > 10) this.history[res].shift();
        });
    }

    buy(resource, amount) {
        if (!this.prices[resource]) return false;
        const total = this.prices[resource] * amount;
        if (this.game.resources.credits >= total) {
            this.game.resources.credits -= total;
            this.game.resources[resource] += amount;
            this.game.notify(`Bought ${amount} ${resource} for ${total.toFixed(0)} Credits`, 'success');
            return true;
        }
        this.game.notify("Insufficient Credits", "danger");
        return false;
    }

    sell(resource, amount) {
        if (!this.prices[resource]) return false;
        if (this.game.resources[resource] >= amount) {
            const total = this.prices[resource] * amount;
            this.game.resources[resource] -= amount;
            this.game.resources.credits += total;
            this.game.notify(`Sold ${amount} ${resource} for ${total.toFixed(0)} Credits`, 'success');
            return true;
        }
        this.game.notify(`Insufficient ${resource}`, "danger");
        return false;
    }
}

window.MarketSystem = MarketSystem;
