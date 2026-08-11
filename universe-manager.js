/**
 * UniverseManager.js
 * Manages the active multiverse, transitions between universes, and state tracking for each dimension.
 */

class UniverseManager {
    constructor(game) {
        this.game = game;
        this.universes = new Map(); // id -> { physics: PhysicsContext, state: Object, created: timestamp }
        this.activeUniverseId = 'prime';
        
        // Roadmap Item 373: Galactic history database
        this.galacticMap = {
            stars: [], // Array of { id, name, seed, position, type, discoveryStatus, megastructures: [] }
            fogOfWar: true,
            sectors: new Set(), // Discovered sector coordinates
            probes: [], // Roadmap Item 302: Active probes { id, targetId, progress, speed }
            satellites: [], // Roadmap Item 193: Satellite AI
            spaceStations: [], // Roadmap Item 185: AI-driven space station management
            wormholes: [], // Roadmap Item 307: Wormhole network { id, a: starId, b: starId, stable: bool }
            relays: [], // Roadmap Item 317: Deep space relay network { id, starId, range: float }
            smugglingRoutes: [], // Roadmap Item 360: Smuggling routes { id, starId, profitMult }
            refuelingStations: [], // Roadmap Item 361: Deep space refueling stations { id, starId }
            deepShipyards: [], // Roadmap Item 362: Orbital shipyards in deep space { id, starId }
            megastructures: [], // Roadmap Category 7: { id, starId, type, phase, efficiency }
            history: [], // Roadmap Item 373: Galactic history database
            discoveryLog: [] // Track naming rights
        };

        this.megaIntegrity = {}; // megaId -> integrity %
        this.galaxyViewState = {
            zoom: 4.25,
            panX: 0,
            panY: 0,
            selectedStarId: null,
            hoveredStarId: null,
            pointerId: null,
            dragging: false,
            dragMoved: false,
            lastX: 0,
            lastY: 0
        };
        this.galaxyResizeObserver = null;
        this._galaxyScreenStars = [];

        this.activePhysicsContext = PhysicsContext.PRESETS ? PhysicsContext.PRESETS.PRIME : { name: "Prime Universe", timeScale: 1.0, skyColor: 0x020617, fogDensity: 0.0015 };

        // Roadmap Category 8: Multiplayer & Social Hub
        this.multiplayer = {
            activeShard: 'alpha-1',
            instancing: true,
            serverMeshingActive: false,
            clans: [], // { id, name, members, warehouse: {}, reputations: {}, hierarchy: {}, alliances: [] }
            sharedWarehouses: new Map(),
            coopStructures: [],
            messages: [], // { from, to, content, timestamp }
            globalChat: [],
            socialHubs: [], // { id, type, starId, players: [] }
            housing: new Map(), // playerId -> { starId, decorations: [] }
            achievements: [], // Global social achievements
            events: [], // Active world events
            leaderboards: { wealth: [], tech: [], conquest: [] },
            contracts: [], // Player-created missions
            insurancePolicies: new Map(), // playerId -> policyData
            friendLists: new Map(), // playerId -> [friendIds]
            parties: new Map(), // partyId -> { leader, members: [] }
            marketListings: [],
            auctions: [],
            newsFeed: [],
            baseRatings: new Map(), // baseId -> { ratings: [], tips: 0 }
            reports: [],
            tournaments: [],
            mentors: new Map(), // mentorId -> [studentIds]
            emotes: ['wave', 'salute', 'dance', 'cheer'],
            trophyRooms: new Map(), // playerId -> [trophyIds]
            clanFlagships: [], // { clanId, shipId, location }
            wikiEntries: new Map(), // topic -> content
            alliances: [],
            translationCache: new Map(), // text -> translated
            moderationAI: { level: 1, sensitivity: 0.5 },
            offlineCollections: new Map(), // playerId -> resources
            clanTechTree: new Map(), // clanId -> techState
            sharedGrids: new Map(), // gridId -> { baseIds: [], capacity }
            callsigns: new Map(), // playerId -> callsign
            warMap: { activeFronts: [], control: new Map() }
        };

        // Initialize Prime Universe
        this.registerUniverse('prime', this.activePhysicsContext);
        this.generateGalacticSector(0, 0); // Generate home sector
        const homeStar = this.galacticMap.stars.find((star) => star.id === 'star_0,0_0') || this.galacticMap.stars[0];
        if (homeStar) {
            homeStar.discovered = true;
            homeStar.home = true;
            homeStar.linkedSystemId = String(this.game.currentSystemId || 'kepler_186f');
            this.galaxyViewState.selectedStarId = homeStar.id;
        }
    }

    // Roadmap Category 7: Megastructures
    buildMegastructure(starId, type) {
        const star = this.galacticMap.stars.find(s => s.id === starId);
        if (!star) return null;
        if (this.galacticMap.megastructures.some((mega) => mega.starId === starId && mega.type === type && mega.status !== 'destroyed')) {
            this.game.notify(`${type.replaceAll('_', ' ')} already exists in ${star.name}.`, 'warning');
            return null;
        }
        const costs = {
            dyson_swarm: { alloys: 600, circuits: 300, data: 250 },
            matrioshka_brain: { alloys: 900, circuits: 600, data: 700 },
            stellar_engine: { alloys: 1200, circuits: 500, data: 400 },
            logistics_hub: { alloys: 450, circuits: 220, data: 150 }
        };
        const cost = costs[type] || { alloys: 500, circuits: 250, data: 200 };
        if (!this.spendGameResources(cost, `Build ${type.replaceAll('_', ' ')}`)) return null;

        const newMega = {
            id: `mega_${type}_${starId}`,
            starId: starId,
            type: type,
            phase: 0,
            completion: 0,
            efficiency: 1.0,
            status: 'under_construction'
        };

        this.galacticMap.megastructures.push(newMega);
        if (!star.megastructures) star.megastructures = [];
        star.megastructures.push(newMega.id);

        this.game.notify(`🏗️ MEGASTRUCTURE: Construction of ${type.replace('_', ' ')} initiated in the ${star.name} system.`, "success");
        return newMega;
    }

    updateMegastructures(delta) {
        this.galacticMap.megastructures.forEach(mega => {
            if (mega.status === 'under_construction') {
                mega.completion += 0.001 * delta;
                if (mega.completion >= 1.0) {
                    mega.status = 'active';
                    mega.phase++;
                    this.game.notify(`✨ COMPLETION: ${mega.type.replace('_', ' ')} in ${mega.starId} is now operational!`, "success");
                }
            }

            // Roadmap Item 601: Dyson Swarm Efficiency
            if (mega.type === 'dyson_swarm' && mega.status === 'active') {
                const energyGen = 100 * mega.efficiency * delta;
                this.game.resources.energy += energyGen;
            }

            // Roadmap Item 604: Matrioshka Brain (Computation)
            if (mega.type === 'matrioshka_brain' && mega.status === 'active') {
                this.game.resources.data += 50 * mega.efficiency * delta;
            }

            // Roadmap Item 605: Stellar Engine (Physics manipulation)
            if (mega.type === 'stellar_engine' && mega.status === 'active') {
                // Logic for moving star system foundation
            }

            // Roadmap Item 606: Shkadov Thruster
            if (mega.type === 'shkadov_thruster' && mega.status === 'active') {
                // Directional star movement foundation
            }

            // Roadmap Item 607: Nicoll-Dyson Beam
            if (mega.type === 'nicoll_dyson_beam' && mega.status === 'active') {
                // System-scale weapon foundation
            }

            // Roadmap Items 611-614: Rotating Habitats
            if (['bishop_ring', 'stanford_torus', 'oneill_cylinder', 'bernal_sphere'].includes(mega.type) && mega.status === 'active') {
                // Population capacity boost foundation
                this.game.resources.credits += 10 * mega.efficiency * delta;
            }

            // Roadmap Item 618: Star-lifting
            if (mega.type === 'star_lifter' && mega.status === 'active') {
                this.game.resources.minerals += 20 * mega.efficiency * delta;
                this.game.resources.energy -= 5 * delta;
            }

            // Roadmap Item 619: Planet-breaking
            if (mega.type === 'planet_breaker' && mega.status === 'active') {
                this.game.resources.alloys += 50 * mega.efficiency * delta;
            }

            // Roadmap Item 620: Artificial Black Hole
            if (mega.type === 'artificial_black_hole' && mega.status === 'active') {
                this.game.resources.dark_matter += 1 * mega.efficiency * delta;
            }

            // Roadmap Item 621: Hawking Radiation energy harvesting
            if (mega.type === 'hawking_harvester' && mega.status === 'active') {
                this.game.resources.energy += 200 * mega.efficiency * delta;
            }

            // Roadmap Item 622: Penrose Process
            if (mega.type === 'penrose_sphere' && mega.status === 'active') {
                this.game.resources.energy += 500 * mega.efficiency * delta;
                this.game.resources.exotic_matter += 0.1 * mega.efficiency * delta;
            }

            // Roadmap Item 623: Wormhole stabilization gates
            if (mega.type === 'wormhole_stabilizer' && mega.status === 'active') {
                // Logic for keeping wormholes open/stable
            }

            // Roadmap Item 624: Intergalactic Star-Bridges
            if (mega.type === 'star_bridge' && mega.status === 'active') {
                // Connection to distant clusters/galaxies
            }

            // Roadmap Item 625: Galactic core containment field
            if (mega.type === 'core_containment' && mega.status === 'active') {
                // Stability for supermassive black hole systems
            }

            // Roadmap Item 626: Solar Flare Dampeners
            if (mega.type === 'flare_dampener' && mega.status === 'active') {
                // Reduces solar flare weather event frequency
            }

            // Roadmap Item 630: Dark matter antennas
            if (mega.type === 'dark_matter_antenna' && mega.status === 'active') {
                this.game.resources.dark_matter += 2 * mega.efficiency * delta;
            }

            // Roadmap Item 631: Zero-Point energy extraction
            if (mega.type === 'zpe_extractor' && mega.status === 'active') {
                this.game.resources.energy += 1000 * mega.efficiency * delta;
            }

            // Roadmap Item 633: Cosmic String harvesting
            if (mega.type === 'string_harvester' && mega.status === 'active') {
                this.game.resources.exotic_matter += 0.5 * mega.efficiency * delta;
            }

            // Roadmap Item 634: Multi-planet logistics hubs
            if (mega.type === 'logistics_hub' && mega.status === 'active') {
                // Foundation for trade efficiency bonuses
            }

            // Roadmap Item 635: System-wide shield generators
            if (mega.type === 'system_shield' && mega.status === 'active') {
                // Blocks hostile incursions foundation
            }

            // Roadmap Item 636: Planetary cloaking fields
            if (mega.type === 'planetary_cloak' && mega.status === 'active') {
                // Hides system from sensor pings foundation
            }

            // Roadmap Item 641: Stellar Farming
            if (mega.type === 'stellar_farm' && mega.status === 'active') {
                this.game.resources.energy += 300 * mega.efficiency * delta;
                mega.efficiency += 0.0001 * delta; // Learning optimization
            }

            // Roadmap Item 643: Ecumenopolis Management
            if (mega.type === 'ecumenopolis' && mega.status === 'active') {
                this.game.resources.credits += 100 * mega.efficiency * delta;
                // Massive population capacity foundation
            }

            // Roadmap Item 645: Planetary core tapping
            if (mega.type === 'core_tap' && mega.status === 'active') {
                this.game.resources.energy += 150 * mega.efficiency * delta;
                // Risk of tectonic instability foundation
            }

            // Roadmap Item 646: Magnetic "Web" power grids
            if (mega.type === 'magnetic_web' && mega.status === 'active') {
                this.game.resources.energy += 50 * mega.efficiency * delta;
                // Wireless power distribution foundation
            }

            // Roadmap Item 648: Continental-scale terraforming engines
            if (mega.type === 'terraforming_engine' && mega.status === 'active') {
                // Accelerates terraforming progress foundation
            }

            // Roadmap Item 649: Global weather-control satellites
            if (mega.type === 'weather_sat_network' && mega.status === 'active') {
                // Prevents negative weather events foundation
            }

            // Roadmap Item 651: Biological megastructures
            if (mega.type === 'bio_mega' && mega.status === 'active') {
                // Living planet foundation
            }

            // Roadmap Item 653: Matrioshka "Layer" management
            if (mega.type === 'matrioshka_brain' && mega.status === 'active') {
                // Efficiency increases with layers foundation
            }

            // Roadmap Item 656: Time-capsule megastructures
            if (mega.type === 'time_capsule' && mega.status === 'active') {
                // Preservation of state across game resets foundation
            }

            // Roadmap Item 660: Self-replicating factory networks
            if (mega.type === 'von_neumann_network' && mega.status === 'active') {
                // Automatic construction foundation
            }

            // Roadmap Item 667: Coolant fluid logistics
            if (mega.type === 'coolant_system' && mega.status === 'active') {
                // Reduces thermal stress on Dyson structures
            }

            // Roadmap Item 677: Interstellar relay laser-comms
            if (mega.type === 'laser_relay' && mega.status === 'active') {
                this.game.resources.data += 200 * mega.efficiency * delta;
            }

            // Roadmap Item 682: Sabotage
            if (mega.type === 'sabotage_module' && mega.status === 'active') {
                // Combat/Reputation logic foundation
            }

            // Roadmap Item 683: Diplomatic hub
            if (mega.type === 'diplomatic_hub' && mega.status === 'active') {
                // Neutral ground for galactic summits foundation
            }

            // Roadmap Item 685: Museum
            if (mega.type === 'galactic_museum' && mega.status === 'active') {
                // Preserving the legacy of extinct civilizations foundation
            }

            // Roadmap Item 686: Hall of Fame
            if (mega.type === 'hall_of_fame' && mega.status === 'active') {
                // Honoring the greatest pioneers of the cluster foundation
            }

            // Roadmap Item 688: Stabilizing white-hole ruptures
            if (mega.type === 'white_hole_stabilizer' && mega.status === 'active') {
                // Energy generation from stable white holes
                this.game.resources.energy += 5000 * mega.efficiency * delta;
            }

            // Roadmap Item 690: Megastructure Insurance
            if (mega.type === 'insurance_bureau' && mega.status === 'active') {
                // Automatic repair fund foundation
            }

            // Roadmap Item 691: Financing
            if (mega.type === 'finance_institute' && mega.status === 'active') {
                // Capital injection for megastructure construction foundation
            }

            // Roadmap Item 662: Megastructure "Maintenance" challenges
            if (mega.status === 'active') {
                mega.integrity = (mega.id in this.megaIntegrity) ? this.megaIntegrity[mega.id] : 100;
                mega.integrity -= 0.0005 * delta;
                this.megaIntegrity[mega.id] = mega.integrity;
                
                if (mega.integrity < 50 && Math.random() < 0.001) {
                    this.game.notify(`⚠️ MAINTENANCE: ${mega.type.replace('_',' ')} in ${mega.starId} requires structural repairs.`, "warning");
                }
            }

            // Roadmap Item 665: Energy distribution efficiency puzzles
            if (mega.status === 'active') {
                mega.efficiency = Math.max(0.1, 1.0 - (100 - mega.integrity) * 0.01);
            }

            // Roadmap Item 666: Waste heat radiating arrays
            if (mega.type === 'heat_radiator' && mega.status === 'active') {
                // Stabilizes thermal levels of nearby megastructures foundation
            }

            // Roadmap Item 661: Swarm optimization
            if (mega.type === 'dyson_swarm' && mega.status === 'active' && mega.efficiency < 2.0) {
                mega.efficiency += 0.0002 * delta; // Swarm learns and optimizes
            }
        });
    }

