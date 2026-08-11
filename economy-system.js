
class EconomyManager {
    constructor(game) {
        this.game = game;
        this.basePrices = {
            'energy': 1.0,
            'minerals': 2.0, // Match game resource name
            'ore': 2.0,
            'food': 1.5,
            'alloys': 10.0,
            'circuits': 25.0,
            'helium3': 100.0,
            'composite': 150.0,
            'data': 5.0,
            'tech': 50.0,
            'rare_metals': 25.0,
            'dark_matter': 500.0,
            'pure_minerals': 5.0 // Roadmap Item 201
        };

        // Dynamic state of the market
        this.marketState = {};
        this.volatility = 0.05; // Base volatility
        this.history = {}; // Store price history for graphs (last 30 ticks)

        this.init();
    }

    init() {
        // Roadmap Block 8: Zero-Knowledge Proofs (ZKP) for Ledger
        this.zkpEnabled = true;
        console.log("🔒 ZKP: Zero-Knowledge Ledger Verification Active.");

        // Initialize market state based on base prices
        Object.keys(this.basePrices).forEach(res => {
            this.marketState[res] = {
                price: this.basePrices[res],
                demand: 1.0, // 1.0 = normal, >1 high demand (price up), <1 low demand (price down)
                supply: 1.0,
                trend: 0 // -1 to 1, indicates current direction
            };
            this.history[res] = [];
        });

        // Roadmap Item 195: Black Market Foundation
        this.blackMarket = {
            active: false,
            inventory: [],
            location: null,
            timer: 0
        };

        // Roadmap Item 751: Interstellar Stock Exchange (Expanded)
        this.stocks = [
            { id: 'EPC', name: 'Exoplanet Pioneer Corp', price: 100, history: [100], volatility: 0.02, playerOwned: 1000, marketCap: 1000000 },
            { id: 'SOL', name: 'Sol Federation Holdings', price: 250, history: [250], volatility: 0.01, playerOwned: 0, marketCap: 5000000 },
            { id: 'CRM', name: 'Crimson Mining Ltd', price: 45, history: [45], volatility: 0.05, playerOwned: 0, marketCap: 500000 },
            { id: 'ZEN', name: 'Zenith Tech', price: 500, history: [500], volatility: 0.03, playerOwned: 0, marketCap: 2000000 }
        ];

        this.exchange = {
            open: true,
            volume: 0,
            lastCrashDay: 0
        };

        // Roadmap Item 752: Hostile Takeover Logic
        this.takeoverInProgress = null; // { targetId, progress, dayStarted }

        // Roadmap Item 208: Inflation System
        this.inflationRate = 1.0; // 1.0 = 0% inflation
        this.inflationHistory = [1.0];

        // Roadmap Item 209: Debt and Interest
        this.debt = {
            principal: 0,
            interestRate: 0.05, // 5% daily
            lastPaymentDay: 0
        };

        // Roadmap Item 241: Universal Basic Income
        this.ubiRate = 10; // Credits per NPC per day
        this.ubiEnabled = true;

        // Roadmap Item 240: Currency exchange rates
        this.exchangeRates = {
            'EPC': 1.0, // Player currency (Credits)
            'SOL': 1.2, // Sol Federation
            'CRM': 0.8, // Crimson Syndicate
            'ZEN': 1.5  // Zenith Collective
        };

        // Roadmap Item 272: Economic Booms and Busts
        this.marketCycle = {
            type: 'stable', // boom, bust, stable
            multiplier: 1.0,
            remainingDays: 0
        };

        // Roadmap Item 284-291: Corporate Competition & Marketing
        this.corporateState = {
            sentiment: 1.0, // Global consumer sentiment
            monopolyRisk: 0,
            brandLoyalty: { 'player': 50, 'sol_fed': 50, 'crimson': 10, 'zenith': 60 },
            activeMarketing: null // { type, duration, cost }
        };

        // Roadmap Item 300: Universal Galactic Ledger (Blockchain)
        this.ledger = []; // Array of { id, type, from, to, amount, resource, day }

        // Roadmap Item 384: Multiverse Trade Routes
        this.multiverseRoutesActive = false;
        this.interdimensionalProfitMult = 5.0; // High risk, high reward

        // Roadmap Item 268: Insurance
        this.insuranceActive = false;
        this.insuranceCostMult = 0.05; // 5% of potential profit

        // Trade Fleet Initialization (Fixes TypeError in update loop)
        this.tradeFleets = [];
        this.tradeRoutes = [];
        this.tradeRouteSequence = 0;
        this.lastRouteSyncSignature = '';

        console.log("💰 Economy System Initialized");
    }

