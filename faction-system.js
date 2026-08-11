class FactionManager {
    constructor(game) {
        this.game = game;
        this.factions = {};
        this.relationships = {}; // Map<FactionID, Map<FactionID, Number>>
    }

    init() {
        console.log("🏳️ Faction System: Initializing Diplomatic Channels...");
        this.sanctions = {};
        
        // Roadmap Item 501: Galactic UN
        this.galacticUN = {
            active: true,
            resolutions: [],
            votingPower: { 'player': 1, 'sol_fed': 5, 'zenith': 3, 'crimson': 0 },
            currentSession: null
        };

        // Roadmap Item 503: Territorial Sovereignty
        this.sovereignty = { // sectorId -> factionId
            'Core-01': 'sol_fed',
            'Rim-09': 'crimson',
            'Kepler-Main': 'player'
        };

        this.galacticCouncil = {
            active: true,
            votingCycle: 30, 
            lastVoteDay: 0,
            currentResolution: null,
            proposals: [],
            representatives: ['player', 'sol_fed', 'zenith']
        };

        // Roadmap Item 358: Territorial Disputes
        this.disputes = []; // Array of { factionA, factionB, sectorId, intensity }

        this.factions = {
            'player': {
                id: 'player',
                name: 'Colony Command',
                type: 'player',
                color: '#38bdf8',
                description: 'Your colony on Kepler-186f.',
                history: [], // Roadmap Item 135: Faction History
                ideology: 'Expansionist', // Roadmap Item 157
                identity: this.generateIdentity('Colony Command'), // Roadmap Item 154
                dao: this.createDAO('Colony Command') // Roadmap Item 207
            },
            'sol_fed': {
                id: 'sol_fed',
                name: 'United Sol Federation',
                type: 'ai',
                color: '#fde047', // Yellow
                description: 'The remnants of Earth\'s governing body. Bureaucratic but resource-rich.',
                personality: { aggression: 0.3, trade: 0.8, tech: 0.5 },
                resources: { credit: 5000, tech: 100 },
                history: [],
                ideology: 'Bureaucratic',
                identity: this.generateIdentity('United Sol Federation'),
                dao: this.createDAO('United Sol Federation')
            },
            'crimson': {
                id: 'crimson',
                name: 'Crimson Syndicate',
                type: 'ai',
                color: '#ef4444', // Red
                description: 'Pirates and smugglers operating in the outer rim.',
                personality: { aggression: 0.9, trade: 0.4, tech: 0.2 },
                resources: { credit: 1000, tech: 20 },
                history: [],
                ideology: 'Opportunist',
                identity: this.generateIdentity('Crimson Syndicate'),
                dao: this.createDAO('Crimson Syndicate')
            },
            'zenith': {
                id: 'zenith',
                name: 'Zenith Collective',
                type: 'ai',
                color: '#a855f7', // Purple
                description: 'A secretive group of transhumanist scientists.',
                personality: { aggression: 0.1, trade: 0.5, tech: 1.0 },
                resources: { credit: 3000, tech: 500 },
                history: [],
                ideology: 'Technocratic',
                identity: this.generateIdentity('Zenith Collective'),
                dao: this.createDAO('Zenith Collective')
            }
        };

        // Initialize Relationships (0 = Neutral, 100 = Allied, -100 = War)
        this.relationships = {
            'player': { 'sol_fed': 10, 'crimson': -20, 'zenith': 0 },
            'sol_fed': { 'player': 10, 'crimson': -80, 'zenith': 20 },
            'crimson': { 'player': -20, 'sol_fed': -80, 'zenith': -10 },
            'zenith': { 'player': 0, 'sol_fed': 20, 'crimson': -10 }
        };
    }

    generateIdentity(name) {
        // Roadmap Item 154: AI-generated colony anthems and flags
        const symbols = ['☀️', '🚀', '🧬', '⚛️', '🪐', '🛡️', '⚒️'];
        const colors = ['Crimson', 'Azure', 'Golden', 'Emerald', 'Obsidian', 'Silver'];
        const anthems = [
            `Ode to the ${name} Stars`,
            `The ${name} Horizon March`,
            `Vanguard of the ${name} Reach`,
            `Eternal Pulse of ${name}`
        ];

        return {
            flag: `${symbols[Math.floor(Math.random() * symbols.length)]} ${colors[Math.floor(Math.random() * colors.length)]} Standard`,
            anthem: anthems[Math.floor(Math.random() * anthems.length)]
        };
    }

    updateIdeology(factionId, eventType) {
        // Roadmap Item 157: Faction Ideology Shifts
        const f = this.factions[factionId];
        if (!f || f.id === 'player') return;

        const ideologies = ['Isolationist', 'Expansionist', 'Technocratic', 'Militaristic', 'Mercantile'];
        
        if (eventType === 'WAR' && f.ideology !== 'Militaristic') {
            f.ideology = 'Militaristic';
            this.game.notify(`🏳️ IDEOLOGY SHIFT: ${f.name} has embraced ${f.ideology} principles due to conflict.`, "warning");
        } else if (eventType === 'TRADE_BOOM' && f.ideology !== 'Mercantile') {
            f.ideology = 'Mercantile';
            this.game.notify(`🏳️ IDEOLOGY SHIFT: ${f.name} is now following a ${f.ideology} path.`, "success");
        }
    }

    createDAO(name) {
        // Roadmap Item 207: Decentralized Autonomous Organizations
        return {
            name: `${name} DAO`,
            proposals: [],
            treasury: 0,
            votingPower: {} // Faction members/partners voting weight
        };
    }

    updateDAOs(dt) {
        // Roadmap Item 207: DAO governance simulation
        Object.values(this.factions).forEach(f => {
            if (!f.dao) return;
            
            // Randomly generate proposals
            if (Math.random() < 0.001 * dt) {
                this.generateDAOProposal(f);
            }

            // Update treasury based on faction success
            if (f.resources && f.resources.credit) {
                const contribution = f.resources.credit * 0.01;
                f.dao.treasury += contribution;
                f.resources.credit -= contribution;
            }
        });
    }

    generateDAOProposal(f) {
        const types = ['Infrastructure Grant', 'Scientific Bounty', 'Defense Levy', 'Social Dividend'];
        const type = types[Math.floor(Math.random() * types.length)];
        const proposal = {
            id: `prop_${Date.now()}`,
            type,
            text: `Proposal to allocate DAO funds for ${type.toLowerCase()}.`,
            votesFor: 0,
            votesAgainst: 0,
            expiresDay: this.game.day + 5
        };
        f.dao.proposals.push(proposal);
        if (f.id === 'player') {
            this.game.notify(`🗳️ DAO PROPOSAL: A new initiative has been submitted to the ${f.dao.name}.`, "info");
        }
    }

    getOpinion(fromId, toId) {
        if (!this.relationships[fromId]) return 0;
        return this.relationships[fromId][toId] || 0;
    }

    modifyOpinion(fromId, toId, amount) {
        if (!this.relationships[fromId]) this.relationships[fromId] = {};
        const current = this.relationships[fromId][toId] || 0;
        this.relationships[fromId][toId] = Math.max(-100, Math.min(100, current + amount));

        // Roadmap Item 135: Log significant opinion changes to history
        if (Math.abs(amount) >= 5) {
            this.logHistory(fromId, `Relationship with ${toId} ${amount > 0 ? 'improved' : 'worsened'} by ${Math.abs(amount)} points.`);
        }

        // Notification for player
        if (toId === 'player') {
            const faction = this.factions[fromId];
            const change = amount > 0 ? 'improved' : 'worsened';
            const type = amount > 0 ? 'success' : 'warning';
            this.game.notify(`${faction.name} opinion has ${change} (${amount > 0 ? '+' : ''}${amount}).`, type);
        }
    }

    logHistory(factionId, event) {
        if (!this.factions[factionId]) return;
        if (!this.factions[factionId].history) this.factions[factionId].history = [];
        this.factions[factionId].history.push({
            day: this.game.day,
            event: event,
            timestamp: Date.now()
        });
        // Keep only last 20 events
        if (this.factions[factionId].history.length > 20) {
            this.factions[factionId].history.shift();
        }
    }

    // AI Logic: Each faction decides what to do based on personality and state
    applySanction(fromId, toId) {
        // Roadmap Item 226: Trade embargoes and sanctions
        if (!this.sanctions[fromId]) this.sanctions[fromId] = [];
        if (!this.sanctions[fromId].includes(toId)) {
            this.sanctions[fromId].push(toId);
            this.game.notify(`🚫 SANCTION: ${this.factions[fromId].name} has imposed trade sanctions on ${this.factions[toId].name}.`, "danger");
            this.logHistory(fromId, `Imposed trade sanctions on ${this.factions[toId].name}.`);
        }
    }

    isSanctioned(fromId, toId) {
        return this.sanctions[fromId] && this.sanctions[fromId].includes(toId);
    }

    updateAI() {
        // Roadmap Block 5: Galactic Senate & Espionage
        if (this.game.day % 60 === 0) {
            this.conveneSenate();
        }

        Object.values(this.factions).forEach(faction => {
            if (faction.type !== 'ai') return;

            // Roadmap Item 358: Dispute Logic
            if (Math.random() < 0.01) {
                this.updateDisputes(faction);
            }

            // Roadmap Item 226: Dynamic Sanction Logic
            Object.keys(this.factions).forEach(targetId => {
                if (targetId !== faction.id && this.getOpinion(faction.id, targetId) < -50) {
                    if (Math.random() < 0.05) this.applySanction(faction.id, targetId);
                }
            });

            // Roadmap Item 136: Strategic AI Decisions
            this.updateStrategy(faction);

            // Roadmap Item 163: Propaganda
            if (Math.random() < 0.01) {
                this.runPropaganda(faction);
            }

            // Random chance for event
            if (Math.random() < 0.0005) { // Very Rare tick
                this.generateEvent(faction);
            }
        });
    }

    updateStrategy(f) {
        // Simple logic for resource management and expansion
        if (!f.resources) f.resources = { credit: 1000, tech: 10 };
        
        // Income
        f.resources.credit += 10 * f.personality.trade;
        f.resources.tech += 1 * f.personality.tech;

        // Strategic Actions
        if (f.resources.credit > 5000 && f.personality.aggression > 0.7) {
            // High credits and aggression -> Expand or build military
            this.logHistory(f.id, "Strategic shift: Prioritizing military expansion and orbital control.");
            f.resources.credit -= 2000;
        } else if (f.resources.tech > 500) {
            // High tech -> Invest in advanced research
            this.logHistory(f.id, "Scientific breakthrough: Deep-space sensors upgraded.");
            f.resources.tech -= 300;
        }

        // Roadmap Item 151: AI-driven espionage and sabotage
        if (f.id !== 'player' && f.personality.aggression > 0.5 && Math.random() < 0.05) {
            this.executeEspionage(f);
        }
    }

    executeEspionage(f) {
        const targets = Object.keys(this.factions).filter(id => id !== f.id);
        const targetId = targets[Math.floor(Math.random() * targets.length)];
        const target = this.factions[targetId];

        const actions = [
            { name: 'Sabotage', cost: 500, effect: () => {
                if (targetId === 'player') {
                    const res = ['energy', 'minerals', 'food'][Math.floor(Math.random() * 3)];
                    const loss = Math.floor(Math.random() * 50 + 20);
                    this.game.resources[res] = Math.max(0, this.game.resources[res] - loss);
                    this.game.notify(`⚠️ SABOTAGE: ${f.name} agents sabotaged our ${res} stores! -${loss} ${res}`, "danger");
                }
                this.logHistory(f.id, `Successfully sabotaged ${target.name} infrastructure.`);
                this.modifyOpinion(targetId, f.id, -20);
            }},
            { name: 'Data Theft', cost: 300, effect: () => {
                if (targetId === 'player') {
                    const loss = Math.floor(Math.random() * 30 + 10);
                    this.game.resources.data = Math.max(0, this.game.resources.data - loss);
                    this.game.notify(`⚠️ DATA BREACH: ${f.name} stole research data! -${loss} Data`, "danger");
                }
                f.resources.tech += 50;
                this.logHistory(f.id, `Exfiltrated sensitive data from ${target.name}.`);
                this.modifyOpinion(targetId, f.id, -15);
            }},
            { name: 'Industrial Espionage', cost: 600, effect: () => {
                // Roadmap Item 221: Industrial espionage mechanics
                if (targetId === 'player') {
                    const bp = this.game.blueprints[Math.floor(Math.random() * this.game.blueprints.length)];
                    this.game.notify(`⚠️ INDUSTRIAL ESPIONAGE: ${f.name} has stolen the blueprints for ${bp.name}!`, "danger");
                }
                this.logHistory(f.id, `Successfully acquired industrial blueprints from ${target.name}.`);
                this.modifyOpinion(targetId, f.id, -25);
            }}
        ];

        const action = actions[Math.floor(Math.random() * actions.length)];
        if (f.resources.credit >= action.cost) {
            f.resources.credit -= action.cost;
            action.effect();
        }
    }

    runPropaganda(f) {
        // Roadmap Item 163: AI-driven propaganda machine
        if (f.id === 'player') return;
        
        const messages = [
            `"${f.name}: Shaping a better future for all pioneers."`,
            `"Why settle for less? Join the ${f.name} initiative today."`,
            `"Safety, Security, Prosperity. Only with ${f.name}."`,
            `"The stars belong to those who take them. ${f.name} leads the way."`
        ];

        const msg = messages[Math.floor(Math.random() * messages.length)];
        this.game.addChatterPost(f.name, msg, f.color || '#94a3b8', 'news');
        
        // Propaganda effect: small opinion shift in neutral/allied players
        Object.keys(this.factions).forEach(id => {
            if (id !== f.id && this.getOpinion(f.id, id) > -20) {
                this.modifyOpinion(id, f.id, 1);
            }
        });
    }

    generateEvent(faction) {
        const opinion = this.getOpinion(faction.id, 'player');

        // Simple logic for now
        if (opinion > 50 && Math.random() < 0.5) {
            this.game.notify(`${faction.name} sends a trade gift! (+100 Power)`, 'success');
            if (this.game.resources) this.game.resources.energy += 100;
        } else if (opinion < -50 && Math.random() < 0.3) {
            this.game.notify(`${faction.name} demands tribute! (-50 Power)`, 'danger');
            if (this.game.resources) this.game.resources.energy = Math.max(0, this.game.resources.energy - 50);
        }
    }
    triggerCouncilVote() {
        // Roadmap Item 357: Galactic UN Voting
        this.galacticCouncil.lastVoteDay = this.game.day;
        const resolutions = [
            { id: 'res_tax', text: 'Impose Galactic Luxury Tax (+10% Credit Cost)', effect: () => this.game.economyManager.inflationRate += 0.1 },
            { id: 'res_disarm', text: 'Fleet De-escalation Protocol (Reduced Damage)', effect: () => this.game.modifiers.militaryDamage = 0.8 },
            { id: 'res_research', text: 'Open Data Initiative (+20% Research)', effect: () => this.game.modifiers.researchOutput *= 1.2 }
        ];
        
        this.galacticCouncil.currentResolution = resolutions[Math.floor(Math.random() * resolutions.length)];
        this.game.notify(`🗳️ COUNCIL VOTE: Resolution "${this.galacticCouncil.currentResolution.text}" is on the floor.`, "info");
        
        // Automated outcome for now (could be interactive)
        if (Math.random() > 0.5) {
            this.galacticCouncil.currentResolution.effect();
            this.game.notify(`🗳️ VOTE PASSED: ${this.galacticCouncil.currentResolution.text} is now galactic law.`, "success");
        } else {
            this.game.notify(`🗳️ VOTE FAILED: Resolution ${this.galacticCouncil.currentResolution.id} was rejected.`, "warning");
        }
    }

    updateDisputes(f) {
        // Roadmap Item 358: Territorial Disputes
        const targets = Object.keys(this.factions).filter(id => id !== f.id);
        const targetId = targets[Math.floor(Math.random() * targets.length)];
        
        if (this.getOpinion(f.id, targetId) < 0) {
            const dispute = { factionA: f.id, factionB: targetId, sectorId: 'Sector 7G', intensity: 10 };
            this.disputes.push(dispute);
            if (targetId === 'player') {
                this.game.notify(`🏳️ DISPUTE: ${f.name} is challenging our claim to Sector 7G!`, "warning");
            }
        }
    }

    applyBorderControl(factionId, targetId) {
        // Roadmap Item 359: Border control and star-lane customs
        if (this.getOpinion(factionId, targetId) < -30) {
            this.game.notify(`🚫 BORDERS CLOSED: ${this.factions[factionId].name} has restricted transit for ${this.factions[targetId].name} vessels.`, "danger");
            return true;
        }
        return false;
    }

    // Roadmap Item 2501: Galactic Senate
    conveneSenate() {
        this.game.notify("🏛️ SENATE: The Galactic Senate has convened for a legislative session.", "info");
        const resolution = {
            id: `sen_${this.game.day}`,
            title: "Interstellar Resource Tithe",
            votes: { for: 0, against: 0 }
        };
        
        Object.keys(this.factions).forEach(fid => {
            const power = this.galacticUN.votingPower[fid] || 1;
            if (Math.random() > 0.5) resolution.votes.for += power;
            else resolution.votes.against += power;
        });

        const passed = resolution.votes.for > resolution.votes.against;
        if (passed) {
            this.game.notify("⚖️ LAW PASSED: Tithe Act implemented. Resource costs increased by 5%.", "warning");
            this.game.economyManager.inflationRate *= 1.05;
        } else {
            this.game.notify("⚖️ LAW REJECTED: The Tithe Act failed to pass the Senate.", "success");
        }
    }

    // Roadmap Item 2504: Espionage Protocols
    executeCovertOp(fromId, targetId, type) {
        const f = this.factions[fromId];
        const t = this.factions[targetId];
        this.logHistory(fromId, `Initiated ${type} operation against ${t.name}.`);
        
        if (Math.random() < 0.3) {
            this.game.notify(`🕵️ ESPIONAGE: ${f.name} agents were caught in ${t.name} space!`, "danger");
            this.modifyOpinion(targetId, fromId, -30);
        } else {
            this.logHistory(fromId, `Successfully completed ${type} mission.`);
        }
    }

    exportState() {
        return {
            factions: this.factions,
            relationships: this.relationships
        };
    }

    importState(data) {
        if (!data) return;
        if (data.factions) this.factions = data.factions;
        if (data.relationships) this.relationships = data.relationships;
    }
}

window.FactionManager = FactionManager;
