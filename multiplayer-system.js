/**
 * Multiplayer System
 * Real-time sync, enhanced leaderboards, and async player trading
 */

class MultiplayerManager {
    constructor(game) {
        this.game = game;
        this.cloud = game.cloud;
        this.isOnline = false;
        this.playerProfile = null;
        this.tradeOffers = [];
        this.pendingTrades = [];
        this.systemClaims = {}; // Map systemId -> Claim Data
        this.realtimeChannel = null;
    }

    init() {
        if (!this.cloud?.isEnabled) {
            console.log("Multiplayer: Supabase not enabled, running offline");
            return;
        }

        this.isOnline = true;
        this.loadProfile();
        console.log("Multiplayer System Initialized");
    }

    // --- Profile Management ---

    async loadProfile() {
        if (!this.cloud?.client || !this.cloud?.user) return;

        const { data } = await this.cloud.client
            .from('profiles')
            .select('*')
            .eq('id', this.cloud.user.id)
            .single();

        if (data) {
            this.playerProfile = data;
        } else {
            // Create profile
            await this.createProfile();
        }
    }

    async createProfile() {
        if (!this.cloud?.client || !this.cloud?.user) return;

        const username = this.cloud.user.user_metadata?.full_name ||
            'Pioneer_' + Math.floor(Math.random() * 10000);

        const { data } = await this.cloud.client
            .from('profiles')
            .insert({
                id: this.cloud.user.id,
                username: username,
                stats: {
                    totalPlayTime: 0,
                    coloniesBuilt: 0,
                    systemsExplored: 0,
                    achievementsUnlocked: 0
                }
            })
            .select()
            .single();

        this.playerProfile = data;
    }

    async updateStats() {
        if (!this.playerProfile || !this.cloud?.client) return;

        const stats = {
            totalPlayTime: Math.floor(this.game.day),
            coloniesBuilt: this.game.structures?.length || 0,
            systemsExplored: Object.keys(this.game.systemStates || {}).length,
            achievementsUnlocked: this.game.achievements?.getUnlocked()?.length || 0
        };

        await this.cloud.client
            .from('profiles')
            .update({ stats, updated_at: new Date() })
            .eq('id', this.cloud.user.id);
    }

    // --- Enhanced Leaderboards ---

    async submitToLeaderboard() {
        if (!this.cloud?.client || !this.cloud?.user) return;

        const score = this.calculateScore();
        const details = {
            colonists: this.game.colonists?.length || 0,
            structures: this.game.structures?.length || 0,
            day: this.game.day,
            achievements: this.game.achievements?.getUnlocked()?.length || 0
        };

        await this.cloud.submitScore('exoplanet_pioneer', score, details);
        this.game.notify("📊 Score submitted to leaderboard!", "success");
    }

    calculateScore() {
        let score = 0;
        score += (this.game.colonists?.length || 0) * 100;
        score += (this.game.structures?.length || 0) * 50;
        score += (this.game.day || 0) * 10;
        score += (this.game.achievements?.getUnlocked()?.length || 0) * 200;
        score += Math.floor(this.game.resources?.credits || 0);
        return score;
    }

    async fetchLeaderboard() {
        if (!this.cloud?.client) return [];

        const { data } = await this.cloud.getLeaderboard('exoplanet_pioneer', 20);
        return data || [];
    }

    // --- Player Trading ---

    async createTradeOffer(offering, requesting) {
        if (!this.cloud?.client || !this.cloud?.user) {
            this.game.notify("Must be logged in to trade", "danger");
            return false;
        }

        // Verify player has the resources
        for (const [res, amount] of Object.entries(offering)) {
            if ((this.game.resources[res] || 0) < amount) {
                this.game.notify(`Insufficient ${res}`, "danger");
                return false;
            }
        }

        // Deduct resources
        for (const [res, amount] of Object.entries(offering)) {
            this.game.resources[res] -= amount;
        }

        const { error } = await this.cloud.client
            .from('trade_offers')
            .insert({
                seller_id: this.cloud.user.id,
                offering: offering,
                requesting: requesting,
                status: 'open'
            });

        if (error) {
            // Refund
            for (const [res, amount] of Object.entries(offering)) {
                this.game.resources[res] += amount;
            }
            this.game.notify("Failed to create trade offer", "danger");
            return false;
        }

        this.game.notify("🤝 Trade offer posted!", "success");
        this.game.updateResourceUI();
        return true;
    }

    async fetchOpenTrades() {
        if (!this.cloud?.client) return [];

        const { data } = await this.cloud.client
            .from('trade_offers')
            .select('*, profiles!seller_id(username)')
            .eq('status', 'open')
            .neq('seller_id', this.cloud?.user?.id || '')
            .order('created_at', { ascending: false })
            .limit(20);

        return data || [];
    }

