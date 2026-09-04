/* Deterministic coordinates and bounded residency for the local Pioneer universe. */
(function (root) {
    'use strict';

    const VERSION = 1;
    const MIN_SECTOR = -2048;
    const MAX_SECTOR = 2047;
    const SYSTEMS_PER_SECTOR = 16;
    const SECTOR_SIZE = 100;
    const DEFAULT_SEED = 0x49544131;
    const WORLD_TYPES = ['planet', 'desert', 'ice', 'lava', 'ocean'];
    const NAMES = ['Aster', 'Vela', 'Cygnus', 'Orison', 'Nacre', 'Helion', 'Caelum', 'Meridian', 'Lyra', 'Ardent', 'Caldera', 'Sable', 'Vesper', 'Eidolon', 'Aquila', 'Halcyon'];
    const clone = (value) => JSON.parse(JSON.stringify(value));
    const hash = (text, seed = DEFAULT_SEED) => {
        let value = seed >>> 0;
        for (let i = 0; i < text.length; i += 1) {
            value = Math.imul(value ^ text.charCodeAt(i), 16777619);
        }
        value = Math.imul(value ^ (value >>> 16), 0x21f0aaad);
        value = Math.imul(value ^ (value >>> 15), 0x735a2d97);
        return (value ^ (value >>> 15)) >>> 0;
    };
    const distance = (a, b) => Math.hypot(a.position.x - b.position.x, a.position.y - b.position.y, a.position.z - b.position.z);

    class PioneerUniverseCatalog {
        constructor(options = {}) {
            this.seed = Number.isSafeInteger(options.seed) ? options.seed >>> 0 : DEFAULT_SEED;
            this.maxResidentSectors = Math.max(9, Math.min(81, Math.floor(options.maxResidentSectors || 25)));
            this.sectors = new Map();
            this.journal = new Map();
            this.route = null;
        }

        static get capacity() { return (MAX_SECTOR - MIN_SECTOR + 1) ** 2 * SYSTEMS_PER_SECTOR; }
        static get bounds() { return { min: MIN_SECTOR, max: MAX_SECTOR, systemsPerSector: SYSTEMS_PER_SECTOR }; }
        static get version() { return VERSION; }

        static isLegacyAddress(value) {
            const match = String(value || '').match(/^star_(-?\d+),(-?\d+)_(\d+)$/);
            return !!match && Math.abs(Number(match[1])) <= 1000000 && Math.abs(Number(match[2])) <= 1000000 && Number(match[3]) < 256;
        }

        static parseAddress(value) {
            const text = String(value || '').trim();
            const match = text.match(/^(?:star_)?(-?\d+)\s*[,/:]\s*(-?\d+)(?:\s*[_/:,]\s*(\d+))?$/i);
            if (!match) return null;
            const x = Number(match[1]);
            const y = Number(match[2]);
            const index = Number(match[3] || 0);
            // Legacy home sectors contained up to 30 stars; their addresses remain valid.
            const limit = x === 0 && y === 0 ? 30 : SYSTEMS_PER_SECTOR;
            if (![x, y, index].every(Number.isSafeInteger) || x < MIN_SECTOR || x > MAX_SECTOR || y < MIN_SECTOR || y > MAX_SECTOR || index < 0 || index >= limit) return null;
            return { x, y, index, id: `star_${x},${y}_${index}`, sector: `${x},${y}` };
        }

        describeStar(id) {
            if (this.journal.has(id)) return clone(this.journal.get(id));
            const address = PioneerUniverseCatalog.parseAddress(id);
            if (!address) return null;
            if (this.journal.has(address.id)) return clone(this.journal.get(address.id));
            return this.generateStar(address);
        }

        generateStar(address) {
            const seed = hash(address.id, this.seed);
            const random = (salt) => hash(`${address.id}:${salt}`, this.seed) / 4294967296;
            const roll = random('type');
            const type = roll < 0.018 ? 'Black Hole' : roll < 0.04 ? 'Neutron Star' : roll < 0.075 ? 'Blue Giant' : roll < 0.55 ? 'M-Dwarf' : roll < 0.8 ? 'K-Type' : 'G-Type';
            const hazards = type === 'Black Hole' ? ['Extreme Gravity', 'Spacetime Distortion'] : type === 'Neutron Star' ? ['Magnetic Shearing', 'Radiation'] : [];
            const worldType = WORLD_TYPES[Math.floor(random('world') * WORLD_TYPES.length)];
            const hue = type === 'M-Dwarf' ? 0xff9f73 : type === 'Blue Giant' ? 0x94c6ff : type === 'K-Type' ? 0xffc58a : 0xffe9cb;
            const planetCount = 2 + Math.floor(random('planets') * 10);
            return {
                id: address.id,
                name: `${NAMES[seed % NAMES.length]} ${address.x + 2048}-${address.y + 2048} ${String.fromCharCode(65 + address.index)}`,
                seed,
                position: {
                    x: address.x * SECTOR_SIZE + (random('x') - 0.5) * 76,
                    y: address.y * SECTOR_SIZE + (random('y') - 0.5) * 76,
                    z: (random('z') - 0.5) * 60
                },
                sector: { x: address.x, y: address.y },
                type,
                worldType,
                planetCount,
                navigationBeacon: address.index === 0,
                discovered: address.index === 0,
                scanned: false,
                hazards,
                discoveryStatus: random('binary') < 0.23 ? 'Binary' : 'Single',
                isNebula: random('nebula') < 0.19,
                hasXenoArchSite: random('ruins') < 0.065,
                hasGraveyard: random('wreck') < 0.04,
                starConfig: random('binary') < 0.23
                    ? { type: 'binary', stars: [{ color: hue, size: 1 }, { color: 0xffb783, size: 0.65 }] }
                    : { type: 'single', stars: [{ color: hue, size: 1 }] },
                universeVersion: VERSION,
                sectorSeed: hash(address.sector, this.seed)
            };
        }

        remember(star, force = false) {
            const address = PioneerUniverseCatalog.parseAddress(star?.id);
            if (!address) {
                // Older saves allowed coordinates beyond this generation's finite catalog. Retain them verbatim.
                if ((force || this.journal.has(star?.id)) && PioneerUniverseCatalog.isLegacyAddress(star?.id)) this.journal.set(star.id, clone(star));
                return;
            }
            // Persist only changed worlds. Browsing millions of coordinates never serializes a whole galaxy.
            if (force || JSON.stringify(star) !== JSON.stringify(this.generateStar(address))) {
                this.journal.set(address.id, clone(star));
            } else {
                this.journal.delete(address.id);
            }
        }

        loadSector(x, y) {
            const address = PioneerUniverseCatalog.parseAddress(`${x},${y},0`);
            if (!address) return [];
            if (this.sectors.has(address.sector)) {
                const stars = this.sectors.get(address.sector);
                this.sectors.delete(address.sector);
                this.sectors.set(address.sector, stars);
                return stars;
            }
            const stars = Array.from({ length: SYSTEMS_PER_SECTOR }, (_, index) => this.describeStar(`star_${x},${y}_${index}`));
            // Preserve any extra objects from legacy sectors without renumbering them.
            if (x === 0 && y === 0) {
                for (let index = 16; index < 30; index += 1) {
                    const saved = this.journal.get(`star_0,0_${index}`);
                    if (saved) stars.push(clone(saved));
                }
            }
            this.sectors.set(address.sector, stars);
            while (this.sectors.size > this.maxResidentSectors) {
                const oldest = this.sectors.keys().next().value;
                this.sectors.get(oldest).forEach((star) => this.remember(star));
                this.sectors.delete(oldest);
            }
            return stars;
        }

        resolve(id) {
            const address = PioneerUniverseCatalog.parseAddress(id);
            if (!address) return this.journal.has(id) ? clone(this.journal.get(id)) : null;
            return this.loadSector(address.x, address.y).find((star) => star.id === address.id) || null;
        }

        residentStars() { return Array.from(this.sectors.values()).flat(); }

        nextWaypoint(origin, destination, range = 450) {
            if (!origin || !destination || !Number.isFinite(range) || range < 180) return null;
            if (origin.id === destination.id) return destination;
            const total = distance(origin, destination);
            if (total <= range) return destination;
            const dx = (destination.position.x - origin.position.x) / total;
            const dy = (destination.position.y - origin.position.y) / total;
            for (let fraction = 0.74; fraction >= 0.25; fraction -= 0.08) {
                const x = Math.max(MIN_SECTOR, Math.min(MAX_SECTOR, Math.round((origin.position.x + dx * range * fraction) / SECTOR_SIZE)));
                const y = Math.max(MIN_SECTOR, Math.min(MAX_SECTOR, Math.round((origin.position.y + dy * range * fraction) / SECTOR_SIZE)));
                const candidate = this.describeStar(`star_${x},${y}_0`);
                if (candidate && candidate.id !== origin.id && distance(origin, candidate) <= range && distance(candidate, destination) < total) return candidate;
            }
            return null;
        }

        planRoute(origin, destination, range = 450) {
            if (!origin || !destination) return null;
            let cursor = origin;
            let hops = 0;
            let length = 0;
            let energy = 0;
            let credits = 0;
            // Count using descriptors only: route planning does not load a sector or simulate its entities.
            while (cursor.id !== destination.id && hops < 8192) {
                const next = this.nextWaypoint(cursor, destination, range);
                if (!next) return null;
                const leg = distance(cursor, next);
                length += leg;
                energy += Math.max(50, Math.ceil(45 + leg * 0.34));
                credits += Math.max(25, Math.ceil(25 + leg * 0.18));
                cursor = next;
                hops += 1;
            }
            if (cursor.id !== destination.id) return null;
            return { destinationId: destination.id, destinationName: destination.name, hops, distance: length, estimatedEnergy: energy, estimatedCredits: credits };
        }

        search(query, limit = 20) {
            const exact = PioneerUniverseCatalog.parseAddress(query);
            if (exact) return [this.describeStar(exact.id)].filter(Boolean);
            const term = String(query || '').trim().toLowerCase();
            const namedAddress = term.match(/^[a-z]+\s+(\d+)-(\d+)\s+([a-p])$/);
            if (namedAddress) {
                const address = PioneerUniverseCatalog.parseAddress(`${Number(namedAddress[1]) - 2048},${Number(namedAddress[2]) - 2048},${namedAddress[3].charCodeAt(0) - 97}`);
                const star = address && this.describeStar(address.id);
                if (star?.name.toLowerCase() === term) return [star];
            }
            const known = new Map([...this.journal, ...this.residentStars().map((star) => [star.id, star])]);
            return Array.from(known.values()).filter((star) => !term || star.name.toLowerCase().includes(term) || star.id.toLowerCase().includes(term)).slice(0, Math.max(1, Math.min(50, limit)));
        }

        serialize() {
            this.residentStars().forEach((star) => this.remember(star));
            return { version: VERSION, seed: this.seed, journal: Array.from(this.journal.values()), route: this.route ? clone(this.route) : null };
        }

        restore(raw) {
            if (!raw || raw.version !== VERSION || !Array.isArray(raw.journal)) return false;
            this.seed = Number.isSafeInteger(raw.seed) ? raw.seed >>> 0 : DEFAULT_SEED;
            this.sectors.clear();
            this.journal.clear();
            raw.journal.forEach((star) => {
                if (PioneerUniverseCatalog.isLegacyAddress(star?.id) && star.position && [star.position.x, star.position.y, star.position.z].every(Number.isFinite)) this.remember(star, true);
            });
            this.route = raw.route && PioneerUniverseCatalog.parseAddress(raw.route.destinationId)
                ? { destinationId: raw.route.destinationId, completedHops: Math.max(0, Math.floor(Number(raw.route.completedHops) || 0)) }
                : null;
            return true;
        }
    }

    root.PioneerUniverseCatalog = PioneerUniverseCatalog;
})(typeof window !== 'undefined' ? window : globalThis);
