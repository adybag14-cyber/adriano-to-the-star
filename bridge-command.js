/**
 * Bridge Command Interface (UPGRADED)
 * Master coordination logic for captain orders and officer execution lag.
 */
class BridgeCommand {
    constructor(crewQuality = 0.8) {
        this.crewEfficiency = crewQuality;
        this.activeOrders = [];
    }

    /**
     * Issues a fleet or ship order with execution delay.
     */
    issueOrder(type, priority) {
        const delay = (1 - this.crewEfficiency) * 10000 / priority;
        const order = { type, priority, status: 'TRANSMITTING', eta: delay };
        
        this.activeOrders.push(order);
        
        return new Promise(resolve => {
            setTimeout(() => {
                order.status = 'EXECUTED';
                resolve(order);
            }, delay);
        });
    }

    getBridgeStress() {
        return this.activeOrders.length * (1 / this.crewEfficiency);
    }
}
if (typeof module !== 'undefined') module.exports = BridgeCommand;