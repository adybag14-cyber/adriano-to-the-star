/**
 * Reinforcement Learning
 * Reinforcement learning framework
 */

class ReinforcementLearning {
    constructor() {
        this.agents = new Map();
        this.environments = new Map();
        this.episodes = new Map();
        this.init();
    }

    init() {
        this.trackEvent('r_ei_nf_or_ce_me_nt_le_ar_ni_ng_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("r_ei_nf_or_ce_me_nt_le_ar_ni_ng_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    createAgent(agentId, agentData) {
        const agent = {
            id: agentId,
            ...agentData,
            name: agentData.name || agentId,
            algorithm: agentData.algorithm || 'q_learning',
            policy: agentData.policy || {},
            qTable: agentData.qTable || {},
            learningRate: agentData.learningRate || 0.1,
            discountFactor: agentData.discountFactor || 0.9,
            createdAt: new Date()
        };
        
        this.agents.set(agentId, agent);
        console.log(`RL agent created: ${agentId}`);
        return agent;
    }

    createEnvironment(envId, envData) {
        const environment = {
            id: envId,
            ...envData,
            name: envData.name || envId,
            states: envData.states || [],
            actions: envData.actions || [],
            rewards: envData.rewards || {},
            createdAt: new Date()
        };
        
        this.environments.set(envId, environment);
        console.log(`Environment created: ${envId}`);
        return environment;
    }

    async runEpisode(agentId, envId) {
        const agent = this.agents.get(agentId);
        const environment = this.environments.get(envId);
        
        if (!agent) {
            throw new Error('Agent not found');
        }
        if (!environment) {
            throw new Error('Environment not found');
        }
        
        const episode = {
            id: `episode_${Date.now()}`,
            agentId,
            envId,
            steps: [],
            totalReward: 0,
            status: 'running',
            startedAt: new Date(),
            createdAt: new Date()
        };
        
        this.episodes.set(episode.id, episode);
        
        let state = this.getInitialState(environment);
        let done = false;
        let stepCount = 0;
        
        while (!done && stepCount < 1000) {
            const action = this.selectAction(agent, state, environment);
            const { nextState, reward, done: isDone } = this.step(environment, state, action);
            
            episode.steps.push({
                state,
                action,
                reward,
                nextState
            });
            
            episode.totalReward += reward;
            
            this.updateQValue(agent, state, action, reward, nextState);
            
            state = nextState;
            done = isDone;
            stepCount++;
        }
        
        episode.status = 'completed';
        episode.completedAt = new Date();
        episode.stepCount = stepCount;
        
        return episode;
    }

    getInitialState(environment) {
        return environment.states[0] || 'start';
    }

    selectAction(agent, state, environment) {
        if (Math.random() < 0.1) {
            return environment.actions[Math.floor(Math.random() * environment.actions.length)];
        }
        
        const qValues = environment.actions.map(action => 
            agent.qTable[`${state}_${action}`] || 0
        );
        
        const maxQ = Math.max(...qValues);
        const bestActions = environment.actions.filter((action, index) => 
            qValues[index] === maxQ
        );
        
        return bestActions[Math.floor(Math.random() * bestActions.length)];
    }

    step(environment, state, action) {
        const reward = environment.rewards[`${state}_${action}`] || 0;
        const nextState = environment.states[Math.floor(Math.random() * environment.states.length)];
        const done = Math.random() < 0.1;
        
        return { nextState, reward, done };
    }

    updateQValue(agent, state, action, reward, nextState) {
        const key = `${state}_${action}`;
        const currentQ = agent.qTable[key] || 0;
        
        const nextQValues = Object.keys(agent.qTable)
            .filter(k => k.startsWith(`${nextState}_`))
            .map(k => agent.qTable[k]);
        
        const maxNextQ = nextQValues.length > 0 ? Math.max(...nextQValues) : 0;
        const newQ = currentQ + agent.learningRate * (reward + agent.discountFactor * maxNextQ - currentQ);
        
        agent.qTable[key] = newQ;
    }

    getAgent(agentId) {
        return this.agents.get(agentId);
    }

    getEnvironment(envId) {
        return this.environments.get(envId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.reinforcementLearning = new ReinforcementLearning();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReinforcementLearning;
}