    // --- CATEGORY 8: MULTIPLAYER & SOCIAL HUB (701-800) ---

    startCoopStructure(type, clanId) {
        const struct = {
            id: `coop_${Date.now()}`,
            type: type,
            clanId: clanId,
            contributors: [],
            progress: 0
        };
        this.multiplayer.coopStructures.push(struct);
        this.game.notify(`🏗️ CO-OP: Collaborative construction project initiated by clan.`, "success");
    }

    // Roadmap Item 707: Multi-crew Ship Control
    assignPlayerToStation(shipId, stationType, playerId) {
        this.game.notify(`👥 MULTI-CREW: Player ${playerId} assigned to ${stationType} on ${shipId}.`, "info");
    }

    // Roadmap Item 708: Spatial Voice Chat
    setVoiceSpatialEffect(playerId, position) {
        console.log(`[Multiplayer] Updating spatial audio for player ${playerId} at ${position.x}, ${position.y}, ${position.z}`);
    }

    // Roadmap Item 709: In-game mail
    sendMessage(from, to, content) {
        const msg = { from, to, content, timestamp: Date.now() };
        this.multiplayer.messages.push(msg);
        this.game.notify(`📩 MAIL: New message from ${from}.`, "info");
    }

    sendGlobalChat(sender, content) { // 710
        this.multiplayer.globalChat.push({ sender, content, timestamp: Date.now() });
        if (this.multiplayer.globalChat.length > 50) this.multiplayer.globalChat.shift();
    }

    switchShard(shardId) { // 701-703
        this.multiplayer.activeShard = shardId;
        this.game.notify(`🌐 NETWORK: Handover to shard ${shardId} complete.`, "info");
    }

    toggleServerMeshing(active) { // 703
        this.multiplayer.serverMeshingActive = active;
        this.game.notify(`🌐 NETWORK: Server meshing ${active ? 'enabled' : 'disabled'}.`, "info");
    }

    createClan(name, owner) { // 704
        const clan = {
            id: `clan_${Date.now()}`,
            name: name,
            members: [owner],
            warehouse: { alloys: 0, energy: 0, circuits: 0 },
            techTree: {},
            bank: 0,
            alliances: []
        };
        this.multiplayer.clans.push(clan);
        this.game.notify(`🤝 CLAN: "${name}" established.`, "success");
        return clan;
    }

    depositToClanWarehouse(clanId, resources) { // 705
        const clan = this.multiplayer.clans.find(c => c.id === clanId);
        if (clan) {
            for (const res in resources) clan.warehouse[res] = (clan.warehouse[res] || 0) + resources[res];
            this.game.notify(`📦 CLAN: Resources deposited to vault.`, "success");
        }
    }

    listOnAuction(item, minBid) { // 712
        this.game.notify(`⚖️ AUCTION: ${item} listed for ${minBid} Cr.`, "info");
    }

    initiateTrade(targetPlayerId) { // 713
        this.game.notify(`🤝 TRADE: Connection requested with ${targetPlayerId}.`, "info");
    }

    createEscrowTransaction(playerA, playerB, resources) { // 714
        const transactionId = `escrow_${Date.now()}`;
        this.multiplayer.contracts.push({ id: transactionId, from: playerA, to: playerB, assets: resources, status: 'locked' });
        this.game.notify(`🤝 ESCROW: Secure transaction ${transactionId} initiated.`, "info");
    }

    claimSystem(starId, clanId) { // 715
        const star = this.galacticMap.stars.find(s => s.id === starId);
        if (star) {
            star.ownerClanId = clanId;
            this.game.notify(`🚩 TERRITORY: ${star.name} under clan control.`, "warning");
        }
    }

    startCTFEvent(starId) { // 716
        this.game.notify(`🏆 EVENT: Global 'Capture the Planet' trial in ${starId}.`, "danger");
    }

    runElection() { // 717
        this.game.notify("🗳️ ELECTION: Galactic Council seats are now open for voting!", "info");
    }

    proposeLaw(title, effect) { // 718
        this.game.notify(`📜 PROPOSAL: New regulation "${title}" submitted.`, "info");
    }

    updatePlayerReputation(playerId, amount, factionId) { // 721
        this.game.notify(`⭐ REPUTATION: Standing with ${factionId} updated.`, "info");
    }

    assignMentor(mentorId, studentId) { // 722
        if (!this.multiplayer.mentors.has(mentorId)) this.multiplayer.mentors.set(mentorId, []);
        this.multiplayer.mentors.get(mentorId).push(studentId);
        this.game.notify(`👨‍🏫 MENTOR: Player ${mentorId} is now guiding ${studentId}.`, "success");
    }

    enterSocialHub(hubId) { // 723
        this.game.notify(`🍻 SOCIAL: Entering hub ${hubId}.`, "info");
    }

    playEmote(playerId, emoteId) { // 724
        this.game.notify(`🎭 EMOTE: Player ${playerId} performed ${emoteId}.`, "info");
    }

    updatePlayerAvatar(playerId, dnaProfile) { // 725
        this.game.notify(`👤 AVATAR: Player ${playerId} updated.`, "info");
    }

    customizeHousing(playerId, decorationId) { // 726
        if (!this.multiplayer.housing.has(playerId)) this.multiplayer.housing.set(playerId, { decorations: [] });
        this.multiplayer.housing.get(playerId).decorations.push(decorationId);
        this.game.notify("🏠 HOUSING: Interior updated.", "success");
    }

    addTrophy(playerId, trophyId) { // 727
        if (!this.multiplayer.trophyRooms.has(playerId)) this.multiplayer.trophyRooms.set(playerId, []);
        this.multiplayer.trophyRooms.get(playerId).push(trophyId);
        this.game.notify("🏆 TROPHY: New accomplishment added.", "success");
    }

    deployClanFlagship(clanId, shipId, starId) { // 728
        this.multiplayer.clanFlagships.push({ clanId, shipId, location: starId });
        this.game.notify("🚩 FLAGSHIP: Clan command vessel arrived.", "warning");
    }

    contributeToClanResearch(clanId, techId, dataAmount) { // 729
        const clanTech = this.multiplayer.clanTechTree.get(clanId) || {};
        clanTech[techId] = (clanTech[techId] || 0) + dataAmount;
        this.multiplayer.clanTechTree.set(clanId, clanTech);
        this.game.notify(`🧬 RESEARCH: Contributed to clan project [${techId}].`, "success");
    }

    startJointExpedition(partyId, targetSystemId) { // 730
        this.game.notify(`🚀 EXPEDITION: Party ${partyId} jump to ${targetSystemId}.`, "info");
    }

    triggerWorldBoss(starId, bossType) { // 731
        this.game.notify(`👹 WORLD BOSS: A massive ${bossType} appeared in ${starId}!`, "danger");
    }

    startRankedSeason(seasonName) { // 733
        this.game.notify(`🏆 RANKED: Season "${seasonName}" begun.`, "success");
    }

    updateLeaderboards() { // 734
        this.game.notify("📊 LEADERBOARDS: Rankings updated.", "info");
    }

    createPlayerContract(creatorId, title, description, reward) { // 735
        this.multiplayer.contracts.push({ id: `contract_${Date.now()}`, creatorId, title, description, reward, status: 'open' });
        this.game.notify(`📜 CONTRACT: "${title}" posted.`, "info");
    }

