/**
 * Heatmap Tracking
 * Tracks user interactions for heatmap visualization
 */

class HeatmapTracking {
    constructor() {
        this.interactions = [];
        this.batchSize = 50;
        this.init();
    }
    
    init() {
        this.trackClicks();
        this.trackScrolls();
        this.trackMouseMovement();
        this.startBatching();
    }
    
    trackClicks() {
        // Track click positions
        document.addEventListener('click', (e) => {
            const position = this.getElementPosition(e.target);
            this.recordInteraction({
                type: 'click',
                x: e.clientX,
                y: e.clientY,
                element: {
                    tag: e.target.tagName,
                    id: e.target.id,
                    class: e.target.className,
                    position
                },
                timestamp: Date.now()
            });
        });
    }
    
    trackScrolls() {
        // Track scroll depth
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            const scrollDepth = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            maxScroll = Math.max(maxScroll, scrollDepth);
            
            this.recordInteraction({
                type: 'scroll',
                depth: scrollDepth,
                maxDepth: maxScroll,
                timestamp: Date.now()
            });
        });
    }
    
    trackMouseMovement() {
        // Track mouse movement (sampled)
        let lastTrack = 0;
        document.addEventListener('mousemove', (e) => {
            const now = Date.now();
            if (now - lastTrack > 1000) { // Sample every second
                this.recordInteraction({
                    type: 'mouse_move',
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: now
                });
                lastTrack = now;
            }
        });
    }
    
    getElementPosition(element) {
        // Get element position on page
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
        };
    }
    
    recordInteraction(interaction) {
        // Record interaction
        this.interactions.push({
            ...interaction,
            url: window.location.href,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            }
        });
        
        // Batch send if needed
        if (this.interactions.length >= this.batchSize) {
            this.sendBatch();
        }
    }
    
    async sendBatch() {
        if (this.interactions.length === 0) return;
        
        const batch = this.interactions.splice(0, this.batchSize);
        
        // Send to database
        if (window.supabase) {
            await window.supabase
                .from('heatmap_data')
                .insert(batch.map(i => ({
                    type: i.type,
                    x: i.x,
                    y: i.y,
                    element: i.element,
                    url: i.url,
                    viewport: i.viewport,
                    timestamp: new Date(i.timestamp).toISOString()
                })));
        }
    }
    
    startBatching() {
        // Periodically send batches
        setInterval(() => {
            if (this.interactions.length > 0) {
                this.sendBatch();
            }
        }, 30000); // Every 30 seconds
    }
    
    async getHeatmapData(url, type = 'click') {
        // Get heatmap data for visualization
        if (window.supabase) {
            const { data } = await window.supabase
                .from('heatmap_data')
                .select('*')
                .eq('url', url)
                .eq('type', type)
                .order('timestamp', { ascending: false })
                .limit(1000);
            
            return this.processHeatmapData(data || []);
        }
        
        return [];
    }
    
    processHeatmapData(data) {
        // Process data for heatmap visualization
        // Group by position and count
        const heatmap = {};
        
        data.forEach(point => {
            const key = `${Math.floor(point.x / 10) * 10},${Math.floor(point.y / 10) * 10}`;
            if (!heatmap[key]) {
                heatmap[key] = {
                    x: Math.floor(point.x / 10) * 10,
                    y: Math.floor(point.y / 10) * 10,
                    count: 0
                };
            }
            heatmap[key].count++;
        });
        
        return Object.values(heatmap);
    }
    
    async generateHeatmap(url, type = 'click') {
        // Generate heatmap visualization data
        const data = await this.getHeatmapData(url, type);
        const maxCount = Math.max(...data.map(d => d.count), 1);
        
        return data.map(point => ({
            ...point,
            intensity: point.count / maxCount // Normalize to 0-1
        }));
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.heatmapTracking = new HeatmapTracking(); });
} else {
    window.heatmapTracking = new HeatmapTracking();
}