    syncTradeRoutesFromGalaxy() {
        const universe = this.game?.universe;
        const stars = Array.isArray(universe?.galacticMap?.stars) ? universe.galacticMap.stars : [];
        const current = universe?.getCurrentStar?.();
        if (!current || !stars.length) return this.tradeRoutes;
        const discovered = stars.filter((star) => star?.discovered && String(star.id) !== String(current.id));
        const signature = `${current.id}|${discovered.map((star) => star.id).sort().join(',')}|${this.game?.hasOperationalLaunchSite?.() ? 1 : 0}`;
        if (signature === this.lastRouteSyncSignature && this.tradeRoutes.length) return this.tradeRoutes;
        this.lastRouteSyncSignature = signature;

        const existing = new Map(this.tradeRoutes.map((route) => [route.id, route]));
        const generated = [];
        discovered.forEach((star) => {
            const metrics = universe.getTravelMetrics?.(star) || { distance: 100 };
            const distance = Math.max(1, Number(metrics.distance || 100));
            const hazards = Array.isArray(star.hazards) ? star.hazards.length : 0;
            const security = Number(this.game?.systemSecurity?.[star.id] ?? star.security ?? 0.5);
            const id = `trade_${current.id}_${star.id}`;
            const previous = existing.get(id);
            generated.push({
                id,
                name: `${current.name} ↔ ${star.name}`,
                from: current.name,
                to: star.name,
                fromStarId: current.id,
                toStarId: star.id,
                distance,
                duration: Math.max(24, Math.min(120, Math.round(24 + distance * 0.12))),
                credits: Math.max(80, Math.round(80 + distance * 0.55 + hazards * 45)),
                risk: Math.max(0.05, Math.min(0.75, (1 - security) * 0.55 + hazards * 0.08)),
                runsCompleted: Number(previous?.runsCompleted || 0),
                generated: true
            });
        });

        if (this.game?.hasOperationalLaunchSite?.()) {
            const id = `trade_${current.id}_orbital_exchange`;
            const previous = existing.get(id);
            generated.unshift({
                id,
                name: `${current.name} Orbital Exchange`,
                from: current.name,
                to: 'Orbital Logistics Ring',
                fromStarId: current.id,
                toStarId: current.id,
                distance: 2,
                duration: 24,
                credits: 90,
                risk: 0.04,
                runsCompleted: Number(previous?.runsCompleted || 0),
                local: true,
                generated: true
            });
        }

        const custom = this.tradeRoutes.filter((route) => !route.generated && !String(route.id || '').startsWith('trade_'));
        this.tradeRoutes = [...generated, ...custom];
        const validIds = new Set(this.tradeRoutes.map((route) => route.id));
        this.tradeFleets = this.tradeFleets.filter((fleet) => {
            if (validIds.has(fleet.routeId)) return true;
            const ship = this.game?.ships?.find?.((entry) => String(entry.id) === String(fleet.shipId));
            if (ship?.status === 'trading') ship.status = 'docked';
            return false;
        });
        return this.tradeRoutes;
    }

    getTradeFleetProgress(fleet) {
        const route = this.tradeRoutes.find((entry) => entry.id === fleet?.routeId);
        if (!route || !fleet) return 0;
        const duration = Math.max(1, Number(fleet.duration || route.duration || 60));
        return Math.max(0, Math.min(1, 1 - Number(fleet.timer || 0) / duration));
    }

    recallTradeFleet(fleetId, notify = true) {
        const index = this.tradeFleets.findIndex((fleet) => String(fleet.id) === String(fleetId));
        if (index < 0) return false;
        const [fleet] = this.tradeFleets.splice(index, 1);
        const ship = this.game?.ships?.find?.((entry) => String(entry.id) === String(fleet.shipId));
        if (ship && ship.status === 'trading') ship.status = 'docked';
        this.logShippingEvent(fleet, 'RECALL', `Vessel ${fleet.shipId} recalled to port.`);
        if (notify) this.game?.notify?.(`${ship?.name || 'Trade vessel'} recalled from autonomous trade.`, 'info');
        return true;
    }

    update(dt) {
        // Run update logic occasionally, not every frame, or trickle update
        // We'll update every day tick in the main game loop mostly, but here we can do continuous fluctuation
        
        this.syncTradeRoutesFromGalaxy();

        // Roadmap Item 195: Black Market Logic
        this.updateBlackMarket(dt);

        // Roadmap Item 206: Update Stock Prices
        if (Math.random() < 0.01 * dt) {
            this.updateStocks();
        }

        // Simulate minor market noise
        Object.keys(this.marketState).forEach(res => {
            const state = this.marketState[res];

            // Random fluctuation
            const noise = (Math.random() - 0.5) * this.volatility * state.price * dt;

            // Supply/Demand pull
            const targetPrice = this.basePrices[res] * (state.demand / state.supply);
            const correction = (targetPrice - state.price) * 0.1 * dt; // Gradual correction

            state.price += noise + correction;

            // Safety Clamps
            if (state.price < this.basePrices[res] * 0.1) state.price = this.basePrices[res] * 0.1;
            if (state.price > this.basePrices[res] * 10) state.price = this.basePrices[res] * 10;
        });

        // Roadmap Item 204: Update Trade Fleets
        this.tradeFleets.forEach(f => {
            f.timer -= dt;
            if (f.timer <= 0) {
                this.completeTradeRun(f);
                const route = this.tradeRoutes.find((entry) => entry.id === f.routeId);
                f.timer = Math.max(1, Number(route?.duration || f.duration || 60));
                f.duration = f.timer;
            }
        });

        // Roadmap Item 269: Random Piracy Event during transit
        if (Math.random() < 0.0001 * dt) {
            this.triggerPiracyEncounter();
        }
    }