    depositToClanBank(clanId, amount) { // 736
        const clan = this.multiplayer.clans.find(c => c.id === clanId);
        if (clan) {
            clan.bank = (clan.bank || 0) + amount;
            this.game.notify(`💰 BANK: Deposited ${amount} credits.`, "success");
        }
    }

    purchaseInsurance(playerId, type) { // 737
        this.multiplayer.insurancePolicies.set(playerId, { type, expiry: this.game.day + 30 });
        this.game.notify("🛡️ INSURANCE: Asset protection activated.", "success");
    }

    applyGroupBuff(partyId, buffType) { // 738
        this.game.notify(`💠 SYNERGY: [${buffType}] active for party ${partyId}.`, "success");
    }

    processReferral(playerId, referredId) { // 739
        this.game.notify("💠 REWARD: Referral validated.", "success");
    }

    toggleStreamMode(playerId, active) { // 740
        this.game.notify(`🎥 STREAM: Galactic broadcast ${active ? 'ON' : 'OFF'}.`, "info");
    }

    takeSnapshot() { // 741
        this.game.notify("📸 PHOTO: Orbital capture saved.", "success");
    }

    publishPlayerLog(playerId, content) { // 742
        this.game.notify(`📜 LOG: Entry published by Pioneer ${playerId}.`, "info");
    }

    updateWiki(topic, content) { // 743
        this.multiplayer.wikiEntries.set(topic, content);
        this.game.notify(`📖 WIKI: Updated "${topic}".`, "info");
    }

    shareMapMarker(playerId, starId, label) { // 744
        this.game.notify(`📍 SHARED MARKER: Player ${playerId} marked ${label}.`, "info");
    }

    addFriend(playerId, friendId) { // 745
        if (!this.multiplayer.friendLists.has(playerId)) this.multiplayer.friendLists.set(playerId, []);
        this.multiplayer.friendLists.get(playerId).push(friendId);
        this.game.notify("👥 FRIENDS: Contact added.", "success");
    }

    inviteToParty(playerId, targetId) { // 746
        this.game.notify(`👥 PARTY: Invite sent to Pioneer ${targetId}.`, "info");
    }

    updateClanPermissions(clanId, roleId, permissions) { // 747
        this.game.notify("🛡️ PERMISSIONS: Protocols updated.", "info");
    }

    formAlliance(clanIdA, clanIdB) { // 748
        const clanA = this.multiplayer.clans.find(c => c.id === clanIdA);
        const clanB = this.multiplayer.clans.find(c => c.id === clanIdB);
        if (clanA && clanB) {
            clanA.alliances.push(clanIdB);
            clanB.alliances.push(clanIdA);
            this.game.notify(`🤝 ALLIANCE: ${clanA.name} and ${clanB.name} allied.`, "success");
        }
    }

    initiateHostileTakeover(targetClanId) { // 749
        this.game.notify(`⚔️ TAKEOVER: Attempting subversion of clan ${targetClanId}!`, "danger");
    }

    postNews(publisherId, headline, content) { // 751
        this.multiplayer.newsFeed.push({ publisherId, headline, content, timestamp: Date.now() });
        this.game.notify(`📰 NEWS: ${headline}`, "info");
    }

    broadcastAudio(stationName, trackId) { // 752
        this.game.notify(`📻 RADIO: Now playing ${trackId} on ${stationName}.`, "info");
    }

    projectHologram(content, targetSystemId) { // 753
        this.game.notify(`📟 HOLO: Projection sent to ${targetSystemId}.`, "info");
    }

    startSocialMiniGame(gameType, players) { // 754
        this.game.notify(`🎮 GAME: ${gameType} started.`, "info");
    }

    registerPetForShow(petId, category) { // 755
        this.game.notify(`🐾 EVENTS: Xenodex ${petId} registered.`, "success");
    }

    enterShipContest(designId) { // 756
        this.game.notify("🏆 CONTEST: Vessel submitted.", "success");
    }

    startBaseTour(baseId) { // 757
        this.game.notify("🏗️ TOUR: Starting guided tour.", "info");
    }

    rateBase(baseId, rating, tipAmount = 0) { // 758
        if (!this.multiplayer.baseRatings.has(baseId)) this.multiplayer.baseRatings.set(baseId, { ratings: [], tips: 0 });
        const data = this.multiplayer.baseRatings.get(baseId);
        data.ratings.push(rating);
        data.tips += tipAmount;
        this.game.notify("⭐ RATING: Feedback submitted.", "success");
    }

    sendTip(playerId, targetId, amount) { // 759
        this.game.notify(`💰 TIP: ${amount} credits sent to Pioneer ${targetId}.`, "success");
    }

    reportPlayer(playerId, reason) { // 760
        this.multiplayer.reports.push({ targetId: playerId, reason, timestamp: Date.now() });
        this.game.notify("🛡️ MODERATION: Report submitted.", "warning");
    }

    summonToCourt(playerId, charges) { // 761
        this.game.notify(`⚖️ COURT: Pioneer ${playerId} summoned.`, "warning");
    }

    dispatchPeacekeeper(targetSystemId) { // 762
        this.game.notify(`🛡️ SECURITY: Detachment responding to ${targetSystemId}.`, "warning");
    }

    challengeToDuel(targetPlayerId) { // 764
        this.game.notify(`⚔️ DUEL: Challenge sent to ${targetPlayerId}.`, "warning");
    }

    hostTournament(name, type) { // 765
        this.multiplayer.tournaments.push({ id: `tourney_${Date.now()}`, name, type, participants: [], status: 'open' });
        this.game.notify(`🏆 TOURNAMENT: "${name}" open.`, "success");
    }

    registerForAcademy(playerId, academyType) { // 766
        this.game.notify(`🏫 ACADEMY: Enrolled in ${academyType}.`, "info");
    }

    teachSkill(mentorId, studentId, skillId) { // 767
        this.game.notify(`🎓 MENTOR: Guiding student in [${skillId}].`, "success");
    }

    setGlobalTerraformingGoal(targetStat, targetValue) { // 768
        this.game.notify(`🌍 GOAL: Global objective - ${targetStat} to ${targetValue}%.`, "success");
    }

    startNamingAuction(starId) { // 769
        this.game.notify(`⚖️ AUCTION: Naming rights for ${starId} open.`, "info");
    }

    syncPlatformState(playerId, platform) { // 773
        console.log(`[Multiplayer] Sync state.`);
    }

    toggleControllerMode(active) { // 774
        this.game.notify(`🎮 INPUT: Controller mode ${active ? 'ON' : 'OFF'}.`, "info");
    }

    toggleSocialAccessibility(type, active) { // 775
        this.game.notify(`👤 ACCESSIBILITY: [${type}] ${active ? 'ON' : 'OFF'}.`, "info");
    }

    translateChat(text, targetLang) { // 776
        return `[${targetLang}] ${text}`;
    }

    moderateContent(text) { // 777
        return true;
    }

    setOfflineShadow(playerId, mode) { // 778
        this.game.notify(`👤 SHADOW: Neural-copy set to [${mode}].`, "info");
    }

    collectOfflineResources(playerId) { // 779
        this.game.notify("📦 OFFLINE: Resources gathered.", "success");
    }

    unlockClanTech(clanId, techId) { // 780
        this.game.notify(`🧬 CLAN TECH: ${techId} unlocked.`, "success");
    }

    linkGrids(baseIdA, baseIdB) { // 781
        this.game.notify("⚡ GRID: Bases linked.", "success");
    }

    initiateTruckingContract(originBaseId, targetBaseId, resources) { // 782
        this.game.notify("🚚 LOGISTICS: Haulage dispatched.", "info");
    }

    dispatchFerry(routeId) { // 783
        this.game.notify("🚢 FERRY: Departing.", "info");
    }

    assignApartment(playerId, stationId) { // 784
        this.game.notify(`🏠 HOUSING: Apartment assigned at ${stationId}.`, "success");
    }

    setClanUniform(clanId, uniformData) { // 785
        this.game.notify("🎨 CLAN: Uniform applied.", "info");
    }

    assignCallsign(playerId, callsign) { // 786
        this.multiplayer.callsigns.set(playerId, callsign);
        this.game.notify(`📡 COMMS: Callsign updated to [${callsign}].`, "info");
    }

    submitLoreItem(title, content) { // 787
        this.game.notify(`📜 LORE: Fragment "${title}" submitted.`, "success");
    }

    toggleVoiceToText(active) { // 788
        this.game.notify(`📡 VOICE-TO-TEXT: ${active ? 'ON' : 'OFF'}.`, "info");
    }

    toggleLowBandwidth(active) { // 789
        this.game.notify(`📶 NETWORK: Low-BW ${active ? 'ON' : 'OFF'}.`, "warning");
    }

    generateClanMission(clanId, type) { // 790
        this.game.notify(`📋 MISSION: Issued to clan.`, "warning");
    }

    awardGroupXP(partyId, amount) { // 791
        this.game.notify(`💠 XP: Party received experience.`, "success");
    }

    shareDiscoveryCredit(starId, playerIds) { // 792
        this.game.notify("💠 CREDIT: Credentials shared.", "success");
    }

    claimStargate(starId, clanId) { // 793
        this.game.notify(`🌀 GATEWAY: Control seized.`, "warning");
    }

    setAllyTollFree(clanId, starGateId) { // 794
        this.game.notify(`💠 DIPLOMACY: Toll-free passage granted.`, "success");
    }

    setEnemyBlacklist(clanId, systemId) { // 795
        this.game.notify(`🚫 BLOCK: System restricted.`, "danger");
    }

    updateWarMap(sectorKey, controllingClanId) { // 796
        this.multiplayer.warMap.control.set(sectorKey, controllingClanId);
    }

    triggerResourceWar(systemId) { // 797
        this.game.notify(`⚔️ CRISIS: Mobilization in ${systemId}.`, "danger");
    }

    triggerFactionAwakening(factionId) { // 798
        this.game.notify(`🌋 CRISIS: Awakening in [${factionId}]!`, "danger");
    }

    contributeToCommunityProject(projectId, alloys) { // 799
        this.game.notify(`🏗️ PROJECT: Contributed ${alloys} alloys.`, "success");
    }

    setEndgamePath(path) { // 800
        this.multiplayer.endgamePath = path;
        this.game.notify(`🌌 DESTINY: Path of ${path.toUpperCase()} chosen.`, "success");
    }

    // --- EXPLORATION & GALAXY UTILITIES ---

    getGameCredits() {
        return Number.isFinite(this.game?.resources?.credits) ? this.game.resources.credits : 0;
    }

    spendGameResources(cost, label = 'Operation') {
        if (!this.game?.resources) return false;
        const missing = [];
        for (const [key, raw] of Object.entries(cost || {})) {
            const need = Math.max(0, Number(raw) || 0);
            const have = Number(this.game.resources[key] || 0);
            if (have + 1e-9 < need) missing.push(`${key} ${Math.floor(have)}/${Math.ceil(need)}`);
        }
        if (missing.length) {
            this.game.notify(`${label}: insufficient resources (${missing.join(', ')}).`, 'warning');
            return false;
        }
        for (const [key, raw] of Object.entries(cost || {})) {
            this.game.resources[key] = Math.max(0, Number(this.game.resources[key] || 0) - Math.max(0, Number(raw) || 0));
        }
        this.game.updateResourceUI?.();
        return true;
    }

