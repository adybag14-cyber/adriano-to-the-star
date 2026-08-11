/**
 * Funnel Analysis Tools
 * Analyzes user funnels and conversion paths
 */

class FunnelAnalysisTools {
    constructor() {
        this.funnels = {};
        this.init();
    }
    
    init() {
        this.loadFunnels();
    }
    
    loadFunnels() {
        // Define funnels
        this.funnels = {
            signup: ['landing', 'signup_form', 'email_verification', 'onboarding', 'complete'],
            purchase: ['product_view', 'add_to_cart', 'checkout', 'payment', 'complete'],
            discovery: ['homepage', 'browse', 'planet_view', 'save', 'share']
        };
    }
    
    async analyzeFunnel(funnelName) {
        // Analyze funnel performance
        const funnel = this.funnels[funnelName];
        if (!funnel) {
            throw new Error(`Funnel ${funnelName} not found`);
        }
        
        const steps = await this.getStepCounts(funnel);
        const conversionRates = this.calculateConversionRates(steps);
        const dropoffs = this.identifyDropoffs(steps);
        
        return {
            name: funnelName,
            steps: funnel,
            counts: steps,
            conversionRates,
            dropoffs,
            overallConversion: conversionRates[conversionRates.length - 1]
        };
    }
    
    async getStepCounts(funnel) {
        // Get user counts for each step
        if (window.supabase) {
            const counts = {};
            
            for (const step of funnel) {
                const { data } = await window.supabase
                    .from('funnel_events')
                    .select('user_id', { count: 'exact' })
                    .eq('step', step);
                
                counts[step] = data?.length || 0;
            }
            
            return counts;
        }
        
        // Fallback: generate sample data
        return funnel.reduce((acc, step, index) => {
            acc[step] = Math.max(1000 - (index * 100), 100);
            return acc;
        }, {});
    }
    
    calculateConversionRates(steps) {
        // Calculate conversion rates between steps
        const stepArray = Object.keys(steps);
        const rates = [];
        
        for (let i = 0; i < stepArray.length - 1; i++) {
            const current = steps[stepArray[i]];
            const next = steps[stepArray[i + 1]];
            const rate = current > 0 ? (next / current) * 100 : 0;
            rates.push({
                from: stepArray[i],
                to: stepArray[i + 1],
                rate: rate.toFixed(2) + '%',
                value: rate
            });
        }
        
        return rates;
    }
    
    identifyDropoffs(steps) {
        // Identify where users drop off
        const stepArray = Object.keys(steps);
        const dropoffs = [];
        
        for (let i = 0; i < stepArray.length - 1; i++) {
            const current = steps[stepArray[i]];
            const next = steps[stepArray[i + 1]];
            const dropped = current - next;
            const dropoffRate = current > 0 ? (dropped / current) * 100 : 0;
            
            dropoffs.push({
                step: stepArray[i],
                dropped,
                dropoffRate: dropoffRate.toFixed(2) + '%',
                value: dropoffRate
            });
        }
        
        return dropoffs.sort((a, b) => b.value - a.value);
    }
    
    async trackFunnelStep(funnelName, step, userId) {
        // Track user reaching a funnel step
        if (window.supabase) {
            await window.supabase
                .from('funnel_events')
                .insert({
                    funnel: funnelName,
                    step,
                    user_id: userId,
                    timestamp: new Date().toISOString()
                });
        }
        
        if (window.customEventTrackingSystem) {
            window.customEventTrackingSystem.track('funnel_step', {
                funnel: funnelName,
                step,
                userId
            });
        }
    }
    
    async visualizeFunnel(funnelName) {
        // Generate funnel visualization data
        const analysis = await this.analyzeFunnel(funnelName);
        
        return {
            labels: analysis.steps,
            data: analysis.steps.map(step => analysis.counts[step]),
            conversionRates: analysis.conversionRates.map(r => r.value),
            dropoffs: analysis.dropoffs
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.funnelAnalysisTools = new FunnelAnalysisTools(); });
} else {
    window.funnelAnalysisTools = new FunnelAnalysisTools();
}