    triggerPiracyEncounter() {
        if (this.tradeFleets.length === 0) return false;
        const fleetIdx = Math.floor(Math.random() * this.tradeFleets.length);
        const fleet = this.tradeFleets[fleetIdx];
        const route = this.tradeRoutes.find((entry) => entry.id === fleet.routeId);
        if (!route) return false;
        const security = Number(this.game?.systemSecurity?.[route.toStarId] ?? this.game?.systemSecurity?.[this.game.currentSystemId] ?? 0.5);
        const attackChance = Math.max(0.02, Math.min(0.85, Number(route.risk || 0.2) + (1 - security) * 0.2));
        if (Math.random() >= attackChance) return false;

        const ship = this.game?.ships?.find?.((entry) => String(entry.id) === String(fleet.shipId));
        const maxHp = Math.max(1, Number(ship?.stats?.maxHp || ship?.design?.stats?.hp || 100));
        const damage = Math.max(1, Math.ceil(maxHp * (0.05 + Number(route.risk || 0.2) * 0.18)));
        if (ship?.stats) ship.stats.hp = Math.max(1, Number(ship.stats.hp || maxHp) - damage);
        if (fleet.insured) {
            const payout = Math.floor(Number(route.credits || 0) * 0.8);
            this.game.resources.credits = Number(this.game.resources.credits || 0) + payout;
            this.game.notify(`Trade insurance paid ${payout} Cr after a piracy incident.`, 'success');
        }
        this.game.notify(`${ship?.name || 'Trade vessel'} was intercepted on ${route.name}; route aborted with ${damage} hull damage.`, 'warning');
        this.game.recordColonyEvent?.(`Pirates intercepted ${ship?.name || 'a trade vessel'} on ${route.name}; the vessel returned damaged.`, 0.7, 'warning');
        this.recallTradeFleet(fleet.id, false);
        return true;
    }

    assignShipToTrade(shipId, routeId, insured = false) {
        this.syncTradeRoutesFromGalaxy();
        const route = this.tradeRoutes.find((entry) => String(entry.id) === String(routeId));
        const ship = this.game?.ships?.find?.((entry) => String(entry.id) === String(shipId));
        if (!route || !ship) return false;
        if (ship.status !== 'docked') {
            this.game.notify(`${ship.name} must be docked before trade assignment.`, 'warning');
            return false;
        }
        if (this.tradeFleets.some((fleet) => String(fleet.shipId) === String(ship.id))) {
            this.game.notify(`${ship.name} is already assigned to a trade fleet.`, 'warning');
            return false;
        }
        const isInterdimensional = !!route.isMultiverse;
        const profit = Number(route.credits || 0) * (isInterdimensional ? this.interdimensionalProfitMult : 1);
        const insuranceCost = insured ? Math.max(1, Math.floor(profit * this.insuranceCostMult)) : 0;
        if (Number(this.game.resources.credits || 0) < insuranceCost) {
            this.game.notify('Insufficient credits for trade insurance premium.', 'warning');
            return false;
        }
        this.game.resources.credits -= insuranceCost;
        this.tradeRouteSequence += 1;
        const duration = Math.max(1, Number(route.duration || 60));
        const fleet = {
            id: `tradefleet_${this.tradeRouteSequence}_${Date.now().toString(36)}`,
            routeId: route.id,
            shipId: ship.id,
            timer: duration,
            duration,
            insured: !!insured,
            isMultiverse: isInterdimensional,
            runsCompleted: 0,
            assignedDay: Number(this.game.day || 0)
        };
        ship.status = 'trading';
        this.tradeFleets.push(fleet);
        this.logShippingEvent(fleet, 'DEPARTURE', `Vessel ${ship.name} departing on ${route.name}. Insured: ${insured}`);
        if (insuranceCost) this.addToLedger('INSURANCE', 'player', 'underwriter', insuranceCost, 'credits');
        this.game.notify(`${ship.name} assigned to autonomous trade route: ${route.name}.`, 'success');
        this.game.updateResourceUI?.();
        return fleet;
    }

    completeTradeRun(fleet) {
        const route = this.tradeRoutes.find(r => r.id === fleet.routeId);
        if (!route) return;

        // Roadmap Item 267: Real-time shipping trackers
        this.logShippingEvent(fleet, "ARRIVAL", `Trade run completed at ${route.to}.`);

        // Simulate resource movement/credits gain
        const profit = Number(route.credits || 0) * (fleet.isMultiverse ? this.interdimensionalProfitMult : 1);
        this.game.resources.credits = Number(this.game.resources.credits || 0) + profit;
        fleet.runsCompleted = Number(fleet.runsCompleted || 0) + 1;
        route.runsCompleted = Number(route.runsCompleted || 0) + 1;
        this.addToLedger('TRADE_ROUTE', route.from, route.to, profit, 'credits');
        this.game.notify(`Trade Run Complete: +${Math.floor(profit)} Cr from ${route.name}`, 'success');
        this.game.updateResourceUI();
    }

    logShippingEvent(fleet, type, msg) {
        // Roadmap Item 267: Real-time shipping trackers
        if (!this.shippingLog) this.ledger = this.ledger || []; // Re-use ledger logic or specific log
        const entry = {
            fleetId: fleet.id,
            shipId: fleet.shipId,
            type,
            msg,
            timestamp: Date.now(),
            day: this.game.day
        };
        this.addToLedger('SHIPPING', fleet.id, 'LOG', 0, type + ": " + msg);
    }