    addRelayStation(starId) {
        const star = this.galacticMap.stars.find((entry) => entry.id === starId);
        if (!star) return null;
        const existing = this.galacticMap.relays.find((entry) => entry.starId === starId);
        if (existing) {
            this.game.notify(`A deep-space relay is already active at ${star.name}.`, 'info');
            return existing;
        }
        if (!this.spendGameResources({ alloys: 40, circuits: 25, data: 20 }, 'Deploy relay')) return null;
        const id = `relay_${Date.now()}`;
        const relay = { id, starId, range: 200, status: 'operational' };
        this.galacticMap.relays.push(relay);
        this.game.notify(`📡 RELAY: Deep-space communications relay established at ${star.name}.`, 'success');
        this.game.resources.data = (this.game.resources.data || 0) + 40;
        this.game.updateResourceUI?.();
        this.renderGalaxyMap();
        return relay;
    }

    addSmugglingRoute(starId) {
        const star = this.galacticMap.stars.find(s => s.id === starId);
        if (!star || !star.isNebula) {
            this.game.notify('Smuggling routes can only be established in nebula systems.', 'warning');
            return null;
        }
        if (this.galacticMap.smugglingRoutes.some((entry) => entry.starId === starId)) return null;
        if (!this.spendGameResources({ credits: 250, data: 25 }, 'Establish smuggling route')) return null;
        const route = { id: `smuggle_${Date.now()}`, starId, profitMult: 2.5 };
        this.galacticMap.smugglingRoutes.push(route);
        this.game.notify(`🕶️ SMUGGLING: Hidden route established in ${star.name}.`, 'success');
        this.renderGalaxyMap();
        return route;
    }

    addRefuelingStation(starId) {
        const star = this.galacticMap.stars.find((entry) => entry.id === starId);
        if (!star) return null;
        const existing = this.galacticMap.refuelingStations.find((entry) => entry.starId === starId);
        if (existing) return existing;
        if (!this.spendGameResources({ alloys: 60, circuits: 20, credits: 150 }, 'Deploy refueling station')) return null;
        const station = { id: `fuel_${Date.now()}`, starId, status: 'operational' };
        this.galacticMap.refuelingStations.push(station);
        this.game.notify(`⛽ REFUELING: Deep-space station established at ${star.name}.`, 'success');
        this.renderGalaxyMap();
        return station;
    }

    addDeepShipyard(starId) {
        const star = this.galacticMap.stars.find((entry) => entry.id === starId);
        if (!star) return null;
        const existing = this.galacticMap.deepShipyards.find((entry) => entry.starId === starId);
        if (existing) return existing;
        if (!this.spendGameResources({ alloys: 180, circuits: 80, credits: 400 }, 'Deploy deep shipyard')) return null;
        const shipyard = { id: `shipyard_${Date.now()}`, starId, status: 'operational' };
        this.galacticMap.deepShipyards.push(shipyard);
        this.game.notify(`🏗️ DEEP SHIPYARD: Mobile construction hub deployed at ${star.name}.`, 'success');
        this.renderGalaxyMap();
        return shipyard;
    }

    addDefenseGrid(starId) {
        const station = this.galacticMap.spaceStations.find(s => s.starId === starId);
        if (station) {
            if (!this.spendGameResources({ alloys: 100, circuits: 80 }, 'Install defense grid')) return null;
            station.defenseGrid = { level: 1, health: 500, active: true };
            this.game.notify(`🛡️ DEFENSE GRID: Orbital protection established at ${starId}.`, 'success');
            this.renderGalaxyMap();
            return station.defenseGrid;
        }
        this.game.notify('No space station present to install defense grid!', 'warning');
        return null;
    }

    performSensorPing() {
        // Roadmap Item 364: Long-range sensor pings
        if (this.game.resources.energy < 50) {
            this.game.notify("Insufficient energy for sensor ping!", "warning");
            return;
        }

        this.game.resources.energy -= 50;
        this.game.updateResourceUI?.();
        this.game.notify("📡 SENSOR PING: Emitting high-energy pulse across the sector...", "info");

        // Reveal a few undiscovered stars in the map
        const undiscovered = this.galacticMap.stars.filter(s => !s.discovered);
        for (let i = 0; i < 3; i++) {
            if (undiscovered.length > 0) {
                const idx = Math.floor(Math.random() * undiscovered.length);
                const star = undiscovered.splice(idx, 1)[0];
                this.discoverStar(star.id);
            }
        }
        
        if (this.onSensorPing) this.onSensorPing();
        this.renderGalaxyMap();
    }

    stabilizeStar(starId) {
        // Roadmap Item 398: Stabilizing dying stars
        const star = this.galacticMap.stars.find(s => s.id === starId);
        if (!star) return;

        if (this.game.resources.energy < 1000 || this.game.resources.data < 500) {
            this.game.notify("Insufficient Energy/Data to stabilize star!", "warning");
            return;
        }

        this.game.resources.energy -= 1000;
        this.game.resources.data -= 500;

        if (star.type === 'Supernova Precursor') {
            star.type = 'G-Type'; // Reset to stable
            star.hazards = [];
            this.game.notify(`✨ STABILIZATION: ${star.name} has been returned to a stable G-Type sequence.`, "success");
        } else {
            star.hazards = [];
            this.game.notify(`✨ STABILIZATION: Magnetic fields and radiation belts around ${star.name} have been normalized.`, "success");
        }
        
        this.renderGalaxyMap();
    }

    // Roadmap Item 308: Intergalactic Travel
    initiateIntergalacticJump() {
        const cost = { credits: 10000, energy: 5000, dark_matter: 10 };
        if (this.game.resources.credits < cost.credits || this.game.resources.energy < cost.energy) {
            this.game.notify("Insufficient resources for intergalactic jump!", "danger");
            return;
        }

        // Create a completely new galaxy sector very far away
        const gx = Math.floor(Math.random() * 10000 + 10000);
        const gy = Math.floor(Math.random() * 10000 + 10000);
        
        this.game.resources.credits -= cost.credits;
        this.game.resources.energy -= cost.energy;
        this.game.notify(`🚀 INTERGALACTIC JUMP: Leaving the home galaxy...`, "info");
        
        setTimeout(() => {
            this.generateGalacticSector(gx, gy);
            const newStar = this.galacticMap.stars.find(s => s.id.startsWith(`star_${gx},${gy}`));
            if (newStar) {
                this.discoverStar(newStar.id);
                this.game.warpToSystem({ id: newStar.id, seed: newStar.seed });
                this.game.notify(`✨ ARRIVAL: Welcome to Galaxy Cluster ${gx}:${gy}`, "success");
            }
        }, 3000);
    }

    generateStarName(seed) {
        const prefixes = ['Nova', 'Kepler', 'Gliese', 'Alpha', 'Beta', 'Sigma', 'Zeta', 'Omega'];
        const suffixes = ['Prime', 'Minor', 'Major', 'System', 'Point', 'Void'];
        const pIdx = Math.floor(seed % prefixes.length);
        const sIdx = Math.floor((seed / 10) % suffixes.length);
        return `${prefixes[pIdx]}-${Math.floor(seed % 1000)} ${suffixes[sIdx]}`;
    }

    getHazardsForType(type) {
        // Roadmap Item 305: Unique Hazards
        if (type === 'Black Hole') return ['Spacetime Distortion', 'Extreme Gravity'];
        if (type === 'White Hole') return ['Exotic Energy Discharge', 'Gravitational Repulsion']; // Item 367
        if (type === 'Neutron Star') return ['Extreme Density', 'Magnetic Shearing']; // Item 368
        if (type === 'Supernova Precursor') return ['Unstable Core', 'Intense Gamma Radiation']; // Item 369
        if (type === 'Pulsar') return ['High Radiation', 'Electromagnetic Interference'];
        if (type === 'Quasar') return ['Gravitational Shear', 'Luminous Overload'];
        return [];
    }

    discoverStar(starId) {
        const star = this.galacticMap.stars.find(s => s.id === starId);
        if (star && !star.discovered) {
            star.discovered = true;
            this.game.notify(`New System Discovered: ${star.name}`, "success");
            this.game.recordColonyEvent(`Astronomers discovered the ${star.name} system.`, 0.6);

            // Roadmap Item 373: Log to History
            this.galacticMap.history.push({
                day: this.game.day,
                event: `Discovery of ${star.name} (${star.type})`,
                coordinates: `${star.position.x.toFixed(0)}, ${star.position.y.toFixed(0)}`
            });

            // Roadmap Item 375: Naming Rights are now exercised explicitly from the Galactic Chart.
            if (Math.random() < 0.2) {
                star.namingRights = true;
                this.game.notify(`Naming rights earned for ${star.name}. Open the Galactic Chart to rename it.`, 'info');
            }

            // Roadmap Item 318: Multiverse Breach Discovery
            if (star.type === 'Black Hole' && Math.random() < 0.1) {
                this.game.notify("🌌 MULTIVERSE BREACH: Sensors detected a localized spatial instability near the event horizon!", "warning");
                this.game.recordColonyEvent("A multiverse breach was discovered near a supermassive black hole.", 0.9);
                // Unlocks Multiverse Breach missions or travel
            }

            // Roadmap Item 341: Zone of Silence Notification
            if (star.zoneOfSilence) {
                this.game.notify("🔇 ZONE OF SILENCE: All external comms and sensor feeds are flatlining in this sector.", "danger");
            }

            // Roadmap Item 343: Living Planet Notification
            if (star.hasLivingPlanet) {
                this.game.notify("🌿 LIVING PLANET: Bio-scans show a planet with a unified planetary consciousness!", "success");
            }

            // Roadmap Item 344: Artificial Planetoid Notification
            if (star.artificialPlanetoid) {
                this.game.notify("🛰️ ARTIFICIAL WORLD: Sensors detected a moon-sized structure of synthetic origin.", "warning");
            }

            // Roadmap Item 353: Xeno-archaeology Notification
            if (star.hasXenoArchSite) {
                this.game.notify("🏛️ XENO-ARCHAEOLOGY: Planetary scans reveal massive subterranean ruins of an unknown civilization!", "success");
                this.game.recordColonyEvent(`Xeno-archaeology site discovered in the ${star.name} system.`, 0.8);
            }

            // Roadmap Item 354: Ancient Star-map Notification
            if (star.hasStarmapFragment) {
                this.game.notify("🗺️ STAR-MAP FRAGMENT: Capturing localized telemetry that suggests an ancient navigation beacon.", "info");
                this.game.resources.data += 500; // Immediate data boost
            }

            // Roadmap Item 493: Ship Graveyard Discovery
            if (Math.random() < 0.05) {
                this.game.notify("🛰️ SHIP GRAVEYARD: Sensors detected a massive cluster of derelict hulls in this sector.", "warning");
                this.game.recordColonyEvent(`The fleet discovered an ancient ship graveyard in the ${star.name} system. Salvage operations authorized.`, 0.7);
                star.hasGraveyard = true;
            }

            // Roadmap Item 494: Ghost Ship Encounter
            if (Math.random() < 0.02) {
                this.game.notify("👻 GHOST SHIP: A phantom signal matching a century-old colony ship has appeared on long-range Lidar.", "danger");
                this.game.recordColonyEvent(`A legendary 'Ghost Ship' was sighted near ${star.name}. Crew morale is shaken.`, 0.8);
                star.hasGhostShip = true;
            }

            // Roadmap Item 350: Omega Seed discovery
            if (star.isOmegaSeed) {
                this.game.notify("🌌 THE OMEGA SEED: You have found the final repository of universal information.", "success");
                this.game.recordColonyEvent("The Omega Seed has been discovered in the heart of the Great Void.", 1.0);
                this.game.aiHistorian?.logEvent("OMEGA_SEED_FOUND", "The final objective of the Great Exploration has been reached.");
            }

            // Roadmap Item 387: Non-Euclidean Notification
            if (star.hasNonEuclideanWorld) {
                this.game.notify("📐 NON-EUCLIDEAN WORLD: Planetary geometry defies standard spatial logic. Navigation likely to be challenging.", "warning");
            }

            // Roadmap Item 388: Fractal Landscape Notification
            if (star.hasFractalLandscape) {
                this.game.notify("🌀 FRACTAL LANDSCAPE: Scans show infinite structural complexity at every scale. Science yield increased.", "success");
                this.game.resources.data += 300;
            }

            // Roadmap Item 385: Reality-warping artifacts Notification
            if (star.hasRealityArtifact) {
                this.game.notify("🔮 ARTIFACT DETECTED: Sensors are detecting a signature that violates the second law of thermodynamics.", "warning");
            }

            // Roadmap Item 386: 4D Puzzle Notification
            if (star.has4DPuzzle) {
                this.game.notify("🧩 4D ANOMALY: Local space is folded in a way that suggests a higher-dimensional structure.", "info");
            }
        }
    }

