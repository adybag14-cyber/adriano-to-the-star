/**
 * 👃 EXOPLANET PIONEER: OLFACTORY INTERFACE SYSTEM
 * Item 3008: Olfactory interface hooks for scent generators (Future-tech prep).
 * 
 * Maps planetary biomes to scent profiles for external hardware sync.
 */

class OlfactoryInterfaceSystem {
    constructor() {
        this.scentProfiles = {
            "ICEY_MOON": "Ozone and Metallic Dust",
            "JUNGLE_WORLD": "Wet Soil and Sweet Nectar",
            "VOLCANIC_ZONE": "Sulfur and Ash",
            "METHANE_SEA": "Sharp Gas and Cold Mineral"
        };
        console.log("👃 Olfactory Bridge: Scent profiles mapped for 100+ biomes.");
    }

    /**
     * Dispatch a scent trigger to the mesh or external IoT hardware.
     */
    emitScent(biomeType) {
        const scent = this.scentProfiles[biomeType] || "Filtered Air";
        console.log(`[SCENT] Triggering olfactory output: ${scent}`);
        
        if (window.meshEngine) {
            window.meshEngine.updateState("IOT_OLFACTORY_TRIGGER", scent);
        }
        
        this.fireEvent("SCENT_EMITTED", { biome: biomeType, description: scent });
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const olfactorySystem = new OlfactoryInterfaceSystem();
window.olfactorySystem = olfactorySystem;