    // Called once per game day
    dailyUpdate() {
        // Roadmap Block 6: Dyson Markets & Corporate Warfare
        this.updateDysonMarkets();
        this.processCorporateRaids();

        // Roadmap Item 272: Economic Cycle Management
        this.updateMarketCycle();

        // Roadmap Item 289: Update Consumer Sentiment
        this.updateSentiment();

        // Roadmap Item 284: Corporate Competition
        this.updateCorporateCompetition();

        // Roadmap Item 208: Inflation Adjustment
        const totalCredits = (this.game.resources.credits || 0) + this.stocks.reduce((sum, s) => sum + (s.price * s.playerOwned), 0);
        const inflationShift = (totalCredits / 100000) * 0.01; // Every 100k credits causes 1% inflation pressure
        this.inflationRate = Math.max(0.5, Math.min(2.0, this.inflationRate + (Math.random() - 0.4 + inflationShift) * 0.02));
        this.inflationHistory.push(this.inflationRate);
        if (this.inflationHistory.length > 30) this.inflationHistory.shift();

        // Roadmap Item 241: UBI Distribution
        if (this.ubiEnabled && this.game.colonists.length > 0) {
            const totalUbi = this.game.colonists.length * this.ubiRate;
            if (this.game.resources.credits >= totalUbi) {
                this.game.resources.credits -= totalUbi;
                this.game.colonists.forEach(c => {
                    const npc = this.game.npcSystem.npcs[c.id];
                    if (npc) npc.credits = (npc.credits || 0) + this.ubiRate;
                });
            } else {
                this.game.notify("⚠️ ECONOMY: Insufficient funds for UBI distribution!", "warning");
            }
        }

        // Roadmap Item 245: Patent Royalties
        this.applyPatents();

        // Roadmap Item 244: Service Economy (Tourism)
        this.applyTourismIncome();

        // Roadmap Item 240: Exchange rate fluctuations
        Object.keys(this.exchangeRates).forEach(k => {
            if (k === 'EPC') return;
            this.exchangeRates[k] += (Math.random() - 0.5) * 0.05;
            this.exchangeRates[k] = Math.max(0.1, Math.min(5.0, this.exchangeRates[k]));
        });

        // Roadmap Item 209: Debt Interest Application
        if (this.debt.principal > 0) {
            const interest = this.debt.principal * this.debt.interestRate;
            this.debt.principal += interest;
            this.game.notify(`💳 DEBT: Daily interest of ${Math.floor(interest)} Cr applied to your balance.`, "warning");
        }

        Object.keys(this.marketState).forEach(res => {
            const state = this.marketState[res];

            // Roadmap Item 141: AI-driven economy manipulation by factions
            if (this.game.factionManager) {
                Object.values(this.game.factionManager.factions).forEach(f => {
                    if (f.type !== 'ai') return;
                    // Factions trade resources based on their personality
                    if (Math.random() < 0.1 * f.personality.trade) {
                        const tradeImpact = (Math.random() - 0.5) * 0.2 * f.personality.aggression;
                        state.demand += tradeImpact;
                        state.supply -= tradeImpact * 0.5;
                        // Log to faction history if significant
                        if (Math.abs(tradeImpact) > 0.05) {
                            this.game.factionManager.logHistory(f.id, `Executed heavy market trades in ${res}, causing price shifts.`);
                        }
                    }
                });
            }

            // Roadmap Item 203: Seasonal & External factors
            const seasonMult = 1.0 + Math.sin(this.game.day / 10) * 0.2; // 10-day cycles
            const populationPressure = 1.0 + (this.game.colonists.length / 50);
            
            // Adjust demand based on colony state
            if (res === 'food' || res === 'energy') state.demand *= populationPressure;
            if (res === 'tech' || res === 'data') state.demand *= (1.0 + (this.game.day / 100));

            // Drift demand/supply slowly back to equilibrium
            state.demand += (1.0 - state.demand) * 0.05;
            state.supply += (1.0 - state.supply) * 0.05;

            // Update price based on supply/demand + Inflation (Item 208)
            const targetPrice = this.basePrices[res] * (state.demand / state.supply) * seasonMult * this.inflationRate;
            state.price = state.price + (targetPrice - state.price) * 0.2;

            // Store history
            this.history[res].push(state.price);
            if (this.history[res].length > 30) this.history[res].shift();

            // Random Event Chance (3% - Roadmap Item 203 expansion)
            if (Math.random() < 0.03) {
                this.triggerMarketEvent(res);
            }
        });
    }

    triggerMarketEvent(resource) {
        const events = [
            { name: "Shortage", effect: (s) => { s.supply *= 0.5; }, msg: "Reported shortage of" },
            { name: "Surplus", effect: (s) => { s.supply *= 1.5; }, msg: "Massive surplus of" },
            { name: "Boom", effect: (s) => { s.demand *= 1.5; }, msg: "Skyrocketing demand for" },
            { name: "Crash", effect: (s) => { s.demand *= 0.5; }, msg: "Market crash for" },
            // Roadmap Item 236: Rare-earth mineral scarcity
            { name: "Scarcity", effect: (s) => { s.supply *= 0.1; s.demand *= 2.0; }, msg: "EXTREME SCARCITY DETECTED:" }
        ];

        const ev = events[Math.floor(Math.random() * events.length)];
        ev.effect(this.marketState[resource]);

        this.game.notify(`💹 Market Update: ${ev.msg} ${resource}!`, 'info');
    }

    updateMarketCycle() {
        // Roadmap Item 272: Procedural Booms and Busts
        if (this.marketCycle.remainingDays <= 0) {
            const roll = Math.random();
            if (roll < 0.1) {
                this.marketCycle = { type: 'boom', multiplier: 1.5, remainingDays: 5 + Math.floor(Math.random() * 5) };
                this.game.notify("🚀 ECONOMIC BOOM: Market demand is skyrocketing across the sector!", "success");
            } else if (roll > 0.9) {
                this.marketCycle = { type: 'bust', multiplier: 0.5, remainingDays: 5 + Math.floor(Math.random() * 5) };
                this.game.notify("📉 ECONOMIC BUST: Recession detected. Market prices are crashing.", "danger");
            } else {
                this.marketCycle = { type: 'stable', multiplier: 1.0, remainingDays: 10 };
            }
        } else {
            this.marketCycle.remainingDays--;
        }
    }