    // Roadmap Item 302: Probe Deployment
    launchProbe(targetId) {
        const star = this.galacticMap.stars.find(s => s.id === targetId);
        if (!star || star.discovered) return null;
        const existing = this.galacticMap.probes.find((probe) => probe.targetId === targetId);
        if (existing) {
            this.game.notify(`A probe is already en route to ${star.name}.`, 'info');
            return existing;
        }
        const nebulaPenalty = star.isNebula ? 0.5 : 1.0;
        if (!this.spendGameResources({ credits: 100, energy: 50 }, 'Launch deep-space probe')) return null;
        const origin = this.getCurrentStar();
        const probe = {
            id: `probe_${Date.now()}`,
            originId: origin?.id || null,
            targetId,
            progress: 0,
            speed: 0.05 * nebulaPenalty
        };
        this.galacticMap.probes.push(probe);
        this.game.notify(`Deep-space probe launched towards ${star.name}.${star.isNebula ? ' Nebula interference detected.' : ''}`, star.isNebula ? 'warning' : 'success');
        this.renderGalaxyMap();
        return probe;
    }

    updateProbes(delta) {
        // Roadmap Item 193: Satellite AI processing
        if (this.galacticMap.satellites.length > 0) {
            this.updateSatelliteAI(delta);
        }

        // Roadmap Item 185: Space Station AI processing
        if (this.galacticMap.spaceStations.length > 0) {
            this.updateSpaceStationAI(delta);
        }

        // Roadmap Item 315: SETI Signal Analysis
        this.updateSETIAnalysis(delta);

        // Roadmap Item 372: Dynamic Star-System Aging
        if (this.game.day % 50 === 0 && Math.random() < 0.01 * delta) {
            this.ageStarSystems();
        }

        // Roadmap Item 374: Crowdsourced Mapping Bonus
        this.updateMappingBonuses();

        for (let i = this.galacticMap.probes.length - 1; i >= 0; i--) {
            const p = this.galacticMap.probes[i];
            const star = this.galacticMap.stars.find(s => s.id === p.targetId);
            
            p.progress += p.speed * delta;

            // Roadmap Item 305: Hazard Damage to Probes
            if (star && star.hazards.length > 0 && Math.random() < 0.01 * delta) {
                this.game.notify(`⚠️ PROBE ALERT: ${star.name} hazards are damaging sensor arrays!`, "danger");
                p.speed *= 0.8; // Permanent slow for this probe
            }

            if (p.progress >= 1.0) {
                this.discoverStar(p.targetId);
                this.galacticMap.probes.splice(i, 1);
                
                // Roadmap Item 197: AI-driven star-map updating
                this.autoUpdateStarMap();

                if (document.getElementById('ep-galaxy-map-modal')?.style.display === 'flex') {
                    this.renderGalaxyMap();
                }
            }
        }
    }

    updateSatelliteAI(dt) {
        // Roadmap Item 193: AI-driven satellite network management
        this.galacticMap.satellites.forEach(s => {
            if (s.status === 'scanning') {
                s.progress += 0.01 * dt;
                if (s.progress >= 1.0) {
                    s.progress = 0;
                    this.game.notify(`📡 SATELLITE AI: Scan complete. Data throughput improved.`, "success");
                    this.game.resources.data += 10;

                    // Roadmap Item 233: Resource prospecting via orbital sensors
                    if (Math.random() < 0.3) {
                        this.performOrbitalProspecting();
                    }
                }
            }
        });
    }

    performOrbitalProspecting() {
        // Roadmap Item 233: Scan a random tile for hidden reserves
        if (!this.game.tiles || this.game.tiles.length === 0) return;
        
        const tileIdx = Math.floor(Math.random() * this.game.tiles.length);
        const tile = this.game.tiles[tileIdx];
        
        if (tile.reserves) {
            // Uncover hidden reserves or "prospect" them
            const bonus = Math.floor(Math.random() * 200 + 50);
            tile.reserves.minerals += bonus;
            this.game.notify(`🛰️ PROSPECTING: Orbital sensors detected hidden mineral vein on tile ${tileIdx}. +${bonus} potential reserves.`, "success");
            this.game.createEffect(tile.position, new THREE.Vector3(0, 5, 0), 0x38bdf8);
        }
    }

    updateSpaceStationAI(dt) {
        // Roadmap Item 185: AI-driven space station management
        this.galacticMap.spaceStations.forEach(station => {
            if (station.status === 'operational') {
                // Automated trade and logistics
                if (Math.random() < 0.001 * dt) {
                    const profit = Math.floor(Math.random() * 50 + 10);
                    this.game.resources.credits = (this.game.resources.credits || 0) + profit;
                    this.game.notify(`🚉 STATION AI: ${station.name} handled a commercial transit. +${profit} Credits`, "success");
                }
            }
        });
    }

    updateSETIAnalysis(dt) {
        // Roadmap Item 315: SETI signal analysis logic
        const hasTelescope = this.game.structures.some(s => s.type === 'telescope_array' && s.condition > 50);
        if (!hasTelescope) return;

        if (Math.random() < 0.001 * dt) {
            const signals = [
                "Repeating mathematical prime sequence",
                "Non-natural narrowband emission",
                "Dyson swarm thermal signature",
                "Precursor beacon automated broadcast"
            ];
            const signal = signals[Math.floor(Math.random() * signals.length)];
            this.game.notify(`📡 SETI ALERT: ${signal} detected! Analysis ongoing...`, "info");
            
            // Gain data over time or trigger quest
            this.game.resources.data += 50;
            if (Math.random() < 0.1) {
                this.game.aiGameMaster?.triggerSETIQuest(signal);
            }
        }

        // Roadmap Item 334: CMB Mapping
        if (Math.random() < 0.0005 * dt) {
            this.game.notify("🔬 CMB MAPPING: Long-range arrays have refined the Cosmic Microwave Background map.", "success");
            this.game.resources.data += 150;
        }

        // Roadmap Item 335: Dark Matter Filaments
        if (Math.random() < 0.0003 * dt) {
            this.game.notify("🌌 DARK MATTER: Sensors detected gravitational lensing from hidden dark matter filaments.", "info");
            this.game.resources.data += 300;
            // Potential unlock for exotic resources
        }
    }

    ageStarSystems() {
        // Roadmap Item 372: Stars evolve over geological time (simulated)
        this.galacticMap.stars.forEach(star => {
            if (Math.random() < 0.005) {
                // Rare star type transition
                if (star.type === 'Blue Giant') {
                    star.type = 'Supernova Precursor';
                    this.game.notify(`✨ STELLAR EVOLUTION: ${star.name} has entered its final life stage.`, "warning");
                } else if (star.type === 'Supernova Precursor') {
                    star.type = 'Neutron Star';
                    this.game.notify(`💥 SUPERNOVA: ${star.name} has collapsed into a Neutron Star!`, "danger");
                    star.hazards.push('Recent Supernova Fallout');
                }
            }
        });
    }

    updateMappingBonuses() {
        // Roadmap Item 374: Crowdsourced galactic mapping
        const totalDiscovered = this.galacticMap.stars.filter(s => s.discovered).length;
        if (totalDiscovered > 50) {
            const bonus = Math.floor(totalDiscovered / 10) * 5;
            // Apply bonus to research or economy
            if (this.game.day % 10 === 0 && Math.random() < 0.1) {
                this.game.resources.credits += bonus;
                this.game.notify(`🗺️ MAPPING BONUS: Royalties from crowdsourced star-charts: +${bonus} Cr`, "success");
            }
        }
    }

    autoUpdateStarMap() {
        // Roadmap Item 197: AI-driven star-map updating
        // Occasionally discover adjacent stars automatically if sensors are high
        if (Math.random() < 0.05) {
            const undiscovered = this.galacticMap.stars.filter(s => !s.discovered);
            if (undiscovered.length > 0) {
                const target = undiscovered[Math.floor(Math.random() * undiscovered.length)];
                this.discoverStar(target.id);
                this.game.notify(`🗺️ STAR-MAP AI: Automatically mapped neighboring system ${target.name}.`, "info");
            }
        }
    }

    // --- GALACTIC CHART: exploration, infrastructure, routes and travel ---
    getCurrentStar() {
        const currentId = String(this.game?.currentSystemId ?? '');
        return this.galacticMap.stars.find((star) => String(star.id) === currentId || String(star.linkedSystemId || '') === currentId)
            || this.galacticMap.stars.find((star) => star.home)
            || this.galacticMap.stars.find((star) => star.discovered)
            || this.galacticMap.stars[0]
            || null;
    }

    getTravelMetrics(target) {
        if (!target) return { distance: Infinity, energy: Infinity, credits: Infinity, range: 0, reachable: false };
        const current = this.getCurrentStar();
        if (!current) return { distance: 0, energy: 100, credits: 50, range: 450, reachable: true };
        const dx = Number(target.position?.x || 0) - Number(current.position?.x || 0);
        const dy = Number(target.position?.y || 0) - Number(current.position?.y || 0);
        const dz = Number(target.position?.z || 0) - Number(current.position?.z || 0);
        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
        const relayBonus = this.galacticMap.relays.some((relay) => relay.starId === current.id || relay.starId === target.id) ? 200 : 0;
        const refuelBonus = this.galacticMap.refuelingStations.some((station) => station.starId === current.id) ? 120 : 0;
        const range = 450 + relayBonus + refuelBonus;
        const energy = current.id === target.id ? 0 : Math.max(50, Math.ceil(45 + distance * 0.34));
        const economyToll = this.game?.economyManager?.calculateWarpToll?.(target.id);
        const credits = current.id === target.id ? 0 : Math.max(25, Number.isFinite(economyToll) ? Math.ceil(economyToll) : Math.ceil(25 + distance * 0.18));
        return { distance, energy, credits, range, reachable: distance <= range || !!target.hasStargate };
    }

