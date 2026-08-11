class ReinforcementLearning {
  constructor() { this.qTable = {}; this.epsilon = 0.1; this.alpha = 0.1; this.gamma = 0.9; }
  getStateKey(state) { return JSON.stringify(state); }
  getAction(state, actions) {
    const stateKey = this.getStateKey(state);
    if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
    if (Math.random() < this.epsilon) {
      return actions[Math.floor(Math.random() * actions.length)];
    }
    let bestAction = actions[0];
    let bestValue = this.qTable[stateKey][bestAction] || 0;
    for (const action of actions) {
      const value = this.qTable[stateKey][action] || 0;
      if (value > bestValue) {
        bestValue = value;
        bestAction = action;
      }
    }
    return bestAction;
  }
  update(state, action, reward, nextState, done) {
    const stateKey = this.getStateKey(state);
    const nextStateKey = this.getStateKey(nextState);
    if (!this.qTable[stateKey]) this.qTable[stateKey] = {};
    if (!this.qTable[nextStateKey]) this.qTable[nextStateKey] = {};
    const currentQ = this.qTable[stateKey][action] || 0;
    let maxNextQ = 0;
    for (const a in this.qTable[nextStateKey]) {
      maxNextQ = Math.max(maxNextQ, this.qTable[nextStateKey][a]);
    }
    const newQ = currentQ + this.alpha * (reward + this.gamma * maxNextQ * (done ? 0 : 1) - currentQ);
    this.qTable[stateKey][action] = newQ;
  }
  train(episodes=1000) {
    for (let i = 0; i < episodes; i++) {
      this.update({ pos: 0 }, 'right', 1, { pos: 1 }, false);
    }
    return { episodes, finalEpsilon: this.epsilon };
  }
}
window.ReinforcementLearning = ReinforcementLearning;