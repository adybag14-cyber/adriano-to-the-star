/**
 * Narrative Manager
 * Handles quest state, branching dialogue, and lore collection.
 * Part of the Asset Production Roadmap - Category 4.
 */

class NarrativeManager {
    constructor(game) {
        this.game = game;
        this.activeQuests = new Map();
        this.completedQuests = new Set();
        this.loreCollection = new Set();
        this.dialogueStack = [];
        
        this.init();
    }

    init() {
        console.log("📖 Narrative Manager initialized.");
        this.loadNarrativeState();
    }

    /**
     * Saves narrative state to localStorage.
     * Roadmap Item 401: Persistent quest data.
     */
    saveNarrativeState() {
        const state = {
            activeQuests: Array.from(this.activeQuests.entries()),
            completedQuests: Array.from(this.completedQuests),
            loreCollection: Array.from(this.loreCollection)
        };
        localStorage.setItem('ep_narrative_state', JSON.stringify(state));
        console.log("💾 Narrative state saved.");
    }

    /**
     * Loads narrative state from localStorage.
     */
    loadNarrativeState() {
        const saved = localStorage.getItem('ep_narrative_state');
        if (!saved) return;
        try {
            const state = JSON.parse(saved);
            this.activeQuests = new Map(state.activeQuests);
            this.completedQuests = new Set(state.completedQuests);
            this.loreCollection = new Set(state.loreCollection);
            console.log("📂 Narrative state loaded.");
        } catch (e) {
            console.error("❌ Failed to load narrative state:", e);
        }
    }

    /**
     * Starts a quest from the manifest.
     */
    startQuest(questId) {
        if (this.activeQuests.has(questId) || this.completedQuests.has(questId)) return;
        
        const questDef = this.findQuestById(questId);
        if (!questDef) {
            console.error(`Quest definition not found: ${questId}`);
            return;
        }

        const questState = {
            id: questId,
            name: questDef.name,
            status: 'active',
            progress: 0,
            startTime: Date.now(),
            metadata: questDef.metadata
        };

        this.activeQuests.set(questId, questState);
        this.game.notify(`New Quest: ${questDef.name}`, 'info');
        this.saveNarrativeState();
        
        // Logic for triggering initial objectives...
    }

    /**
     * Progresses a quest objective.
     */
    advanceQuest(questId, amount = 1) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        quest.progress += amount;
        if (quest.progress >= 100) {
            this.completeQuest(questId);
        } else {
            this.saveNarrativeState();
        }
    }

    completeQuest(questId) {
        const quest = this.activeQuests.get(questId);
        if (!quest) return;

        quest.status = 'completed';
        this.completedQuests.add(questId);
        this.activeQuests.delete(questId);
        
        this.game.notify(`Quest Completed: ${quest.name}`, 'success');
        this.grantRewards(quest.metadata.rewards);
        this.saveNarrativeState();
    }

    /**
     * Adds a lore fragment to the player's collection.
     */
    collectLore(loreId) {
        if (this.loreCollection.has(loreId)) return;
        
        this.loreCollection.add(loreId);
        this.game.notify("New Lore Discovered!", "info");
        this.saveNarrativeState();
    }

    /**
     * Triggers a dialogue sequence.
     */
    triggerDialogue(dialogueId) {
        const diagDef = this.findDialogueById(dialogueId);
        if (!diagDef) return;

        console.log(`Starting dialogue with: ${diagDef.name}`);
        // Logic for UI rendering of dialogue trees...
    }

    grantRewards(rewards) {
        if (!rewards) return;
        rewards.forEach(reward => {
            console.log(`Granting reward: ${reward}`);
            // Logic for adding items/reputation to player state...
        });
    }

    findQuestById(id) {
        return this.game.assetManifest?.narrative?.mainQuest.id === id ? this.game.assetManifest.narrative.mainQuest : null;
    }

    findDialogueById(id) {
        const diags = this.game.assetManifest?.narrative?.dialogues;
        return Object.values(diags || {}).find(d => d.id === id);
    }
}

if (typeof window !== 'undefined') {
    window.NarrativeManager = NarrativeManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = NarrativeManager;
}
