/**
 * Character Customization Manager
 * Handles player avatar customization, including suit variants, colors, and decals.
 * Part of the Asset Production Roadmap - Category 1 (Item 100).
 */

class CharacterCustomizationManager {
    constructor(assetManager) {
        this.assetManager = assetManager;
        this.currentState = {
            suitId: 'char_pioneer_suit',
            primaryColor: '#ffffff',
            secondaryColor: '#38bdf8',
            visorType: 'gold_leaf',
            decals: []
        };
        this.init();
    }

    init() {
        console.log("👤 Character Customization Manager initialized.");
    }

    /**
     * Applies customization state to a target mesh.
     * @param {THREE.Group} model - The loaded character model group.
     */
    applyCustomization(model) {
        if (!model) return;

        model.traverse((child) => {
            if (child.isMesh) {
                // Logic for finding materials by name and applying colors
                if (child.material.name.includes('Primary')) {
                    child.material.color.set(this.currentState.primaryColor);
                }
                if (child.material.name.includes('Secondary')) {
                    child.material.color.set(this.currentState.secondaryColor);
                }
                if (child.material.name.includes('Visor')) {
                    // Update visor material based on visorType
                }
            }
        });
    }

    setSuit(suitId) {
        this.currentState.suitId = suitId;
        console.log(`Suit changed to: ${suitId}`);
    }

    setColors(primary, secondary) {
        this.currentState.primaryColor = primary;
        this.currentState.secondaryColor = secondary;
    }

    addDecal(decalId) {
        this.currentState.decals.push(decalId);
    }

    getCurrentState() {
        return { ...this.currentState };
    }
}

if (typeof window !== 'undefined') {
    window.CharacterCustomizationManager = CharacterCustomizationManager;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = CharacterCustomizationManager;
}