    serializeGalacticState() {
        const map = this.galacticMap;
        return {
            version: 2,
            stars: map.stars,
            fogOfWar: map.fogOfWar,
            sectors: Array.from(map.sectors || []),
            probes: map.probes,
            satellites: map.satellites,
            spaceStations: map.spaceStations,
            wormholes: map.wormholes,
            relays: map.relays,
            smugglingRoutes: map.smugglingRoutes,
            refuelingStations: map.refuelingStations,
            deepShipyards: map.deepShipyards,
            megastructures: map.megastructures,
            history: map.history,
            discoveryLog: map.discoveryLog,
            view: {
                zoom: this.galaxyViewState.zoom,
                panX: this.galaxyViewState.panX,
                panY: this.galaxyViewState.panY,
                selectedStarId: this.galaxyViewState.selectedStarId
            }
        };
    }

    restoreGalacticState(raw) {
        if (!raw || typeof raw !== 'object') return false;
        const arrayKeys = ['stars', 'probes', 'satellites', 'spaceStations', 'wormholes', 'relays', 'smugglingRoutes', 'refuelingStations', 'deepShipyards', 'megastructures', 'history', 'discoveryLog'];
        for (const key of arrayKeys) {
            if (Array.isArray(raw[key])) this.galacticMap[key] = raw[key];
        }
        if (typeof raw.fogOfWar === 'boolean') this.galacticMap.fogOfWar = raw.fogOfWar;
        this.galacticMap.sectors = new Set(Array.isArray(raw.sectors) ? raw.sectors : ['0,0']);
        if (!this.galacticMap.stars.length) this.generateGalacticSector(0, 0);
        let home = this.galacticMap.stars.find((star) => star.home || star.id === 'star_0,0_0');
        if (!home) home = this.galacticMap.stars[0];
        if (home) {
            home.home = true;
            home.discovered = true;
            home.linkedSystemId = home.linkedSystemId || 'kepler_186f';
        }
        if (raw.view && typeof raw.view === 'object') {
            if (Number.isFinite(raw.view.zoom)) this.galaxyViewState.zoom = Math.max(0.7, Math.min(12, raw.view.zoom));
            if (Number.isFinite(raw.view.panX)) this.galaxyViewState.panX = raw.view.panX;
            if (Number.isFinite(raw.view.panY)) this.galaxyViewState.panY = raw.view.panY;
            if (raw.view.selectedStarId) this.galaxyViewState.selectedStarId = raw.view.selectedStarId;
        }
        if (!this.galacticMap.stars.some((star) => star.id === this.galaxyViewState.selectedStarId)) {
            this.galaxyViewState.selectedStarId = this.getCurrentStar()?.id || this.galacticMap.stars[0]?.id || null;
        }
        this.renderGalaxyMap();
        return true;
    }

    getSectorCoordinatesForStar(star = this.getCurrentStar()) {
        const match = String(star?.id || '').match(/^star_(-?\d+),(-?\d+)_/);
        if (match) return { x: Number(match[1]), y: Number(match[2]) };
        return {
            x: Math.round(Number(star?.position?.x || 0) / 100),
            y: Math.round(Number(star?.position?.y || 0) / 100)
        };
    }

    surveyAdjacentSectors() {
        if (!this.spendGameResources({ energy: 80, data: 20 }, 'Survey adjacent sectors')) return false;
        const center = this.getSectorCoordinatesForStar();
        let generated = 0;
        for (let y = -1; y <= 1; y += 1) {
            for (let x = -1; x <= 1; x += 1) {
                if (x === 0 && y === 0) continue;
                const key = `${center.x + x},${center.y + y}`;
                if (!this.galacticMap.sectors.has(key)) {
                    this.generateGalacticSector(center.x + x, center.y + y);
                    generated += 1;
                }
            }
        }
        this.game.notify(generated ? `Long-range survey charted ${generated} adjacent sectors.` : 'Adjacent sectors are already charted.', generated ? 'success' : 'info');
        this.renderGalaxyMap();
        return true;
    }

    centerGalaxyMapOnCurrent() {
        const star = this.getCurrentStar();
        if (!star) return;
        this.galaxyViewState.panX = -Number(star.position?.x || 0) * this.galaxyViewState.zoom;
        this.galaxyViewState.panY = -Number(star.position?.y || 0) * this.galaxyViewState.zoom;
        this.galaxyViewState.selectedStarId = star.id;
        this.renderGalaxyMap();
    }

    setGalaxyZoom(nextZoom) {
        this.galaxyViewState.zoom = Math.max(0.7, Math.min(12, Number(nextZoom) || this.galaxyViewState.zoom));
        this.renderGalaxyMap();
    }