    async acceptTrade(tradeId) {
        if (!this.cloud?.client || !this.cloud?.user) return false;

        // Get trade details
        const { data: trade } = await this.cloud.client
            .from('trade_offers')
            .select('*')
            .eq('id', tradeId)
            .single();

        if (!trade || trade.status !== 'open') {
            this.game.notify("Trade no longer available", "danger");
            return false;
        }

        // Check buyer has requested resources
        for (const [res, amount] of Object.entries(trade.requesting)) {
            if ((this.game.resources[res] || 0) < amount) {
                this.game.notify(`Need ${amount} ${res} to accept`, "danger");
                return false;
            }
        }

        // Execute trade
        for (const [res, amount] of Object.entries(trade.requesting)) {
            this.game.resources[res] -= amount;
        }
        for (const [res, amount] of Object.entries(trade.offering)) {
            this.game.resources[res] = (this.game.resources[res] || 0) + amount;
        }

        // Update trade status
        await this.cloud.client
            .from('trade_offers')
            .update({
                status: 'completed',
                buyer_id: this.cloud.user.id,
                completed_at: new Date()
            })
            .eq('id', tradeId);

        // Notify seller (via notification table if exists)
        this.game.notify("🎉 Trade completed!", "success");
        this.game.updateResourceUI();
        return true;
    }

    // --- Real-time Sync ---

    async subscribeToUpdates() {
        if (!this.cloud?.client) return;

        this.realtimeChannel = this.cloud.client.channel('global_events')
            .on('broadcast', { event: 'galaxy_event' }, (payload) => {
                this.handleGlobalEvent(payload);
            })
            .on('broadcast', { event: 'trade_update' }, (payload) => {
                if (payload.seller_id === this.cloud?.user?.id) {
                    this.game.notify("📦 Your trade was accepted!", "success");
                }
            })
            .subscribe();
    }

    handleGlobalEvent(payload) {
        // Handle global galaxy events
        if (payload.type === 'announcement') {
            this.game.notify(`📢 ${payload.message}`, 'info');
        }
    }

    unsubscribe() {
        if (this.realtimeChannel) {
            this.cloud.client.removeChannel(this.realtimeChannel);
        }
    }

    // --- System Claims (Meta-Galaxy) ---

    async fetchGalaxyState() {
        if (!this.cloud?.client) return;

        const { data } = await this.cloud.getClaimedSystems();
        if (data) {
            this.systemClaims = {};
            data.forEach(claim => {
                this.systemClaims[claim.system_id] = claim;
            });
            console.log(`Multiplayer: Synced ${data.length} claimed systems.`);
        }
    }

    isSystemClaimed(systemId) {
        return this.systemClaims[systemId] || null;
    }

    async claimCurrentSystem() {
        if (!this.cloud?.client || !this.cloud?.user) {
            this.game.notify("Must be logged in to claim systems!", "danger");
            return;
        }

        const sysId = this.game.currentSystemId; // Using current system ID
        const existing = this.isSystemClaimed(sysId);

        if (existing) {
            if (existing.profiles?.username) {
                this.game.notify(`System already claimed by ${existing.profiles.username}!`, "warning");
            } else {
                this.game.notify("System already claimed!", "warning");
            }
            return;
        }

        // Proceed to claim
        // Generate a name or use ID? For now, "Sector [ID]"
        const name = `Sector ${sysId}`;
        const coords = this.game.getTilePos(0); // Dummy coords or actual galaxy coords? 
        // We need Galaxy Coordinates. Accessing GalaxyGenerator via window or recalculating.
        // For simplicity, we just store 0,0,0 or null for now as visuals use ID mapping.

        const { error } = await this.cloud.claimSystem(sysId, name, { x: 0, y: 0, z: 0 });

        if (error) {
            this.game.notify("Failed to claim system.", "danger");
            console.error(error);
        } else {
            this.game.notify("🚩 System Claimed for the Empire!", "success");
            // Optimistic update
            this.systemClaims[sysId] = {
                system_id: sysId,
                user_id: this.cloud.user.id,
                profiles: { username: this.playerProfile?.username || 'You' }
            };
            // Trigger visual update if in galaxy view
            if (this.game.galaxyView) {
                // We'll need a way to refresh visuals. 
                // Currently just re-fetch or let realtime handle it?
                // For now, let's manual trigger:
                // this.game.galaxyView.updateSystemColor(sysId); // TODO implies GalaxyView method
            }
        }
    }

    // --- UI ---