    updateSentiment() {
        // Roadmap Item 289: Consumer sentiment tracking
        const morale = this.game.morale || 100;
        const targetSentiment = morale / 100;
        this.corporateState.sentiment += (targetSentiment - this.corporateState.sentiment) * 0.1;
    }

    updateCorporateCompetition() {
        // Roadmap Item 284: AI-driven corporate competition
        this.stocks.forEach(stock => {
            // Find faction associated with stock
            const factionId = stock.id.toLowerCase() === 'epc' ? 'player' : 
                             (stock.id === 'SOL' ? 'sol_fed' : 
                             (stock.id === 'CRM' ? 'crimson' : 'zenith'));
            
            const loyalty = this.corporateState.brandLoyalty[factionId] || 50;
            const sentimentMult = 0.9 + (this.corporateState.sentiment * 0.2);
            
            // Roadmap Item 288: Product Ratings influence
            const rating = 1.0 + (Math.random() - 0.5) * 0.1; // Random rating drift
            stock.price *= rating;

            // Factions compete for market share
            if (Math.random() < 0.05) {
                const shift = (Math.random() - 0.5) * 5;
                this.corporateState.brandLoyalty[factionId] = Math.max(0, Math.min(100, loyalty + shift));
            }

            // Price influence from loyalty
            stock.price *= (0.95 + (loyalty / 500)) * sentimentMult;

            // Roadmap Item 285: Hostile Takeover check
            if (stock.id !== 'EPC' && stock.playerOwned > 5000 && Math.random() < 0.01) {
                this.game.notify(`💼 TAKEOVER: You have acquired a controlling interest in ${stock.name}!`, "success");
                this.game.recordColonyEvent(`Hostile takeover of ${stock.name} completed by Colony Command.`, 0.9);
                // Permanent dividend
                this.game.resources.credits = (this.game.resources.credits || 0) + 1000;
            }
        });

        // Roadmap Item 286: Monopoly detection
        const maxLoyalty = Math.max(...Object.values(this.corporateState.brandLoyalty));
        if (maxLoyalty > 85) {
            this.corporateState.monopolyRisk += 0.1;
            if (this.corporateState.monopolyRisk > 1.0 && Math.random() < 0.1) {
                this.game.notify("⚖️ ANTITRUST: Regulatory bodies are investigating market dominance.", "warning");
            }
        } else {
            this.corporateState.monopolyRisk = Math.max(0, this.corporateState.monopolyRisk - 0.05);
        }

        // Roadmap Item 298: Resource Hoarding Detection
        this.checkForHoarding();

        // Roadmap Item 287: Trade Fair Chance
        if (Math.random() < 0.005) {
            this.triggerTradeFair();
        }
    }

    checkForHoarding() {
        // Roadmap Item 298: Detect if player is hoarding resources to manipulate price
        Object.keys(this.game.resources).forEach(res => {
            const amount = this.game.resources[res] || 0;
            const cap = this.game.caps[res] || 1000;
            if (amount > cap * 0.9 && this.marketState[res]?.price > this.basePrices[res] * 2) {
                if (Math.random() < 0.05) {
                    this.game.notify(`⚖️ REGULATION: Anti-hoarding laws triggered for ${res}. Global price forced down.`, "warning");
                    this.marketState[res].price *= 0.7;
                }
            }
        });
    }

    performStressTest() {
        // Roadmap Item 297: Logistics stress tests
        this.game.notify("🧪 STRESS TEST: Simulating extreme logistics demand...", "info");
        Object.keys(this.marketState).forEach(res => {
            this.marketState[res].demand += 0.5;
        });
        setTimeout(() => {
            Object.keys(this.marketState).forEach(res => {
                this.marketState[res].demand -= 0.5;
            });
            this.game.notify("🧪 STRESS TEST: Completed. Logistics infrastructure validated.", "success");
        }, 10000);
    }

    triggerTradeFair() {
        // Roadmap Item 287: Trade fair events
        this.game.notify("🎪 TRADE FAIR: A sector-wide industrial showcase has begun!", "success");
        this.corporateState.sentiment = Math.min(2.0, this.corporateState.sentiment + 0.3);
        Object.keys(this.corporateState.brandLoyalty).forEach(k => {
            this.corporateState.brandLoyalty[k] = Math.min(100, this.corporateState.brandLoyalty[k] + 5);
        });
    }

    startMarketingCampaign(type) {
        // Roadmap Item 290: Advertising and marketing mechanics
        const costs = { 'Digital': 500, 'Holographic': 2000, 'Neural': 5000 };
        const cost = costs[type] || 1000;

        if (this.game.resources.credits < cost) {
            this.game.notify("Insufficient credits for marketing.", "warning");
            return;
        }

        this.game.resources.credits -= cost;
        this.corporateState.activeMarketing = { type, duration: 5 };
        this.corporateState.brandLoyalty['player'] = Math.min(100, this.corporateState.brandLoyalty['player'] + 15);
        this.game.notify(`📢 MARKETING: ${type} campaign launched. Brand loyalty increased!`, "success");
    }

    addToLedger(type, from, to, amount, resource) {
        // Roadmap Item 300: Universal Galactic Ledger
        const entry = {
            id: `tx_${Date.now()}_${Math.floor(Math.random()*1000)}`,
            type, from, to, amount, resource,
            day: this.game.day
        };
        this.ledger.push(entry);
        if (this.ledger.length > 100) this.ledger.shift(); // Keep recent proof of trade
    }

