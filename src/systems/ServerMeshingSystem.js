/**
 * 🌐 Era III: Server Meshing Architecture
 * 
 * Enables 100,000+ players in a single persistent shard through distributed
 * server meshing, dynamic load balancing, and seamless cross-shard transitions.
 */

class ServerMeshingSystem {
    constructor(game) {
        this.game = game;
        this.currentShard = null;
        this.shardMap = new Map();
        this.playerShardAssignments = new Map();
        this.meshConnections = new Map();
        this.loadBalancingEnabled = true;
        
        console.log("🌐 Server Meshing System: Initializing distributed architecture...");
    }
    
    /**
     * Initialize the server mesh
     */
    async initializeMesh() {
        // Fetch available shards from the server
        const shards = await this.fetchAvailableShards();
        
        // Build shard map
        shards.forEach(shard => {
            this.shardMap.set(shard.id, shard);
        });
        
        // Connect to optimal shard for this player
        await this.connectToOptimalShard();
        
        // Start mesh monitoring
        this.startMeshMonitoring();
        
        console.log(`🌐 Server Mesh Initialized: ${shards.length} shards available`);
    }
    
    /**
     * Fetch available shards from the server
     */
    async fetchAvailableShards() {
        try {
            const response = await fetch('/api/server-mesh/shards');
            const data = await response.json();
            return data.shards || [];
        } catch (error) {
            console.error('Failed to fetch shards:', error);
            return [];
        }
    }
    
    /**
     * Connect to the optimal shard for this player
     */
    async connectToOptimalShard() {
        const playerId = this.game.playerId;
        
        // Check if player already has a shard assignment
        const assignment = await this.getPlayerShardAssignment(playerId);
        
        if (assignment) {
            this.currentShard = this.shardMap.get(assignment.shard_id);
            if (this.currentShard && this.currentShard.status === 'active') {
                console.log(`🌐 Reconnecting to existing shard: ${this.currentShard.shard_name}`);
                return;
            }
        }
        
        // Find optimal shard based on load and location
        const optimalShard = this.findOptimalShard();
        
        if (optimalShard) {
            await this.assignToShard(playerId, optimalShard.id);
            this.currentShard = optimalShard;
            console.log(`🌐 Connected to new shard: ${optimalShard.shard_name}`);
        } else {
            console.error('🌐 No available shards found');
        }
    }
    
    /**
     * Find the optimal shard based on load and location
     */
    findOptimalShard() {
        const activeShards = Array.from(this.shardMap.values())
            .filter(shard => shard.status === 'active')
            .filter(shard => shard.current_players < shard.capacity);
        
        if (activeShards.length === 0) {
            return null;
        }
        
        // Sort by load (least loaded first)
        activeShards.sort((a, b) => {
            const loadA = a.current_players / a.capacity;
            const loadB = b.current_players / b.capacity;
            return loadA - loadB;
        });
        
        return activeShards[0];
    }
    
    /**
     * Assign player to a shard
     */
    async assignToShard(playerId, shardId) {
        try {
            const response = await fetch('/api/server-mesh/assign', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    shard_id: shardId
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.playerShardAssignments.set(playerId, shardId);
            }
            
            return data;
        } catch (error) {
            console.error('Failed to assign to shard:', error);
            return null;
        }
    }
    
    /**
     * Get player's shard assignment
     */
    async getPlayerShardAssignment(playerId) {
        try {
            const response = await fetch(`/api/server-mesh/assignment?player_id=${playerId}`);
            const data = await response.json();
            return data.assignment || null;
        } catch (error) {
            console.error('Failed to get shard assignment:', error);
            return null;
        }
    }
    
    /**
     * Start monitoring the mesh for load balancing
     */
    startMeshMonitoring() {
        // Check shard load every 30 seconds
        setInterval(async () => {
            if (!this.loadBalancingEnabled) return;
            
            await this.checkShardLoad();
        }, 30000);
    }
    
    /**
     * Check shard load and trigger rebalancing if needed
     */
    async checkShardLoad() {
        if (!this.currentShard) return;
        
        const load = this.currentShard.current_players / this.currentShard.capacity;
        
        // If shard is overloaded (80%+), consider migration
        if (load > 0.8) {
            console.log(`🌐 Shard ${this.currentShard.shard_name} is overloaded (${(load * 100).toFixed(1)}%)`);
            await this.considerShardMigration();
        }
    }
    
