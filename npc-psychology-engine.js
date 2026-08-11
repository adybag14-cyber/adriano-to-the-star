/**
 * 🧠 EXOPLANET PIONEER: NPC PSYCHOLOGY ENGINE
 * Item 1005: NPC psychological trauma modeling with persistent behavioral symptoms.
 */

class NPCPsychologyEngine {
    constructor() {
        this.npcProfiles = new Map();
        console.log("🧠 Psychology Engine: Neural response patterns mapped.");
    }

    /**
     * Update NPC mental state based on game events.
     */
    processTrauma(npcId, stressSource) {
        if (!this.npcProfiles.has(npcId)) {
            this.npcProfiles.set(npcId, { trauma: 0, resilience: 0.5, symptoms: [] });
        }
        
        const profile = this.npcProfiles.get(npcId);
        const gain = stressSource.intensity * (1.0 - profile.resilience);
        profile.trauma = Math.min(1.0, profile.trauma + gain);
        
        if (profile.trauma > 0.7) {
            this._addSymptom(profile, "HYPER_VIGILANCE");
        }
        
        console.log(`[MENTAL] NPC ${npcId} trauma increased to ${profile.trauma.toFixed(2)}.`);
    }

    _addSymptom(profile, type) {
        if (!profile.symptoms.includes(type)) {
            profile.symptoms.push(type);
            console.warn(`[DIAGNOSIS] NPC exhibiting persistent symptom: ${type}`);
        }
    }

    getBehaviorModifiers(npcId) {
        const profile = this.npcProfiles.get(npcId);
        if (!profile) return {};
        
        return {
            workSpeed: 1.0 - (profile.trauma * 0.5),
            socialOpenness: profile.symptoms.includes("HYPER_VIGILANCE") ? 0.2 : 1.0
        };
    }
}

export const npcPsychology = new NPCPsychologyEngine();
window.npcPsychology = npcPsychology;
