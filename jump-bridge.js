/**
 * Jump Bridge Network
 * Strategic infrastructure for instant inter-system travel.
 */

class JumpBridgeManager {
    constructor(game) {
        this.game = game;
        this.bridges = {}; // { systemId: { targetSysId, active: true } }
        this.fuelType = 'helium3';
        this.consumptionPerJump = 10;
    }

    createBridge(sourceSys, targetSys) {
        if (!sourceSys || !targetSys) return;

        this.bridges[sourceSys] = { targetSysId: targetSys, active: true };
        this.bridges[targetSys] = { targetSysId: sourceSys, active: true };

        this.game.notify(`Jump Bridge Link Established: ${sourceSys} <-> ${targetSys}`, "success");
    }

    canJump(sourceSys) {
        const bridge = this.bridges[sourceSys];
        if (!bridge || !bridge.active) return false;

        const fuel = this.game.resources[this.fuelType] || 0;
        return fuel >= this.consumptionPerJump;
    }

    jump(sourceSys) {
        if (!this.canJump(sourceSys)) {
            this.game.notify("Insufficient Helium-3 fuel for Jump.", "error");
            return false;
        }

        const target = this.bridges[sourceSys].targetSysId;
        this.game.resources[this.fuelType] -= this.consumptionPerJump;
        this.game.currentSystemId = target;
        this.game.notify(`Jump Successful! Arrived in ${target.replace('_', ' ').toUpperCase()}`, "success");
        return true;
    }
}

window.JumpBridgeManager = JumpBridgeManager;