    /**
     * Consider migrating to a less loaded shard
     */
    async considerShardMigration() {
        const optimalShard = this.findOptimalShard();
        
        if (!optimalShard) return;
        
        const currentLoad = this.currentShard.current_players / this.currentShard.capacity;
        const targetLoad = optimalShard.current_players / optimalShard.capacity;
        
        // Only migrate if target is significantly less loaded
        if (targetLoad < currentLoad - 0.2) {
            console.log(`🌐 Initiating shard migration to ${optimalShard.shard_name}`);
            await this.migrateToShard(optimalShard);
        }
    }
    
    /**
     * Migrate to a new shard
     */
    async migrateToShard(targetShard) {
        const playerId = this.game.playerId;
        
        // Save current game state
        const gameState = this.game.saveState();
        
        // Transfer state to new shard
        try {
            const response = await fetch('/api/server-mesh/migrate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: playerId,
                    from_shard_id: this.currentShard.id,
                    to_shard_id: targetShard.id,
                    game_state: gameState
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.currentShard = targetShard;
                this.playerShardAssignments.set(playerId, targetShard.id);
                console.log(`🌐 Successfully migrated to ${targetShard.shard_name}`);
                
                // Dispatch event for UI update
                window.dispatchEvent(new CustomEvent('SHARD_MIGRATED', {
                    detail: {
                        fromShard: this.currentShard,
                        toShard: targetShard
                    }
                }));
            }
        } catch (error) {
            console.error('Failed to migrate shard:', error);
        }
    }
    
    /**
     * Get mesh statistics
     */
    async getMeshStatistics() {
        try {
            const response = await fetch('/api/server-mesh/statistics');
            const data = await response.json();
            return data.statistics || {};
        } catch (error) {
            console.error('Failed to get mesh statistics:', error);
            return {};
        }
    }
    
    /**
     * Get current shard info
     */
    getCurrentShardInfo() {
        if (!this.currentShard) {
            return null;
        }
        
        return {
            id: this.currentShard.id,
            name: this.currentShard.shard_name,
            region: this.currentShard.region,
            players: this.currentShard.current_players,
            capacity: this.currentShard.capacity,
            load: this.currentShard.current_players / this.currentShard.capacity,
            status: this.currentShard.status
        };
    }
    
    /**
     * Enable or disable load balancing
     */
    setLoadBalancing(enabled) {
        this.loadBalancingEnabled = enabled;
        console.log(`🌐 Load balancing ${enabled ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * Handle cross-shard communication
     */
    async sendCrossShardMessage(targetShardId, message) {
        try {
            const response = await fetch('/api/server-mesh/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_shard_id: this.currentShard.id,
                    to_shard_id: targetShardId,
                    message: message
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to send cross-shard message:', error);
            return null;
        }
    }
    
    /**
     * Broadcast message to all shards
     */
    async broadcastToAllShards(message) {
        try {
            const response = await fetch('/api/server-mesh/broadcast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from_shard_id: this.currentShard.id,
                    message: message
                })
            });
            
            return await response.json();
        } catch (error) {
            console.error('Failed to broadcast to all shards:', error);
            return null;
        }
    }
    
    /**
     * Get nearby players in the same shard
     */
    async getNearbyPlayers(radius = 1000) {
        if (!this.currentShard) return [];
        
        try {
            const response = await fetch(
                `/api/server-mesh/nearby?shard_id=${this.currentShard.id}&player_id=${this.game.playerId}&radius=${radius}`
            );
            const data = await response.json();
            return data.players || [];
        } catch (error) {
            console.error('Failed to get nearby players:', error);
            return [];
        }
    }
    
    /**
     * Disconnect from current shard
     */
    async disconnect() {
        if (!this.currentShard) return;
        
        try {
            await fetch('/api/server-mesh/disconnect', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    player_id: this.game.playerId,
                    shard_id: this.currentShard.id
                })
            });
            
            console.log(`🌐 Disconnected from ${this.currentShard.shard_name}`);
            this.currentShard = null;
        } catch (error) {
            console.error('Failed to disconnect from shard:', error);
        }
    }
}

// Expose for use
if (typeof window !== 'undefined') {
    window.ServerMeshingSystem = ServerMeshingSystem;
}
