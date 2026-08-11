/**
 * Exoplanet Pioneer Backend Client
 * A client library for interacting with the Exoplanet Pioneer backend APIs
 */

class BackendClient {
  constructor(baseUrl = '/api') {
    this.baseUrl = baseUrl;
    this.playerId = null;
  }

  /**
   * Set the current player ID
   */
  setPlayerId(playerId) {
    this.playerId = playerId;
  }

  /**
   * Get the current player ID
   */
  getPlayerId() {
    return this.playerId;
  }

  /**
   * Helper method to make API requests
   */
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    if (config.body && typeof config.body === 'object') {
      config.body = JSON.stringify(config.body);
    }

    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(data?.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return data;
  }

  // ==================== SAVES API ====================

  /**
   * Get all saves for the current player
   */
  async getSaves() {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/saves?player_id=${this.playerId}`);
  }

  /**
   * Get a specific save
   */
  async getSave(saveId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/saves?player_id=${this.playerId}&save_id=${saveId}`);
  }

  /**
   * Save game data
   */
  async saveGame(saveData, options = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/saves', {
      method: 'POST',
      body: {
        player_id: this.playerId,
        save_data: saveData,
        save_name: options.saveName,
        is_autosave: options.isAutosave || false,
        playtime: options.playtime || 0,
        version: options.version || '1.0.0'
      }
    });
  }

  /**
   * Update an existing save
   */
  async updateSave(saveId, saveData, options = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/saves', {
      method: 'POST',
      body: {
        player_id: this.playerId,
        save_id: saveId,
        save_data: saveData,
        save_name: options.saveName,
        is_autosave: options.isAutosave || false,
        playtime: options.playtime || 0,
        version: options.version || '1.0.0'
      }
    });
  }

  /**
   * Clone a save
   */
  async cloneSave(saveId, newName) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/saves', {
      method: 'PUT',
      body: {
        player_id: this.playerId,
        save_id: saveId,
        new_name: newName
      }
    });
  }

  /**
   * Delete a save
   */
  async deleteSave(saveId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/saves?player_id=${this.playerId}&save_id=${saveId}`, {
      method: 'DELETE'
    });
  }

  // ==================== ACHIEVEMENTS API ====================

  /**
   * Get all achievements for the current player
   */
  async getAchievements() {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/achievements?player_id=${this.playerId}`);
  }

  /**
   * Get a specific achievement status
   */
  async getAchievement(achievementId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/achievements?player_id=${this.playerId}&achievement_id=${achievementId}`);
  }

  /**
   * Unlock an achievement
   */
  async unlockAchievement(achievementId, metadata = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/achievements', {
      method: 'POST',
      body: {
        player_id: this.playerId,
        achievement_id: achievementId,
        metadata
      }
    });
  }

  /**
   * Get achievement definitions
   */
  async getAchievementDefinitions() {
    return this.request('/achievements', {
      method: 'OPTIONS'
    });
  }

  // ==================== TRADES API ====================

  /**
   * Create a new trade offer
   */
  async createTrade(tradeData) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/trades', {
      method: 'POST',
      body: {
        player_id: this.playerId,
        ...tradeData
      }
    });
  }

  /**
   * Get all trades for the current player
   */
  async getTrades(options = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    const params = new URLSearchParams({ player_id: this.playerId });
    if (options.status) params.append('status', options.status);
    if (options.type) params.append('type', options.type);
    return this.request(`/trades?${params.toString()}`);
  }

  /**
   * Get sent trades
   */
  async getSentTrades(options = {}) {
    return this.getTrades({ ...options, type: 'sent' });
  }

  /**
   * Get received trades
   */
  async getReceivedTrades(options = {}) {
    return this.getTrades({ ...options, type: 'received' });
  }

  /**
   * Update trade status (accept/reject/cancel)
   */
  async updateTrade(tradeId, status) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/trades', {
      method: 'PUT',
      body: {
        trade_id: tradeId,
        player_id: this.playerId,
        status
      }
    });
  }

  /**
   * Accept a trade
   */
  async acceptTrade(tradeId) {
    return this.updateTrade(tradeId, 'accepted');
  }

  /**
   * Reject a trade
   */
  async rejectTrade(tradeId) {
    return this.updateTrade(tradeId, 'rejected');
  }

  /**
   * Cancel a trade
   */
  async cancelTrade(tradeId) {
    return this.updateTrade(tradeId, 'cancelled');
  }

  /**
   * Delete a trade
   */
  async deleteTrade(tradeId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request(`/trades?player_id=${this.playerId}&trade_id=${tradeId}`, {
      method: 'DELETE'
    });
  }

  // ==================== LEADERBOARD API ====================

  /**
   * Get leaderboard
   */
  async getLeaderboard(options = {}) {
    const params = new URLSearchParams();
    if (options.category) params.append('category', options.category);
    params.append('limit', String(options.limit || 50));
    params.append('offset', String(options.offset || 0));
    if (this.playerId) params.append('player_id', this.playerId);
    return this.request(`/leaderboard?${params.toString()}`);
  }

  /**
   * Get player ranking
   */
  async getPlayerRank(category = 'total_score') {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.getLeaderboard({ category, limit: 1 });
  }

  /**
   * Update player stats
   */
  async updateStats(stats) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/leaderboard', {
      method: 'POST',
      body: {
        player_id: this.playerId,
        stats
      }
    });
  }

  /**
   * Increment a stat
   */
  async incrementStat(statName, amount = 1) {
    return this.updateStats({ [statName]: amount });
  }

  /**
   * Get available leaderboard categories
   */
  async getLeaderboardCategories() {
    return this.request('/leaderboard', {
      method: 'OPTIONS'
    });
  }

  // ==================== MULTIPLAYER API ====================

  /**
   * Create a new game room
   */
  async createRoom(roomData) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'create_room',
        player_id: this.playerId,
        data: roomData
      }
    });
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'join_room',
        player_id: this.playerId,
        room_id: roomId
      }
    });
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'leave_room',
        player_id: this.playerId,
        room_id: roomId
      }
    });
  }

  /**
   * Broadcast a message to a room
   */
  async broadcast(roomId, data) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'broadcast',
        player_id: this.playerId,
        room_id: roomId,
        data
      }
    });
  }

  /**
   * Get room state
   */
  async getRoomState(roomId) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'get_state',
        player_id: this.playerId,
        room_id: roomId
      }
    });
  }

  /**
   * List available rooms
   */
  async listRooms(options = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'list_rooms',
        player_id: this.playerId,
        data: options
      }
    });
  }

  /**
   * Find a match (simple matchmaking)
   */
  async findMatch(options = {}) {
    if (!this.playerId) throw new Error('Player ID not set');
    return this.request('/multiplayer', {
      method: 'POST',
      body: {
        action: 'find_match',
        player_id: this.playerId,
        data: options
      }
    });
  }

  /**
   * Get available game modes
   */
  async getGameModes() {
    return this.request('/multiplayer');
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Auto-save the current game state
   */
  async autoSave(gameState, playtime = 0) {
    return this.saveGame(gameState, {
      saveName: 'Autosave',
      isAutosave: true,
      playtime
    });
  }

  /**
   * Quick save (named save)
   */
  async quickSave(gameState, playtime = 0) {
    return this.saveGame(gameState, {
      saveName: `Quick Save ${new Date().toLocaleTimeString()}`,
      isAutosave: false,
      playtime
    });
  }

  /**
   * Report game progress for achievements and stats
   */
  async reportProgress(progress) {
    const promises = [];

    // Update stats
    if (progress.stats) {
      promises.push(this.updateStats(progress.stats));
    }

    // Check and unlock achievements
    if (progress.achievements) {
      for (const achievementId of progress.achievements) {
        promises.push(
          this.unlockAchievement(achievementId, progress.achievementMetadata || {})
        );
      }
    }

    return Promise.all(promises);
  }
}

// Export singleton instance
const backendClient = new BackendClient();

// Also export class for custom instances
export { BackendClient };
export default backendClient;