    openGalaxyMap() {
        let modal = document.getElementById('ep-galaxy-map-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'ep-galaxy-map-modal';
            modal.className = 'ep-modal-overlay';
            modal.style.cssText = 'display:none; z-index:5000;';
            modal.innerHTML = `
                <div class="ep-modal ep-galaxy-map-window">
                    <div class="ep-modal-header">
                        <div><span class="ep-galaxy-kicker">EXPLORATION NETWORK</span><h2>🌌 Galactic Chart</h2></div>
                        <button class="ep-sys-btn" data-galaxy-action="close">CLOSE</button>
                    </div>
                    <div class="ep-galaxy-toolbar">
                        <button class="ep-sys-btn" data-galaxy-action="center">◎ Current</button>
                        <button class="ep-sys-btn" data-galaxy-action="zoom-out">−</button>
                        <button class="ep-sys-btn" data-galaxy-action="zoom-in">+</button>
                        <button class="ep-sys-btn" data-galaxy-action="sensor">📡 Sensor Ping · 50⚡</button>
                        <button class="ep-sys-btn" data-galaxy-action="survey">🧭 Survey Ring · 80⚡ 20📊</button>
                        <div class="ep-galaxy-speed" role="group" aria-label="Galaxy simulation speed">
                            <span>SIM</span>
                            <button class="ep-sys-btn" data-galaxy-action="speed" data-speed-index="1" title="Galaxy 1x Speed">1x</button>
                            <button class="ep-sys-btn" data-galaxy-action="speed" data-speed-index="3" title="Galaxy 5x Speed">5x</button>
                            <button class="ep-sys-btn" data-galaxy-action="speed" data-speed-index="4" title="Galaxy 10x Speed">10x</button>
                        </div>
                        <span id="ep-galaxy-summary" class="ep-galaxy-summary"></span>
                    </div>
                    <div class="ep-galaxy-map-body">
                        <div id="ep-galaxy-canvas-container" class="ep-galaxy-stage">
                            <canvas id="ep-galaxy-chart-canvas" aria-label="Interactive galactic chart"></canvas>
                        </div>
                        <aside id="ep-star-details" class="ep-galaxy-details"></aside>
                    </div>
                    <div class="ep-galaxy-legend">
                        <span><i class="current"></i>Current</span><span><i class="discovered"></i>Discovered</span><span><i class="unknown"></i>Uncharted</span><span><i class="claimed"></i>Claimed</span><span>〰 Wormhole</span><span>📡 Relay</span><span>⛽ Refuel</span><span>🏗 Shipyard</span>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }
        modal.style.display = 'flex';
        this.bindGalaxyMapInteractions(modal);
        modal.querySelectorAll('[data-galaxy-action="speed"]').forEach((speedButton) => {
            speedButton.classList.toggle('active', Number(speedButton.dataset.speedIndex) === Number(this.game?.timeSpeedIndex));
        });
        if (!this.galaxyViewState.selectedStarId) this.galaxyViewState.selectedStarId = this.getCurrentStar()?.id || null;
        requestAnimationFrame(() => this.renderGalaxyMap());
    }

    bindGalaxyMapInteractions(modal) {
        if (!modal || modal.dataset.galaxyBound === '1') return;
        modal.dataset.galaxyBound = '1';
        const canvas = modal.querySelector('#ep-galaxy-chart-canvas');
        const state = this.galaxyViewState;

        modal.addEventListener('click', (event) => {
            const button = event.target.closest('[data-galaxy-action]');
            if (!button) return;
            const action = button.dataset.galaxyAction;
            const starId = button.dataset.starId || state.selectedStarId;
            const star = this.galacticMap.stars.find((entry) => entry.id === starId);
            if (action === 'close') { modal.style.display = 'none'; return; }
            if (action === 'center') { this.centerGalaxyMapOnCurrent(); return; }
            if (action === 'zoom-in') { this.setGalaxyZoom(state.zoom * 1.25); return; }
            if (action === 'zoom-out') { this.setGalaxyZoom(state.zoom / 1.25); return; }
            if (action === 'sensor') { this.performSensorPing(); return; }
            if (action === 'survey') { this.surveyAdjacentSectors(); return; }
            if (action === 'speed') {
                const index = Number(button.dataset.speedIndex);
                if (Number.isInteger(index) && this.game?.setTimeSpeed) this.game.setTimeSpeed(index);
                modal.querySelectorAll('[data-galaxy-action="speed"]').forEach((speedButton) => {
                    speedButton.classList.toggle('active', Number(speedButton.dataset.speedIndex) === Number(this.game?.timeSpeedIndex));
                });
                return;
            }
            if (!star) return;
            if (action === 'probe') this.launchProbe(star.id);
            if (action === 'warp') {
                modal.style.display = 'none';
                this.game.warpToSystem(star, { returnToGalaxy: true });
            }
            if (action === 'claim') this.game.claimCurrentSystem();
            if (action === 'relay') this.addRelayStation(star.id);
            if (action === 'refuel') this.addRefuelingStation(star.id);
            if (action === 'shipyard') this.addDeepShipyard(star.id);
            if (action === 'mega') this.buildMegastructure(star.id, 'dyson_swarm');
            if (action === 'stabilize') this.stabilizeStar(star.id);
            if (action === 'wormhole') this.useWormhole(button.dataset.wormholeId);
            if (action === 'rename' && star.namingRights) {
                const next = prompt(`Rename ${star.name}:`, star.name);
                if (next && next.trim()) {
                    star.name = next.trim().slice(0, 40);
                    star.namingRights = false;
                    this.game.notify(`System renamed to ${star.name}.`, 'success');
                }
            }
            this.renderGalaxyMap();
        });

        canvas.addEventListener('pointerdown', (event) => {
            if (event.button !== undefined && event.button !== 0) return;
            state.pointerId = event.pointerId;
            state.dragging = true;
            state.dragMoved = false;
            state.lastX = event.clientX;
            state.lastY = event.clientY;
            canvas.setPointerCapture?.(event.pointerId);
            canvas.classList.add('dragging');
            event.preventDefault();
        });
        canvas.addEventListener('pointermove', (event) => {
            if (state.dragging && (state.pointerId === null || state.pointerId === event.pointerId)) {
                const dx = event.clientX - state.lastX;
                const dy = event.clientY - state.lastY;
                if (Math.abs(dx) + Math.abs(dy) > 2) state.dragMoved = true;
                state.panX += dx;
                state.panY += dy;
                state.lastX = event.clientX;
                state.lastY = event.clientY;
                this.renderGalaxyMap();
                event.preventDefault();
                return;
            }
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const hit = this.findGalaxyStarAt(x, y, 14);
            const next = hit?.id || null;
            if (next !== state.hoveredStarId) {
                state.hoveredStarId = next;
                canvas.style.cursor = next ? 'pointer' : 'grab';
                this.renderGalaxyMap();
            }
        });
        const finishPointer = (event) => {
            if (!state.dragging) return;
            const wasMoved = state.dragMoved;
            state.dragging = false;
            state.pointerId = null;
            canvas.classList.remove('dragging');
            try { canvas.releasePointerCapture?.(event.pointerId); } catch { }
            if (!wasMoved) {
                const rect = canvas.getBoundingClientRect();
                const hit = this.findGalaxyStarAt(event.clientX - rect.left, event.clientY - rect.top, 16);
                if (hit) state.selectedStarId = hit.id;
            }
            this.renderGalaxyMap();
        };
        canvas.addEventListener('pointerup', finishPointer);
        canvas.addEventListener('pointercancel', finishPointer);
        canvas.addEventListener('wheel', (event) => {
            const factor = event.deltaY > 0 ? 0.88 : 1.14;
            this.setGalaxyZoom(state.zoom * factor);
            event.preventDefault();
        }, { passive: false });

        const body = modal.querySelector('.ep-galaxy-map-body');
        if (typeof ResizeObserver !== 'undefined' && body) {
            this.galaxyResizeObserver?.disconnect?.();
            this.galaxyResizeObserver = new ResizeObserver(() => {
                if (modal.style.display !== 'none') this.renderGalaxyMap();
            });
            this.galaxyResizeObserver.observe(body);
        }
    }

    worldToGalaxyScreen(star, width, height) {
        const zoom = this.galaxyViewState.zoom;
        return {
            x: width / 2 + this.galaxyViewState.panX + Number(star.position?.x || 0) * zoom,
            y: height / 2 + this.galaxyViewState.panY + Number(star.position?.y || 0) * zoom
        };
    }

    findGalaxyStarAt(x, y, radius = 14) {
        let best = null;
        let bestDist = radius;
        for (const item of this._galaxyScreenStars || []) {
            const distance = Math.hypot(item.x - x, item.y - y);
            if (distance <= bestDist) {
                bestDist = distance;
                best = item.star;
            }
        }
        return best;
    }

    getGalaxyStarColor(star) {
        if (!star.discovered) return '#334155';
        if (star.type === 'Black Hole') return '#c084fc';
        if (star.type === 'Neutron Star' || star.type === 'Pulsar') return '#67e8f9';
        if (star.type === 'Blue Giant' || star.type === 'Quasar') return '#60a5fa';
        if (star.type === 'M-Dwarf') return '#fb7185';
        if (star.type === 'K-Type') return '#fbbf24';
        return '#f8fafc';
    }

    renderGalaxyMap() {
        const canvas = document.getElementById('ep-galaxy-chart-canvas');
        const modal = document.getElementById('ep-galaxy-map-modal');
        if (!canvas || !modal || modal.style.display === 'none') return;
        const container = document.getElementById('ep-galaxy-canvas-container');
        const cssWidth = Math.max(320, container?.clientWidth || 700);
        const cssHeight = Math.max(260, container?.clientHeight || 520);
        const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
        if (canvas.width !== Math.floor(cssWidth * dpr) || canvas.height !== Math.floor(cssHeight * dpr)) {
            canvas.width = Math.floor(cssWidth * dpr);
            canvas.height = Math.floor(cssHeight * dpr);
            canvas.style.width = `${cssWidth}px`;
            canvas.style.height = `${cssHeight}px`;
        }
        const ctx = canvas.getContext('2d');
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const width = cssWidth;
        const height = cssHeight;
        const state = this.galaxyViewState;

        const bg = ctx.createRadialGradient(width * 0.48, height * 0.45, 10, width * 0.5, height * 0.5, Math.max(width, height) * 0.8);
        bg.addColorStop(0, '#0d2036');
        bg.addColorStop(0.45, '#07111f');
        bg.addColorStop(1, '#01050c');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, width, height);

        const grid = Math.max(42, 100 * state.zoom);
        const offsetX = ((width / 2 + state.panX) % grid + grid) % grid;
        const offsetY = ((height / 2 + state.panY) % grid + grid) % grid;
        ctx.strokeStyle = 'rgba(56,189,248,0.065)';
        ctx.lineWidth = 1;
        for (let x = offsetX; x < width; x += grid) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
        for (let y = offsetY; y < height; y += grid) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }

        const current = this.getCurrentStar();
        const currentPos = current ? this.worldToGalaxyScreen(current, width, height) : null;
        if (current && currentPos) {
            for (const star of this.galacticMap.stars) {
                if (!star.discovered || star.id === current.id) continue;
                const metrics = this.getTravelMetrics(star);
                if (!metrics.reachable) continue;
                const p = this.worldToGalaxyScreen(star, width, height);
                ctx.strokeStyle = 'rgba(56,189,248,0.13)';
                ctx.setLineDash([4, 7]);
                ctx.beginPath(); ctx.moveTo(currentPos.x, currentPos.y); ctx.lineTo(p.x, p.y); ctx.stroke();
            }
            ctx.setLineDash([]);
        }

        for (const wh of this.galacticMap.wormholes) {
            const a = this.galacticMap.stars.find((star) => star.id === wh.a);
            const b = this.galacticMap.stars.find((star) => star.id === wh.b);
            if (!a || !b || (!a.discovered && !b.discovered)) continue;
            const pa = this.worldToGalaxyScreen(a, width, height);
            const pb = this.worldToGalaxyScreen(b, width, height);
            ctx.strokeStyle = wh.stable ? 'rgba(192,132,252,0.68)' : 'rgba(244,114,182,0.48)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([2, 5]);
            ctx.beginPath(); ctx.moveTo(pa.x, pa.y); ctx.lineTo(pb.x, pb.y); ctx.stroke();
        }
        ctx.setLineDash([]);

        for (const probe of this.galacticMap.probes) {
            const target = this.galacticMap.stars.find((star) => star.id === probe.targetId);
            const origin = this.galacticMap.stars.find((star) => star.id === probe.originId) || current;
            if (!target || !origin) continue;
            const a = this.worldToGalaxyScreen(origin, width, height);
            const b = this.worldToGalaxyScreen(target, width, height);
            const t = Math.max(0, Math.min(1, Number(probe.progress || 0)));
            const px = a.x + (b.x - a.x) * t;
            const py = a.y + (b.y - a.y) * t;
            ctx.strokeStyle = 'rgba(250,204,21,0.25)';
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            ctx.fillStyle = '#facc15';
            ctx.beginPath(); ctx.arc(px, py, 3.2, 0, Math.PI * 2); ctx.fill();
        }

        this._galaxyScreenStars = [];
        for (const star of this.galacticMap.stars) {
            const p = this.worldToGalaxyScreen(star, width, height);
            if (p.x < -30 || p.x > width + 30 || p.y < -30 || p.y > height + 30) continue;
            this._galaxyScreenStars.push({ star, x: p.x, y: p.y });
            const isCurrent = current?.id === star.id;
            const isSelected = state.selectedStarId === star.id;
            const isHovered = state.hoveredStarId === star.id;
            const claimed = this.game?.claims?.[star.id] === 'player' || this.game?.claims?.[star.linkedSystemId] === 'player';
            const radius = isCurrent ? 6.2 : (star.discovered ? 4.2 : 2.4);
            ctx.shadowColor = star.discovered ? this.getGalaxyStarColor(star) : 'transparent';
            ctx.shadowBlur = star.discovered ? 8 : 0;
            ctx.fillStyle = this.getGalaxyStarColor(star);
            ctx.beginPath(); ctx.arc(p.x, p.y, radius, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            if (isSelected || isHovered || isCurrent) {
                ctx.strokeStyle = isCurrent ? '#22d3ee' : (isSelected ? '#fbbf24' : '#94a3b8');
                ctx.lineWidth = isCurrent ? 2 : 1.3;
                ctx.beginPath(); ctx.arc(p.x, p.y, radius + (isCurrent ? 8 : 6), 0, Math.PI * 2); ctx.stroke();
            }
            if (claimed) {
                ctx.strokeStyle = '#4ade80';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(p.x, p.y, radius + 3, Math.PI * 0.12, Math.PI * 0.88); ctx.stroke();
            }
            if (star.discovered && state.zoom >= 2.0) {
                ctx.fillStyle = isCurrent ? '#a5f3fc' : '#b9c8d8';
                ctx.font = `${isCurrent ? 11 : 10}px Orbitron, sans-serif`;
                ctx.fillText(star.name, p.x + 10, p.y + 4);
            }
            const markers = [];
            if (this.galacticMap.relays.some((entry) => entry.starId === star.id)) markers.push('📡');
            if (this.galacticMap.refuelingStations.some((entry) => entry.starId === star.id)) markers.push('⛽');
            if (this.galacticMap.deepShipyards.some((entry) => entry.starId === star.id)) markers.push('🏗');
            if (this.galacticMap.megastructures.some((entry) => entry.starId === star.id)) markers.push('◉');
            if (markers.length && state.zoom >= 1.5) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#7dd3fc';
                ctx.fillText(markers.join(''), p.x + 10, p.y + 16);
            }
        }

        const discovered = this.galacticMap.stars.filter((star) => star.discovered).length;
        const summary = document.getElementById('ep-galaxy-summary');
        if (summary) summary.textContent = `${discovered}/${this.galacticMap.stars.length} systems · ${this.galacticMap.probes.length} probes · ${this.galacticMap.sectors.size} sectors`;
        this.renderGalaxyStarDetails();
    }

    renderGalaxyStarDetails() {
        const details = document.getElementById('ep-star-details');
        if (!details) return;
        const star = this.galacticMap.stars.find((entry) => entry.id === this.galaxyViewState.selectedStarId) || this.getCurrentStar();
        if (!star) {
            details.innerHTML = '<div class="ep-galaxy-empty">No system selected.</div>';
            return;
        }
        this.galaxyViewState.selectedStarId = star.id;
        const current = this.getCurrentStar();
        const isCurrent = current?.id === star.id;
        const claimed = this.game?.claims?.[star.id] === 'player' || this.game?.claims?.[star.linkedSystemId] === 'player';
        const travel = this.getTravelMetrics(star);
        const probe = this.galacticMap.probes.find((entry) => entry.targetId === star.id);
        const wormhole = this.galacticMap.wormholes.find((entry) => entry.a === star.id || entry.b === star.id);
        const assets = [];
        if (this.galacticMap.relays.some((entry) => entry.starId === star.id)) assets.push('Relay');
        if (this.galacticMap.refuelingStations.some((entry) => entry.starId === star.id)) assets.push('Refuel');
        if (this.galacticMap.deepShipyards.some((entry) => entry.starId === star.id)) assets.push('Shipyard');
        const mega = this.galacticMap.megastructures.find((entry) => entry.starId === star.id);
        if (mega) assets.push(`${mega.type.replaceAll('_', ' ')} ${Math.round((mega.completion || 0) * 100)}%`);
        const hazards = Array.isArray(star.hazards) && star.hazards.length ? star.hazards.join(' · ') : 'None detected';
        const credits = Math.floor(this.getGameCredits());
        const energy = Math.floor(Number(this.game?.resources?.energy || 0));
        const canWarp = star.discovered && !isCurrent && travel.reachable && energy >= travel.energy && credits >= travel.credits;
        const currentActions = isCurrent && star.discovered;
        const relayExists = this.galacticMap.relays.some((entry) => entry.starId === star.id);
        const fuelExists = this.galacticMap.refuelingStations.some((entry) => entry.starId === star.id);
        const yardExists = this.galacticMap.deepShipyards.some((entry) => entry.starId === star.id);
        const dysonExists = this.galacticMap.megastructures.some((entry) => entry.starId === star.id && entry.type === 'dyson_swarm');
        details.innerHTML = `
            <div class="ep-galaxy-details-head"><div><span>${star.discovered ? star.type : 'Uncharted signature'}</span><h3>${star.discovered ? star.name : 'Unknown System'}</h3></div><strong>${isCurrent ? 'CURRENT' : (claimed ? 'CLAIMED' : '')}</strong></div>
            <div class="ep-galaxy-detail-grid">
                <span>Coordinates</span><b>${Math.round(star.position?.x || 0)}, ${Math.round(star.position?.y || 0)}</b>
                <span>Configuration</span><b>${star.discovered ? star.discoveryStatus : 'Unknown'}</b>
                <span>Hazards</span><b>${star.discovered ? hazards : 'Unscanned'}</b>
                <span>Distance</span><b>${isCurrent ? '0' : `${travel.distance.toFixed(0)} ly`}</b>
                <span>Warp envelope</span><b class="${travel.reachable ? 'good' : 'bad'}">${travel.reachable ? `${travel.range.toFixed(0)} ly` : 'Out of range'}</b>
                <span>Infrastructure</span><b>${assets.length ? assets.join(' · ') : 'None'}</b>
            </div>
            ${probe ? `<div class="ep-galaxy-probe"><span>Probe en route</span><div><i style="width:${Math.round(Math.max(0, Math.min(1, probe.progress)) * 100)}%"></i></div><b>${Math.round(probe.progress * 100)}%</b></div>` : ''}
            <div class="ep-galaxy-actions">
                ${!star.discovered ? `<button class="ep-sys-btn" data-galaxy-action="probe" data-star-id="${star.id}" ${probe ? 'disabled' : ''}>${probe ? 'Probe en route' : 'Launch Probe · 100Cr 50⚡'}</button>` : ''}
                ${star.discovered && !isCurrent ? `<button class="ep-sys-btn primary" data-galaxy-action="warp" data-star-id="${star.id}" ${canWarp ? '' : 'disabled'}>Warp · ${travel.energy}⚡ ${travel.credits}Cr</button>` : ''}
                ${currentActions && !claimed ? `<button class="ep-sys-btn" data-galaxy-action="claim" data-star-id="${star.id}">🚩 Claim · 100 alloys 50 circuits</button>` : ''}
                ${currentActions && claimed && !relayExists ? `<button class="ep-sys-btn" data-galaxy-action="relay" data-star-id="${star.id}">📡 Relay</button>` : ''}
                ${currentActions && claimed && !fuelExists ? `<button class="ep-sys-btn" data-galaxy-action="refuel" data-star-id="${star.id}">⛽ Refuel Station</button>` : ''}
                ${currentActions && claimed && !yardExists ? `<button class="ep-sys-btn" data-galaxy-action="shipyard" data-star-id="${star.id}">🏗 Deep Shipyard</button>` : ''}
                ${currentActions && claimed && !dysonExists ? `<button class="ep-sys-btn" data-galaxy-action="mega" data-star-id="${star.id}">☀ Dyson Swarm</button>` : ''}
                ${currentActions && star.hazards?.length ? `<button class="ep-sys-btn" data-galaxy-action="stabilize" data-star-id="${star.id}">Stabilize Star</button>` : ''}
                ${currentActions && wormhole ? `<button class="ep-sys-btn" data-galaxy-action="wormhole" data-wormhole-id="${wormhole.id}">〰 Transit Wormhole</button>` : ''}
                ${star.discovered && star.namingRights ? `<button class="ep-sys-btn" data-galaxy-action="rename" data-star-id="${star.id}">✎ Rename</button>` : ''}
            </div>
        `;
    }

    /**
     * Registers a new universe in the multiverse map
     */
    registerUniverse(id, physicsContext, initialState = {}) {
        if (this.universes.has(id)) {
            console.warn(`Universe ${id} already exists`);
            return;
        }

        this.universes.set(id, {
            physics: physicsContext,
            state: initialState, // Allows storing universe-specific game state (e.g. factions, bases)
            visited: false,
            created: Date.now()
        });

        console.log(`Universe Registered: ${id} (${physicsContext.name})`);
    }

    /**
     * Breaches the barrier to a new universe, creating it procedurally if needed
     */
    breach(type) {
        const id = `${type}_${Date.now()}`;
        let context;
        let initialState = {};

        switch (type) {
            case 'MIRROR':
                context = PhysicsContext.PRESETS.MIRROR;
                if (window.MultiverseGenerators) {
                    initialState = window.MultiverseGenerators.generateMirrorState(this.game);
                }
                break;
            case 'VOID':
                context = PhysicsContext.PRESETS.FLUIDIC;
                if (window.MultiverseGenerators) {
                    initialState = window.MultiverseGenerators.generateVoidState();
                }
                break;
            case 'HEAVY':
                context = PhysicsContext.PRESETS.HIGH_GRAVITY;
                break;
            case 'FAST':
                context = PhysicsContext.PRESETS.TIME_DILATED;
                break;
            default:
                context = new PhysicsContext({ name: `Strange Dimension ${id.substr(-4)}` });
        }

        this.registerUniverse(id, context, initialState);
        this.travelTo(id);
        return id;
    }

    /**
     * Switches the active universe, updating physics and visuals
     */
    travelTo(id) {
        if (!this.universes.has(id)) {
            console.error(`Cannot travel to unknown universe: ${id}`);
            return;
        }

        const target = this.universes.get(id);

        // Save state of current universe before leaving
        // (In a full implementation, we'd serialize the entire game state here)
        // For now, we mainly swap physics and visual context.

        this.activeUniverseId = id;
        this.activePhysicsContext = target.physics;
        target.visited = true;

        this.applyUniversePhysics();
        this.game.notify(`Entered ${target.physics.name}`, 'success');

        if (this.onUniverseChange) {
            this.onUniverseChange(id, target.physics);
        }
    }

    applyUniversePhysics() {
        const p = this.activePhysicsContext;

        // Update Game Loop Modifiers
        this.game.tickRate = 1000 / p.timeScale;

        // Update Visuals
        if (this.game.scene) {
            this.game.scene.background = new THREE.Color(p.skyColor);
            this.game.scene.fog.color = new THREE.Color(p.skyColor);
            this.game.scene.fog.density = p.fogDensity;
        }

        // Pass changes to relevant sub-systems
        if (this.game.updatePhysicsConstants) {
            this.game.updatePhysicsConstants(p);
        }

        this.applyUniverseState();
    }

    applyUniverseState() {
        const target = this.universes.get(this.activeUniverseId);
        if (!target || !target.state) return;

        // Apply Mirror Factions
        if (target.state.factions) {
            console.log("Applying Universe Factions:", target.state.factions);
            // In a real implementation, we would swap the entire faction manager state.
            this.game.notify(`Welcome to the ${target.physics.name}. The factions here are... different.`, "warning");
        }
    }

    getActiveContext() {
        return this.activePhysicsContext;
    }

    // --- GALAXY GENERATION & EXPLORATION (1-400 foundational logic) ---

    generateGalacticSector(sx, sy) {
        const sectorKey = `${sx},${sy}`;
        if (this.galacticMap.sectors.has(sectorKey)) return;

        const rng = (s) => {
            const x = Math.sin(s) * 10000;
            return x - Math.floor(x);
        };

        const sectorSeed = (sx * 731) ^ (sy * 197) ^ (this.game.currentWorldSeed || 12345);
        const dist = Math.sqrt(sx * sx + sy * sy);
        const angle = Math.atan2(sy, sx);
        
        const isHalo = dist > 1000; // 349
        const isGreatVoid = rng(sectorSeed + 50) < 0.05 && dist > 500; // 350

        const spiralTightness = 0.5;
        const armFactor = Math.cos(angle * 2 + dist * spiralTightness);
        let density = Math.max(2, Math.floor(15 * (1.0 + armFactor)));

        if (isHalo) density = Math.max(1, Math.floor(density * 0.3));
        if (isGreatVoid) density = 0;

        if (density > 0) {
            for (let i = 0; i < density; i++) {
                const starId = `star_${sectorKey}_${i}`;
                const s = sectorSeed + i;
                const r = rng(s + 4);
                
                const typeRoll = rng(s + 5);
                let type = 'G-Type';
                if (typeRoll < 0.01) type = 'Black Hole';
                else if (typeRoll < 0.02) type = 'White Hole'; // 367
                else if (typeRoll < 0.04) type = 'Neutron Star'; // 368
                else if (typeRoll < 0.05) type = 'Supernova Precursor'; // 369
                else if (typeRoll < 0.07) type = 'Pulsar';
                else if (typeRoll < 0.09) type = 'Quasar';
                else if (typeRoll < 0.11) type = 'Rogue Planet';
                else if (typeRoll < 0.13) type = 'Proto-planetary Disc';
                else if (typeRoll < 0.20) type = 'Blue Giant';
                else if (typeRoll < 0.45) type = 'M-Dwarf';
                else if (typeRoll < 0.75) type = 'K-Type';

                this.galacticMap.stars.push({
                    id: starId,
                    name: this.generateStarName(s),
                    seed: Math.floor(rng(s) * 1000000),
                    position: {
                        x: sx * 100 + (rng(s + 1) * 80 - 40),
                        y: sy * 100 + (rng(s + 2) * 80 - 40),
                        z: (rng(s + 3) * 40 - 20)
                    },
                    type: type,
                    isHalo: isHalo,
                    isNebula: rng(s + 6) < 0.12,
                    discoveryStatus: (r < 0.05) ? 'Trinary' : (r < 0.15 ? 'Binary' : 'Single'),
                    discovered: i === 0 && sx === 0 && sy === 0,
                    scanned: false,
                    hazards: this.getHazardsForType(type)
                });

                if (rng(s + 13) < 0.01) this.galacticMap.stars[this.galacticMap.stars.length - 1].hasStargate = true; // 342
                if (rng(s + 14) < 0.005) this.galacticMap.stars[this.galacticMap.stars.length - 1].hasLivingPlanet = true; // 343
                if (rng(s + 15) < 0.002) this.galacticMap.stars[this.galacticMap.stars.length - 1].artificialPlanetoid = true; // 344
                if (rng(s + 18) < 0.02) this.galacticMap.stars[this.galacticMap.stars.length - 1].hasXenoArchSite = true; // 353
                if (rng(s + 19) < 0.01) this.galacticMap.stars[this.galacticMap.stars.length - 1].hasStarmapFragment = true; // 354
                if (rng(s + 7) < 0.02 && this.galacticMap.stars.length > 5) this.generateWormhole(starId); // 307
            }
        }
        this.galacticMap.sectors.add(sectorKey);
    }

    generateWormhole(starId) { // 307
        const others = this.galacticMap.stars.filter(s => s.id !== starId);
        if (others.length === 0) return;
        const target = others[Math.floor(Math.random() * others.length)];
        this.galacticMap.wormholes.push({ id: `wh_${Date.now()}_${Math.floor(Math.random()*1000)}`, a: starId, b: target.id, stable: Math.random() > 0.3 });
    }

    useWormhole(wormholeId) { // 307
        const wh = this.galacticMap.wormholes.find(w => w.id === wormholeId);
        const current = this.getCurrentStar();
        if (!wh || !current) return false;
        if (wh.a !== current.id && wh.b !== current.id) {
            this.game.notify('This wormhole is not connected to the current system.', 'warning');
            return false;
        }
        const destinationId = wh.a === current.id ? wh.b : wh.a;
        const destStar = this.galacticMap.stars.find(s => s.id === destinationId);
        if (!destStar) return false;
        destStar.discovered = true;
        this.game.notify(`〰 WORMHOLE: Transit corridor locked on ${destStar.name}.`, 'success');
        this.game.warpToSystem?.(destStar);
        return true;
    }
}

window.UniverseManager = UniverseManager;