    openLeaderboardUI() {
        this.fetchLeaderboard().then(entries => {
            let modal = document.getElementById('ep-leaderboard-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'ep-leaderboard-modal';
                modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #fbbf24;border-radius:15px;padding:30px;z-index:1000;min-width:500px;max-height:80vh;overflow-y:auto;';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <h2 style="color:#fbbf24;margin:0 0 15px 0;">🏆 Galactic Leaderboard</h2>
                <table style="width:100%;border-collapse:collapse;">
                    <tr style="color:#64748b;text-align:left;">
                        <th style="padding:8px;">#</th>
                        <th style="padding:8px;">Player</th>
                        <th style="padding:8px;">Score</th>
                        <th style="padding:8px;">Details</th>
                    </tr>
                    ${entries.map((e, i) => `
                        <tr style="background:${i % 2 === 0 ? '#1e293b' : '#0f172a'};">
                            <td style="padding:8px;color:${i < 3 ? '#fbbf24' : '#94a3b8'};">${i + 1}</td>
                            <td style="padding:8px;color:#38bdf8;">${e.profiles?.username || 'Unknown'}</td>
                            <td style="padding:8px;color:#22c55e;font-weight:bold;">${e.score?.toLocaleString()}</td>
                            <td style="padding:8px;color:#64748b;font-size:0.8em;">${e.details?.colonists || 0}👥 ${e.details?.structures || 0}🏠</td>
                        </tr>
                    `).join('')}
                </table>
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button onclick="window.game.multiplayer.submitToLeaderboard()" style="flex:1;padding:10px;background:#22c55e;color:#fff;border:none;border-radius:5px;cursor:pointer;">Submit My Score</button>
                    <button onclick="document.getElementById('ep-leaderboard-modal').remove()" style="flex:1;padding:10px;background:#334155;color:#fff;border:none;border-radius:5px;cursor:pointer;">Close</button>
                </div>
            `;
        });
    }

    openTradeUI() {
        this.fetchOpenTrades().then(trades => {
            let modal = document.getElementById('ep-trade-market-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'ep-trade-market-modal';
                modal.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#0f172a;border:2px solid #38bdf8;border-radius:15px;padding:30px;z-index:1000;min-width:550px;max-height:80vh;overflow-y:auto;';
                document.body.appendChild(modal);
            }

            modal.innerHTML = `
                <h2 style="color:#38bdf8;margin:0 0 15px 0;">🤝 Galactic Trade Market</h2>
                <p style="color:#64748b;font-size:0.9em;">Trade resources with other players across the galaxy!</p>
                
                <h3 style="color:#94a3b8;margin:15px 0 10px 0;">Open Offers</h3>
                <div id="trade-list" style="max-height:300px;overflow-y:auto;">
                    ${trades.length === 0 ? '<p style="color:#475569;text-align:center;">No open trades available</p>' :
                    trades.map(t => `
                        <div style="background:#1e293b;padding:15px;border-radius:8px;margin:10px 0;display:flex;justify-content:space-between;align-items:center;">
                            <div>
                                <div style="color:#fbbf24;">${t.profiles?.username || 'Unknown'}</div>
                                <div style="color:#22c55e;font-size:0.9em;">Offering: ${Object.entries(t.offering).map(([k, v]) => `${v} ${k}`).join(', ')}</div>
                                <div style="color:#ef4444;font-size:0.9em;">Wants: ${Object.entries(t.requesting).map(([k, v]) => `${v} ${k}`).join(', ')}</div>
                            </div>
                            <button onclick="window.game.multiplayer.acceptTrade('${t.id}')" style="padding:8px 15px;background:#22c55e;color:#fff;border:none;border-radius:5px;cursor:pointer;">Accept</button>
                        </div>
                    `).join('')}
                </div>

                <h3 style="color:#94a3b8;margin:15px 0 10px 0;">Create Offer</h3>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
                    <div>
                        <label style="color:#64748b;font-size:0.8em;">I'm Offering:</label>
                        <select id="offer-resource" style="width:100%;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:5px;">
                            <option value="minerals">Minerals</option>
                            <option value="energy">Energy</option>
                            <option value="alloys">Alloys</option>
                            <option value="circuits">Circuits</option>
                        </select>
                        <input type="number" id="offer-amount" value="50" min="1" style="width:100%;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:5px;margin-top:5px;">
                    </div>
                    <div>
                        <label style="color:#64748b;font-size:0.8em;">I Want:</label>
                        <select id="want-resource" style="width:100%;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:5px;">
                            <option value="energy">Energy</option>
                            <option value="minerals">Minerals</option>
                            <option value="alloys">Alloys</option>
                            <option value="circuits">Circuits</option>
                        </select>
                        <input type="number" id="want-amount" value="50" min="1" style="width:100%;padding:8px;background:#1e293b;color:#fff;border:1px solid #334155;border-radius:5px;margin-top:5px;">
                    </div>
                </div>
                
                <div style="display:flex;gap:10px;margin-top:20px;">
                    <button onclick="window.game.multiplayer.createTradeFromUI()" style="flex:1;padding:10px;background:#38bdf8;color:#0f172a;border:none;border-radius:5px;cursor:pointer;font-weight:bold;">Post Trade</button>
                    <button onclick="document.getElementById('ep-trade-market-modal').remove()" style="flex:1;padding:10px;background:#334155;color:#fff;border:none;border-radius:5px;cursor:pointer;">Close</button>
                </div>
            `;
        });
    }

    createTradeFromUI() {
        const offerRes = document.getElementById('offer-resource').value;
        const offerAmt = parseInt(document.getElementById('offer-amount').value) || 0;
        const wantRes = document.getElementById('want-resource').value;
        const wantAmt = parseInt(document.getElementById('want-amount').value) || 0;

        if (offerAmt <= 0 || wantAmt <= 0) {
            this.game.notify("Invalid amounts", "danger");
            return;
        }

        this.createTradeOffer(
            { [offerRes]: offerAmt },
            { [wantRes]: wantAmt }
        ).then(() => {
            document.getElementById('ep-trade-market-modal')?.remove();
        });
    }
}

window.MultiplayerManager = MultiplayerManager;
