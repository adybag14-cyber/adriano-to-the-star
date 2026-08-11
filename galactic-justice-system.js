/**
 * 👨‍⚖️ EXOPLANET PIONEER: GALACTIC JUSTICE SYSTEM
 * Item 6007: Automated International Court for tracking war crimes.
 */

class GalacticJusticeSystem {
    constructor() {
        this.docket = [];
        this.laws = [
            { id: "L1", name: "Non-Aggression Pact", penalty: 5000 },
            { id: "L2", name: "Orbital Bombardment Ban", penalty: 50000 },
            { id: "L3", name: "Biological Weapon Ban", penalty: 100000 }
        ];
        console.log("👨‍⚖️ Galactic Court: Jurisdiction Established across 8 Arms.");
    }

    /**
     * Reports a potential violation of Interstellar Law.
     */
    fileClaim(claimantId, defendantId, lawId, evidence) {
        const law = this.laws.find(l => l.id === lawId);
        const caseId = `CASE-${Date.now()}`;
        
        const legalCase = {
            id: caseId,
            claimant: claimantId,
            defendant: defendantId,
            law: law.name,
            severity: evidence.severity || 0.5,
            status: "PENDING",
            penalty: law.penalty * (evidence.severity || 1.0)
        };

        this.docket.push(legalCase);
        console.warn(`👨‍⚖️ NEW CASE: ${caseId} against ${defendantId}.`);
        
        this._autoAdjudicate(caseId);
        return caseId;
    }

    _autoAdjudicate(caseId) {
        const legalCase = this.docket.find(c => c.id === caseId);
        setTimeout(() => {
            // Simulated AI Judgement
            const guilt = Math.random() < legalCase.severity;
            legalCase.status = guilt ? "GUILTY" : "ACQUITTED";
            
            if (guilt) {
                console.error(`👨‍⚖️ VERDICT: ${legalCase.defendant} found GUILTY. Penalty: ${legalCase.penalty} Credits.`);
                this.fireEvent("COURT_VERDICT", legalCase);
            } else {
                console.log(`👨‍⚖️ VERDICT: ${legalCase.defendant} acquitted of ${legalCase.law}.`);
            }
        }, 10000);
    }

    fireEvent(type, data) {
        window.dispatchEvent(new CustomEvent(type, { detail: data }));
    }
}

export const galacticCourt = new GalacticJusticeSystem();
window.galacticCourt = galacticCourt;
