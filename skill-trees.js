/**
 * Skill Trees
 * @class SkillTrees
 * @description Manages skill trees with unlockable skills and prerequisites.
 */
class SkillTrees {
    constructor() {
        this.skillTrees = new Map();
        this.userSkills = new Map();
        this.init();
    }

    init() {
        this.trackEvent('s_ki_ll_tr_ee_s_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("s_ki_ll_tr_ee_s_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    /**
     * Create a skill tree.
     * @param {string} treeId - Tree identifier.
     * @param {object} treeData - Tree data.
     */
    createSkillTree(treeId, treeData) {
        this.skillTrees.set(treeId, {
            ...treeData,
            id: treeId,
            skills: treeData.skills || [],
            createdAt: new Date()
        });
        console.log(`Skill tree created: ${treeId}`);
    }

    /**
     * Add skill to tree.
     * @param {string} treeId - Tree identifier.
     * @param {object} skillData - Skill data.
     */
    addSkill(treeId, skillData) {
        const tree = this.skillTrees.get(treeId);
        if (tree) {
            tree.skills.push({
                ...skillData,
                id: skillData.id || `skill_${Date.now()}`,
                prerequisites: skillData.prerequisites || [],
                unlocked: false
            });
            console.log(`Skill added to tree ${treeId}`);
        }
    }

    /**
     * Unlock skill for user.
     * @param {string} userId - User identifier.
     * @param {string} treeId - Tree identifier.
     * @param {string} skillId - Skill identifier.
     */
    unlockSkill(userId, treeId, skillId) {
        const tree = this.skillTrees.get(treeId);
        if (!tree) {
            throw new Error(`Skill tree not found: ${treeId}`);
        }

        const skill = tree.skills.find(s => s.id === skillId);
        if (!skill) {
            throw new Error(`Skill not found: ${skillId}`);
        }

        // Check prerequisites
        const userSkillKey = `${userId}_${treeId}`;
        const userSkills = this.userSkills.get(userSkillKey) || new Set();
        
        const prerequisitesMet = skill.prerequisites.every(prereq => 
            userSkills.has(prereq)
        );

        if (!prerequisitesMet) {
            throw new Error('Prerequisites not met');
        }

        userSkills.add(skillId);
        this.userSkills.set(userSkillKey, userSkills);
        console.log(`Skill unlocked: ${skillId} for user ${userId}`);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.skillTrees = new SkillTrees();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SkillTrees;
}

