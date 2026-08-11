/**
 * Alien Generator
 * Procedurally generates alien ships and fleets for combat encounters.
 */

class AlienGenerator {
    constructor(game) {
        this.game = game;
        this.prefixes = ['Zyl', 'Xax', 'Vorg', 'Kril', 'Thul', 'Qar'];
        this.suffixes = ['ian', 'oid', 'ax', 'on', 'u', 'i'];
        this.shipTypes = ['Scout', 'Raider', 'Frigate', 'Destroyer', 'Mothership'];
    }

    generateName() {
        const p = this.prefixes[Math.floor(Math.random() * this.prefixes.length)];
        const s = this.suffixes[Math.floor(Math.random() * this.suffixes.length)];
        return `${p}${s}`;
    }

    generateEncounter(difficulty) {
        const fleet = [];
        const raceName = this.generateName();
        // Difficulty 1 = 1-2 weak ships
        // Difficulty 5 = Full fleet

        const count = Math.max(1, Math.floor(Math.random() * difficulty) + 1);

        for (let i = 0; i < count; i++) {
            fleet.push(this.generateShip(raceName, difficulty));
        }

        return {
            name: `${raceName} Fleet`,
            ships: fleet,
            reward: {
                alloys: difficulty * 50,
                credits: difficulty * 100
            }
        };
    }

    generateShip(raceName, difficulty) {
        // Simple scaling
        const typeIdx = Math.min(this.shipTypes.length - 1, Math.floor(Math.random() * difficulty));
        const type = this.shipTypes[typeIdx];

        const hp = 50 + (typeIdx * 100);
        const dmg = 5 + (typeIdx * 10);
        const speed = 20 - (typeIdx * 2);

        return {
            id: 'alien_' + Date.now() + '_' + Math.random(),
            name: `${raceName} ${type}`,
            isEnemy: true,
            stats: {
                hp: hp,
                maxHp: hp
            },
            design: {
                stats: {
                    damage: dmg,
                    speed: speed,
                    range: 50
                }
            }
        };
    }
}

window.AlienGenerator = AlienGenerator;