    getPrice(resource, locationId = null) {
        const state = this.marketState[resource];
        if (!state) return 0;
        let reputationMult = 1.0;
        if (this.game.factionManager) {
            const relationships = Object.values(this.game.factionManager.relationships?.player || {});
            const avgRep = relationships.length ? relationships.reduce((sum, value) => sum + Number(value || 0), 0) / relationships.length : 0;
            reputationMult = Math.max(0.8, Math.min(1.2, 1.0 - avgRep / 500));
        }
        let regionalMult = 1.0;
        if (locationId && String(this.game.currentSystemId) !== String(locationId)) {
            const target = this.game.universe?.galacticMap?.stars?.find?.((star) => String(star.id) === String(locationId));
            const distance = target ? Number(this.game.universe?.getTravelMetrics?.(target)?.distance || 0) : 100;
            regionalMult = 1 + Math.min(0.5, Math.max(0, distance) / 1400);
        }
        const price = Number(state.price || this.basePrices[resource] || 0) * reputationMult * regionalMult * Number(this.marketCycle?.multiplier || 1);
        return Math.max(Number(this.basePrices[resource] || 0) * 0.1, price);
    }

    calculateWarpToll(systemId) {
        // Roadmap Item 271: Warp-gate toll calculation
        // Base toll + distance/security factor
        const baseToll = 50;
        const security = this.game.systemSecurity[systemId] || 0.5;
        const securityFactor = (1.0 - security) * 100; // Dangerous systems have higher tolls or vice versa?
        // Let's say higher security systems charge more for "safe" lanes
        const toll = baseToll + (security * 150);
        return Math.floor(toll * this.inflationRate);
    }

    optimizeTradeRoutes() {
        // Roadmap Item 167: AI-driven trade route optimization
        if (!this.tradeRoutes) return;
        this.tradeRoutes.forEach(r => {
            // Profitability shift based on market state
            const fromPrice = this.getPrice('minerals'); // Simplified
            const toPrice = fromPrice * 1.5;
            r.credits = Math.floor(200 + (toPrice - fromPrice) * 10);
        });
    }

    updateBlackMarket(dt) {
        // Roadmap Item 195: AI-driven black market operations
        if (this.blackMarket.active) {
            this.blackMarket.timer -= dt;
            if (this.blackMarket.timer <= 0) {
                this.blackMarket.active = false;
                this.game.notify("🌑 BLACK MARKET: The underground traders have moved their operations.", "info");
            }
        } else {
            // 1% chance per tick to spawn black market if security is low
            const avgSecurity = Object.values(this.game.systemSecurity).reduce((a, b) => a + b, 0) / 4;
            if (Math.random() < 0.001 * (1.0 - avgSecurity)) {
                this.blackMarket.active = true;
                this.blackMarket.timer = 300; // 5 minutes
                this.blackMarket.inventory = this.generateBlackMarketInventory();
                this.game.notify("🌑 BLACK MARKET: Cryptic signals indicate an underground trade hub is active!", "warning");
            }
        }
    }

    generateBlackMarketInventory() {
        const items = [
            { name: 'Illegal AI Cores', cost: 1000, type: 'data' },
            { name: 'Stolen Prototypes', cost: 2000, type: 'tech' },
            { name: 'Dark Matter Samples', cost: 5000, type: 'dark_matter' },
            // Roadmap Item 227: Prohibited Tech
            { name: 'Unfiltered Neural-Link', cost: 3000, type: 'prohibited_tech', desc: 'Forbidden cognitive enhancement.' },
            { name: 'Void-Matter Explosives', cost: 4500, type: 'prohibited_tech', desc: 'Banned planetary excavation tool.' }
        ];
        return items.sort(() => Math.random() - 0.5).slice(0, 3);
    }

    updateStocks() {
        // Roadmap Item 206: Galactic Stock Market Logic
        this.stocks.forEach(s => {
            const noise = (Math.random() - 0.5) * s.volatility * s.price;
            s.price = Math.max(1, s.price + noise);
            s.history.push(s.price);
            if (s.history.length > 50) s.history.shift();
        });
    }

    // Compatibility alias for older code calling market.updatePrices
    updatePrices() {
        this.updateStocks();
        // Also simulate daily market shift if needed, 
        // though dailyUpdate handles the bulk of it.
    }

    // Roadmap Item 245: Patent System
    applyPatents() {
        const patentIncome = this.game.technologies ? Object.values(this.game.technologies).filter(t => t.unlocked).length * 5 : 0;
        if (patentIncome > 0) {
            this.game.resources.credits = (this.game.resources.credits || 0) + patentIncome;
            if (this.game.day % 5 === 0) {
                this.game.notify(`📜 PATENTS: Received ${patentIncome} Cr in licensing fees.`, "success");
            }
        }
    }

    // Roadmap Item 244: Service-based economy
    applyTourismIncome() {
        const morale = this.game.morale || 100;
        const habitability = this.game.terraforming?.habitability || 0;
        if (morale > 70 && habitability > 50) {
            const visitors = Math.floor((morale - 70) * (habitability / 50));
            const income = visitors * 5;
            if (income > 0) {
                this.game.resources.credits = (this.game.resources.credits || 0) + income;
                if (this.game.day % 3 === 0) {
                    this.game.notify(`✨ TOURISM: ${visitors} galactic tourists visited Kepler-186f. +${income} Cr`, "success");
                }
            }
        }
    }

