/**
 * Dead Code Elimination
 * Dead code detection and removal
 */

class DeadCodeElimination {
    constructor() {
        this.analyses = new Map();
        this.init();
    }

    init() {
        this.trackEvent('d_ea_dc_od_ee_li_mi_na_ti_on_initialized');
    }

    trackEvent(eventName, data = {}) {
        try {
            if (typeof window !== 'undefined' && window.performanceMonitoring) {
                window.performanceMonitoring.recordMetric("d_ea_dc_od_ee_li_mi_na_ti_on_" + eventName, 1, data);
            }
        } catch (e) { /* Silent fail */ }
    }


    analyzeCode(codeId, code) {
        const analysis = {
            id: codeId,
            code,
            originalSize: code.length,
            deadCode: [],
            liveCode: '',
            analyzedAt: new Date(),
            createdAt: new Date()
        };
        
        const deadCodePatterns = this.findDeadCode(code);
        analysis.deadCode = deadCodePatterns;
        analysis.liveCode = this.removeDeadCode(code, deadCodePatterns);
        analysis.optimizedSize = analysis.liveCode.length;
        analysis.reduction = analysis.originalSize > 0 
            ? ((analysis.originalSize - analysis.optimizedSize) / analysis.originalSize) * 100 
            : 0;
        
        this.analyses.set(codeId, analysis);
        
        return analysis;
    }

    findDeadCode(code) {
        const deadCode = [];
        
        const unusedFunctionPattern = /function\s+(\w+)\s*\([^)]*\)\s*\{[^}]*\}/g;
        let match;
        while ((match = unusedFunctionPattern.exec(code)) !== null) {
            const functionName = match[1];
            const functionCallPattern = new RegExp(`\\b${functionName}\\s*\\(`, 'g');
            const calls = code.match(functionCallPattern);
            if (!calls || calls.length <= 1) {
                deadCode.push({ type: 'unused_function', name: functionName, code: match[0] });
            }
        }
        
        const unusedVariablePattern = /(?:let|const|var)\s+(\w+)\s*=[^;]+;/g;
        while ((match = unusedVariablePattern.exec(code)) !== null) {
            const varName = match[1];
            const varUsagePattern = new RegExp(`\\b${varName}\\b`, 'g');
            const usages = code.match(varUsagePattern);
            if (!usages || usages.length <= 1) {
                deadCode.push({ type: 'unused_variable', name: varName, code: match[0] });
            }
        }
        
        return deadCode;
    }

    removeDeadCode(code, deadCode) {
        let optimized = code;
        
        deadCode.forEach(item => {
            optimized = optimized.replace(item.code, '');
        });
        
        return optimized;
    }

    getAnalysis(codeId) {
        return this.analyses.get(codeId);
    }
}

// Auto-initialize and export
if (typeof window !== 'undefined') {
    window.deadCodeElimination = new DeadCodeElimination();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DeadCodeElimination;
}
