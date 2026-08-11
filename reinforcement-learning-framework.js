/**
 * Reinforcement Learning Framework
 * Implements Q-learning, policy gradient, and other RL algorithms
 */

class ReinforcementLearningFramework {
    constructor() {
        this.environments = new Map();
        this.agents = new Map();
        this.trainingSessions = new Map();
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeEnvironments();
        });
    }

    /**
     * Initialize environments from DOM
     */
    initializeEnvironments() {
        const elements = document.querySelectorAll('[data-rl-environment]');
        elements.forEach(element => {
            const envId = element.getAttribute('data-rl-environment');
            const config = this.parseEnvironmentConfig(element);
            this.createEnvironment(envId, config);
        });
    }

    /**
     * Parse environment configuration
     */
    parseEnvironmentConfig(element) {
        return {
            type: element.getAttribute('data-env-type') || 'grid',
            width: parseInt(element.getAttribute('data-env-width')) || 10,
            height: parseInt(element.getAttribute('data-env-height')) || 10,
            rewards: this.parseRewards(element.getAttribute('data-env-rewards')),
            obstacles: this.parseObstacles(element.getAttribute('data-env-obstacles')),
            startState: element.getAttribute('data-env-start') || '0,0',
            goalState: element.getAttribute('data-env-goal') || '9,9'
        };
    }

    /**
     * Parse rewards configuration
     */
    parseRewards(rewardsStr) {
        if (!rewardsStr) return {};
        try {
            return JSON.parse(rewardsStr);
        } catch {
            return {};
        }
    }

    /**
     * Parse obstacles configuration
     */
    parseObstacles(obstaclesStr) {
        if (!obstaclesStr) return [];
        try {
            return JSON.parse(obstaclesStr);
        } catch {
            return [];
        }
    }

    /**
     * Create environment
     */
    createEnvironment(envId, config) {
        const environment = {
            id: envId,
            config,
            state: this.parseState(config.startState),
            goal: this.parseState(config.goalState),
            states: this.generateStates(config),
            actions: ['up', 'down', 'left', 'right'],
            qTable: new Map(),
            episodeHistory: []
        };

        this.environments.set(envId, environment);
        return environment;
    }

    /**
     * Parse state string to coordinates
     */
    parseState(stateStr) {
        const [x, y] = stateStr.split(',').map(Number);
        return { x, y };
    }

    /**
     * Generate all possible states
     */
    generateStates(config) {
        const states = [];
        for (let x = 0; x < config.width; x++) {
            for (let y = 0; y < config.height; y++) {
                states.push({ x, y });
            }
        }
        return states;
    }

    /**
     * Create Q-learning agent
     */
    createQLearningAgent(envId, config = {}) {
        const {
            learningRate = 0.1,
            discountFactor = 0.95,
            epsilon = 0.1,
            epsilonDecay = 0.995,
            minEpsilon = 0.01
        } = config;

        const environment = this.environments.get(envId);
        if (!environment) {
            throw new Error(`Environment ${envId} not found`);
        }

        const agent = {
            id: `agent_${Date.now()}`,
            envId,
            learningRate,
            discountFactor,
            epsilon,
            epsilonDecay,
            minEpsilon,
            algorithm: 'q-learning',
            qTable: new Map(),
            episodeCount: 0,
            totalReward: 0
        };

        // Initialize Q-table
        environment.states.forEach(state => {
            environment.actions.forEach(action => {
                const key = this.getStateActionKey(state, action);
                agent.qTable.set(key, 0);
            });
        });

        this.agents.set(agent.id, agent);
        return agent;
    }

    /**
     * Get state-action key
     */
    getStateActionKey(state, action) {
        return `${state.x},${state.y},${action}`;
    }

    /**
     * Choose action using epsilon-greedy policy
     */
    chooseAction(agent, state, environment) {
        if (Math.random() < agent.epsilon) {
            // Exploration: random action
            return environment.actions[Math.floor(Math.random() * environment.actions.length)];
        }

        // Exploitation: best action
        let bestAction = null;
        let bestValue = -Infinity;

        environment.actions.forEach(action => {
            const key = this.getStateActionKey(state, action);
            const value = agent.qTable.get(key) || 0;
            if (value > bestValue) {
                bestValue = value;
                bestAction = action;
            }
        });

        return bestAction || environment.actions[0];
    }

    /**
     * Execute action in environment
     */
    executeAction(environment, state, action) {
        let newState = { ...state };

        switch (action) {
            case 'up':
                newState.y = Math.max(0, state.y - 1);
                break;
            case 'down':
                newState.y = Math.min(environment.config.height - 1, state.y + 1);
                break;
            case 'left':
                newState.x = Math.max(0, state.x - 1);
                break;
            case 'right':
                newState.x = Math.min(environment.config.width - 1, state.x + 1);
                break;
        }

        // Check for obstacles
        const isObstacle = environment.config.obstacles.some(
            obs => obs.x === newState.x && obs.y === newState.y
        );

        if (isObstacle) {
            newState = state; // Stay in place
        }

        const reward = this.calculateReward(environment, newState);
        const isTerminal = this.isTerminalState(environment, newState);

        return {
            newState,
            reward,
            isTerminal
        };
    }

    /**
     * Calculate reward for state
     */
    calculateReward(environment, state) {
        // Goal reward
        if (state.x === environment.goal.x && state.y === environment.goal.y) {
            return 100;
        }

        // Custom rewards
        const stateKey = `${state.x},${state.y}`;
        if (environment.config.rewards[stateKey]) {
            return environment.config.rewards[stateKey];
        }

        // Default small negative reward (encourage reaching goal)
        return -0.1;
    }

    /**
     * Check if state is terminal
     */
    isTerminalState(environment, state) {
        return state.x === environment.goal.x && state.y === environment.goal.y;
    }

    /**
     * Update Q-value using Q-learning
     */
    updateQValue(agent, state, action, reward, nextState, environment) {
        const key = this.getStateActionKey(state, action);
        const currentQ = agent.qTable.get(key) || 0;

        // Get max Q-value for next state
        let maxNextQ = -Infinity;
        environment.actions.forEach(nextAction => {
            const nextKey = this.getStateActionKey(nextState, nextAction);
            const nextQ = agent.qTable.get(nextKey) || 0;
            maxNextQ = Math.max(maxNextQ, nextQ);
        });

        // Q-learning update
        const newQ = currentQ + agent.learningRate * (
            reward + agent.discountFactor * maxNextQ - currentQ
        );

        agent.qTable.set(key, newQ);
    }

    /**
     * Train agent for one episode
     */
    trainEpisode(agentId, maxSteps = 1000) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            throw new Error(`Agent ${agentId} not found`);
        }

        const environment = this.environments.get(agent.envId);
        let state = { ...environment.state };
        let totalReward = 0;
        const steps = [];

        for (let step = 0; step < maxSteps; step++) {
            const action = this.chooseAction(agent, state, environment);
            const { newState, reward, isTerminal } = this.executeAction(environment, state, action);

            this.updateQValue(agent, state, action, reward, newState, environment);

            steps.push({
                state: { ...state },
                action,
                reward,
                newState: { ...newState }
            });

            totalReward += reward;
            state = newState;

            if (isTerminal) {
                break;
            }
        }

        // Decay epsilon
        agent.epsilon = Math.max(agent.minEpsilon, agent.epsilon * agent.epsilonDecay);
        agent.episodeCount++;
        agent.totalReward += totalReward;

        return {
            steps,
            totalReward,
            episodeLength: steps.length
        };
    }

    /**
     * Train agent for multiple episodes
     */
    async train(agentId, episodes = 100, onProgress = null) {
        const results = [];

        for (let episode = 0; episode < episodes; episode++) {
            const result = this.trainEpisode(agentId);
            results.push(result);

            if (onProgress) {
                await onProgress({
                    episode: episode + 1,
                    totalReward: result.totalReward,
                    episodeLength: result.episodeLength,
                    agent: this.agents.get(agentId)
                });
            }

            // Small delay to prevent blocking
            if (episode % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }

        return results;
    }

    /**
     * Get optimal policy
     */
    getOptimalPolicy(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return null;
        }

        const environment = this.environments.get(agent.envId);
        const policy = new Map();

        environment.states.forEach(state => {
            let bestAction = null;
            let bestValue = -Infinity;

            environment.actions.forEach(action => {
                const key = this.getStateActionKey(state, action);
                const value = agent.qTable.get(key) || 0;
                if (value > bestValue) {
                    bestValue = value;
                    bestAction = action;
                }
            });

            policy.set(`${state.x},${state.y}`, bestAction);
        });

        return policy;
    }

    /**
     * Visualize Q-table
     */
    visualizeQTable(agentId, containerId) {
        const agent = this.agents.get(agentId);
        if (!agent) {
            return;
        }

        const environment = this.environments.get(agent.envId);
        const container = document.getElementById(containerId);
        if (!container) {
            return;
        }

        const table = document.createElement('table');
        table.className = 'q-table-visualization';

        for (let y = 0; y < environment.config.height; y++) {
            const row = document.createElement('tr');
            for (let x = 0; x < environment.config.width; x++) {
                const cell = document.createElement('td');
                const state = { x, y };

                const actionValues = {};
                environment.actions.forEach(action => {
                    const key = this.getStateActionKey(state, action);
                    actionValues[action] = agent.qTable.get(key) || 0;
                });

                cell.innerHTML = `
                    <div class="q-values">
                        ${Object.entries(actionValues).map(([action, value]) => `
                            <div class="q-value ${action}">${action}: ${value.toFixed(2)}</div>
                        `).join('')}
                    </div>
                `;

                row.appendChild(cell);
            }
            table.appendChild(row);
        }

        container.innerHTML = '';
        container.appendChild(table);
    }
}

// Auto-initialize
const reinforcementLearningFramework = new ReinforcementLearningFramework();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReinforcementLearningFramework;
}