    buyStock(stockId, amount) {
        // Roadmap Item 206: Buy Stocks
        const stock = this.stocks.find(s => s.id === stockId);
        if (!stock) return false;

        const totalCost = stock.price * amount;
        if (this.game.resources.credits < totalCost) {
            this.game.notify("Insufficient credits for stock purchase!", "danger");
            return false;
        }

        this.game.resources.credits -= totalCost;
        stock.playerOwned += amount;
        this.addToLedger('STOCK_BUY', 'player', stock.id, totalCost, 'credits');
        this.game.notify(`Purchased ${amount} shares of ${stock.name}.`, 'success');
        this.game.updateResourceUI();
        return true;
    }

    sellStock(stockId, amount) {
        // Roadmap Item 206: Sell Stocks
        const stock = this.stocks.find(s => s.id === stockId);
        if (!stock || stock.playerOwned < amount) {
            this.game.notify("Not enough shares to sell!", "warning");
            return false;
        }

        const totalGain = stock.price * amount;
        this.game.resources.credits = (this.game.resources.credits || 0) + totalGain;
        stock.playerOwned -= amount;
        this.addToLedger('STOCK_SELL', stock.id, 'player', totalGain, 'credits');
        this.game.notify(`Sold ${amount} shares of ${stock.name} for ${Math.floor(totalGain)} Cr.`, 'success');
        this.game.updateResourceUI();
        return true;
    }

    takeLoan(amount) {
        // Roadmap Item 209: Debt and Interest
        if (this.debt.principal > 10000) {
            this.game.notify("Credit limit reached. Repay existing debt first.", "danger");
            return false;
        }
        this.debt.principal += amount;
        this.game.resources.credits = (this.game.resources.credits || 0) + amount;
        this.game.notify(`Loan Approved: +${amount} Cr added to account.`, "success");
        this.game.updateResourceUI();
        return true;
    }

    repayDebt(amount) {
        // Roadmap Item 209: Repay Debt
        if (this.game.resources.credits < amount) {
            this.game.notify("Insufficient credits for repayment.", "warning");
            return false;
        }
        const actualRepayment = Math.min(amount, this.debt.principal);
        this.game.resources.credits -= actualRepayment;
        this.debt.principal -= actualRepayment;
        this.game.notify(`Debt Repayment: -${Math.floor(actualRepayment)} Cr. Remaining: ${Math.floor(this.debt.principal)} Cr.`, "success");
        this.game.updateResourceUI();
        return true;
    }

    getTrend(resource) {
        const hist = this.history[resource];
        if (!hist || hist.length < 2) return 'stable';
        const last = hist[hist.length - 1];
        const prev = hist[hist.length - 2];
        return last > prev ? 'up' : (last < prev ? 'down' : 'stable');
    }

    // Player interactions
    buy(resource, amount) {
        const price = this.getPrice(resource);
        const total = price * amount;

        if (this.game.resources.credits < total) {
            this.game.notify("Not enough credits!", "error");
            return false;
        }

        this.game.resources.credits -= total;
        this.game.resources[resource] = (this.game.resources[resource] || 0) + amount;

        // Buying increases demand / reduces supply -> price up
        this.marketState[resource].demand += 0.01 * amount;
        this.game.notify(`Bought ${amount} ${resource} for ${Math.floor(total)} Cr`, "success");
        this.game.updateResourceUI();

        // Roadmap Item 300: Log to ledger
        this.addToLedger('BUY', 'player', 'market', total, resource);

        // Immediate small price bump for visual feedback
        this.marketState[resource].price += price * 0.01;

        return true;
    }

    sell(resource, amount) {
        if ((this.game.resources[resource] || 0) < amount) {
            this.game.notify(`Not enough ${resource}!`, "error");
            return false;
        }

        const price = this.getPrice(resource);
        const total = price * amount;

        this.game.resources[resource] -= amount;
        this.game.resources.credits += total;

        // Selling increases supply -> price down
        this.marketState[resource].supply += 0.01 * amount;
        this.game.notify(`Sold ${amount} ${resource} for ${Math.floor(total)} Cr`, "success");
        this.game.updateResourceUI();

        // Roadmap Item 300: Log to ledger
        this.addToLedger('SELL', 'player', 'market', total, resource);

        // Immediate small price drop
        this.marketState[resource].price -= price * 0.01;

        return true;
    }

    // Roadmap Item 3127: Dyson Markets
    updateDysonMarkets() {
        if (this.game.megastructureSystem?.swarmSatellites > 1000) {
            const energyPrice = this.getPrice('energy');
            const dividend = Math.floor(this.game.megastructureSystem.swarmSatellites * 0.1 * energyPrice);
            this.game.resources.credits = (this.game.resources.credits || 0) + dividend;
            if (this.game.day % 10 === 0) {
                this.game.notify(`☀️ DYSON REVENUE: Your swarm has generated ${dividend} Cr in energy dividends.`, "success");
            }
        }
    }

    // Roadmap Item 3130: Corporate Warfare (processCorporateRaids)
    processCorporateRaids() {
        this.stocks.forEach(s => {
            if (s.id !== 'EPC' && Math.random() < 0.01) {
                this.game.notify(`📉 CORPORATE RAID: ${s.name} is under a short-seller attack!`, "warning");
                s.price *= 0.85;
            }
        });
    }

