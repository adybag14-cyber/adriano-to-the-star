/**
 * Fuel Tanker Coordination (UPGRADED)
 * Deep-void logistical sync for extending fleet engagement range.
 */
class FuelTankerCoord {
    constructor() {
        this.activeTransfers = new Map();
    }

    /**
     * Links a tanker to a ship for He-3 transfer.
     */
    initiateTransfer(tankerId, shipId, amount) {
        const transfer = {
            tankerId,
            shipId,
            amountRemaining: amount,
            rate: 100 // L/s
        };

        this.activeTransfers.set(`${tankerId}-${shipId}`, transfer);
        return 'TRANSFER_BEGUN';
    }

    /**
     * Resolves the transfer based on fleet stability and proximity.
     */
    tick(deltaTime, turbulence) {
        this.activeTransfers.forEach((tx, key) => {
            const actualRate = tx.rate * (1 - turbulence);
            tx.amountRemaining -= actualRate * deltaTime;
            
            if (tx.amountRemaining <= 0) {
                this.activeTransfers.delete(key);
            }
        });
    }
}

if (typeof module !== 'undefined') module.exports = FuelTankerCoord;