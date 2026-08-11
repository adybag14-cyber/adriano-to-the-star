/**
 * Surface Radar Jamming
 * Electronic warfare logic for masking landing zones and ground troop movements.
 */
class SurfaceRadarJamming {
    constructor() {
        this.frequencyRange = [400, 1200]; // MHz
        this.activeJammers = new Set();
    }

    deployJammer(coords, power) {
        const jammer = {
            id: `JAM-${Math.random()}`,
            coords,
            power,
            radius: power * 10,
            noiseFloor: power * 0.5
        };
        this.activeJammers.add(jammer);
        return jammer;
    }

    getDetectionProbability(targetCoords, radarPower) {
        let totalNoise = 0;
        this.activeJammers.forEach(j => {
            const dist = Math.sqrt(Math.pow(j.coords.x - targetCoords.x, 2) + Math.pow(j.coords.y - targetCoords.y, 2));
            if (dist < j.radius) {
                totalNoise += (j.power / Math.max(1, dist));
            }
        });

        const signalToNoise = radarPower / (1 + totalNoise);
        return Math.min(1, signalToNoise / 10);
    }
}

if (typeof module !== 'undefined') module.exports = SurfaceRadarJamming;