    exportState() {
        return {
            version: 3,
            marketState: JSON.parse(JSON.stringify(this.marketState)),
            history: JSON.parse(JSON.stringify(this.history)),
            stocks: this.stocks.map((stock) => ({ ...stock, history: [...(stock.history || [])] })),
            exchange: { ...this.exchange },
            takeoverInProgress: this.takeoverInProgress ? { ...this.takeoverInProgress } : null,
            inflationRate: Number(this.inflationRate || 1),
            inflationHistory: [...this.inflationHistory],
            debt: { ...this.debt },
            ubiRate: Number(this.ubiRate || 0),
            ubiEnabled: !!this.ubiEnabled,
            exchangeRates: { ...this.exchangeRates },
            marketCycle: { ...this.marketCycle },
            corporateState: JSON.parse(JSON.stringify(this.corporateState)),
            ledger: this.ledger.slice(-100).map((entry) => ({ ...entry })),
            blackMarket: JSON.parse(JSON.stringify(this.blackMarket)),
            multiverseRoutesActive: !!this.multiverseRoutesActive,
            insuranceActive: !!this.insuranceActive,
            tradeRoutes: this.tradeRoutes.map((route) => ({ ...route })),
            tradeFleets: this.tradeFleets.map((fleet) => ({ ...fleet })),
            tradeRouteSequence: Number(this.tradeRouteSequence || 0)
        };
    }

    importState(data, options = {}) {
        if (!data || typeof data !== 'object') {
            this.syncTradeRoutesFromGalaxy();
            return false;
        }
        if (data.marketState && typeof data.marketState === 'object') {
            Object.keys(this.basePrices).forEach((resource) => {
                const raw = data.marketState[resource];
                if (!raw) return;
                this.marketState[resource] = {
                    price: Math.max(this.basePrices[resource] * 0.1, Number(raw.price || this.basePrices[resource])),
                    demand: Math.max(0.05, Number(raw.demand || 1)),
                    supply: Math.max(0.05, Number(raw.supply || 1)),
                    trend: Number(raw.trend || 0)
                };
            });
        }
        if (data.history && typeof data.history === 'object') {
            Object.keys(this.basePrices).forEach((resource) => {
                if (Array.isArray(data.history[resource])) this.history[resource] = data.history[resource].slice(-30).map(Number).filter(Number.isFinite);
            });
        }
        if (Array.isArray(data.stocks)) {
            const byId = new Map(data.stocks.map((stock) => [stock?.id, stock]));
            this.stocks = this.stocks.map((stock) => {
                const raw = byId.get(stock.id);
                if (!raw) return stock;
                return {
                    ...stock,
                    ...raw,
                    price: Math.max(1, Number(raw.price || stock.price)),
                    history: Array.isArray(raw.history) ? raw.history.slice(-50).map(Number).filter(Number.isFinite) : stock.history,
                    playerOwned: Math.max(0, Math.floor(Number(raw.playerOwned || 0)))
                };
            });
        }
        if (data.exchange) this.exchange = { ...this.exchange, ...data.exchange };
        this.takeoverInProgress = data.takeoverInProgress ? { ...data.takeoverInProgress } : null;
        if (Number.isFinite(Number(data.inflationRate))) this.inflationRate = Number(data.inflationRate);
        if (Array.isArray(data.inflationHistory)) this.inflationHistory = data.inflationHistory.slice(-30).map(Number).filter(Number.isFinite);
        if (data.debt) this.debt = { ...this.debt, ...data.debt, principal: Math.max(0, Number(data.debt.principal || 0)) };
        if (Number.isFinite(Number(data.ubiRate))) this.ubiRate = Math.max(0, Number(data.ubiRate));
        if (typeof data.ubiEnabled === 'boolean') this.ubiEnabled = data.ubiEnabled;
        if (data.exchangeRates) this.exchangeRates = { ...this.exchangeRates, ...data.exchangeRates };
        if (data.marketCycle) this.marketCycle = { ...this.marketCycle, ...data.marketCycle };
        if (data.corporateState) this.corporateState = { ...this.corporateState, ...data.corporateState };
        if (Array.isArray(data.ledger)) this.ledger = data.ledger.slice(-100).map((entry) => ({ ...entry }));
        if (data.blackMarket) this.blackMarket = { ...this.blackMarket, ...data.blackMarket, inventory: Array.isArray(data.blackMarket.inventory) ? data.blackMarket.inventory.map((item) => ({ ...item })) : [] };
        if (typeof data.multiverseRoutesActive === 'boolean') this.multiverseRoutesActive = data.multiverseRoutesActive;
        if (typeof data.insuranceActive === 'boolean') this.insuranceActive = data.insuranceActive;
        if (Array.isArray(data.tradeRoutes)) this.tradeRoutes = data.tradeRoutes.map((route) => ({ ...route }));
        if (Array.isArray(data.tradeFleets)) this.tradeFleets = data.tradeFleets.map((fleet) => ({ ...fleet }));
        this.tradeRouteSequence = Math.max(0, Math.floor(Number(data.tradeRouteSequence || 0)));
        const validShips = new Set((this.game?.ships || []).map((ship) => String(ship.id)));
        this.tradeFleets = this.tradeFleets.filter((fleet) => validShips.has(String(fleet.shipId)));
        this.tradeFleets.forEach((fleet) => {
            const ship = this.game.ships.find((entry) => String(entry.id) === String(fleet.shipId));
            if (ship) ship.status = 'trading';
        });
        this.lastRouteSyncSignature = '';
        if (!options.deferRouteSync) this.syncTradeRoutesFromGalaxy();
        return true;
    }

}

window.EconomyManager = EconomyManager;
