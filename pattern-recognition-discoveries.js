/**
 * Pattern Recognition for Discoveries
 * Recognizes patterns in planet discoveries
 */

class PatternRecognitionDiscoveries {
    constructor() {
        this.patterns = {};
        this.init();
    }
    
    init() {
        this.loadPatterns();
    }
    
    loadPatterns() {
        // Load known patterns
        this.patterns = {
            clustering: {
                name: 'Planet Clustering',
                description: 'Planets discovered in close proximity',
                threshold: 0.1 // 0.1 light years
            },
            temporal: {
                name: 'Temporal Patterns',
                description: 'Discoveries occurring at regular intervals',
                threshold: 24 // hours
            },
            typeDistribution: {
                name: 'Type Distribution',
                description: 'Unusual distribution of planet types',
                threshold: 0.3 // 30% deviation
            }
        };
    }
    
    async analyzeDiscoveries(discoveries) {
        // Analyze discoveries for patterns
        const patterns = [];
        
        // Check for clustering
        const clustering = this.detectClustering(discoveries);
        if (clustering.detected) {
            patterns.push(clustering);
        }
        
        // Check for temporal patterns
        const temporal = this.detectTemporalPatterns(discoveries);
        if (temporal.detected) {
            patterns.push(temporal);
        }
        
        // Check type distribution
        const distribution = this.analyzeTypeDistribution(discoveries);
        if (distribution.anomaly) {
            patterns.push(distribution);
        }
        
        return patterns;
    }
    
    detectClustering(discoveries) {
        // Detect spatial clustering
        const clusters = [];
        const threshold = this.patterns.clustering.threshold;
        
        for (let i = 0; i < discoveries.length; i++) {
            for (let j = i + 1; j < discoveries.length; j++) {
                const distance = this.calculateDistance(
                    discoveries[i].coordinates,
                    discoveries[j].coordinates
                );
                
                if (distance < threshold) {
                    clusters.push({
                        planet1: discoveries[i].id,
                        planet2: discoveries[j].id,
                        distance
                    });
                }
            }
        }
        
        return {
            type: 'clustering',
            detected: clusters.length > 0,
            clusters,
            significance: clusters.length / discoveries.length
        };
    }
    
    calculateDistance(coord1, coord2) {
        // Calculate distance between coordinates
        if (!coord1 || !coord2) return Infinity;
        
        const dx = (coord1.x || 0) - (coord2.x || 0);
        const dy = (coord1.y || 0) - (coord2.y || 0);
        const dz = (coord1.z || 0) - (coord2.z || 0);
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    detectTemporalPatterns(discoveries) {
        // Detect temporal patterns
        const timestamps = discoveries
            .map(d => new Date(d.discovered_at || d.created_at))
            .sort((a, b) => a - b);
        
        if (timestamps.length < 3) {
            return { detected: false };
        }
        
        // Calculate intervals
        const intervals = [];
        for (let i = 1; i < timestamps.length; i++) {
            const interval = (timestamps[i] - timestamps[i - 1]) / (1000 * 60 * 60); // hours
            intervals.push(interval);
        }
        
        // Check for regularity
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const variance = intervals.reduce((sum, interval) => {
            return sum + Math.pow(interval - avgInterval, 2);
        }, 0) / intervals.length;
        
        const isRegular = variance < (avgInterval * 0.2); // Low variance
        
        return {
            type: 'temporal',
            detected: isRegular,
            averageInterval: avgInterval,
            variance,
            regularity: 1 - (variance / avgInterval)
        };
    }
    
    analyzeTypeDistribution(discoveries) {
        // Analyze type distribution
        const typeCounts = {};
        discoveries.forEach(d => {
            const type = d.type || 'unknown';
            typeCounts[type] = (typeCounts[type] || 0) + 1;
        });
        
        const total = discoveries.length;
        const expected = total / Object.keys(typeCounts).length;
        
        // Check for anomalies
        const deviations = Object.keys(typeCounts).map(type => {
            const count = typeCounts[type];
            const deviation = Math.abs(count - expected) / expected;
            return { type, count, deviation };
        });
        
        const maxDeviation = Math.max(...deviations.map(d => d.deviation));
        const threshold = this.patterns.typeDistribution.threshold;
        
        return {
            type: 'type_distribution',
            anomaly: maxDeviation > threshold,
            distribution: typeCounts,
            deviations,
            maxDeviation
        };
    }
    
    async predictNextDiscovery(location) {
        // Predict next discovery location based on patterns
        if (window.supabase) {
            const { data: recent } = await window.supabase
                .from('discoveries')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(10);
            
            if (recent && recent.length > 0) {
                const patterns = await this.analyzeDiscoveries(recent);
                
                // Use clustering pattern to predict
                const clustering = patterns.find(p => p.type === 'clustering');
                if (clustering && clustering.clusters.length > 0) {
                    // Predict near existing clusters
                    const cluster = clustering.clusters[0];
                    return {
                        predicted: true,
                        location: this.extrapolateLocation(cluster),
                        confidence: 0.7
                    };
                }
            }
        }
        
        return {
            predicted: false,
            confidence: 0.3
        };
    }
    
    extrapolateLocation(cluster) {
        // Extrapolate location from cluster
        // Simplified - would use actual spatial analysis
        return {
            x: 0,
            y: 0,
            z: 0
        };
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { window.patternRecognitionDiscoveries = new PatternRecognitionDiscoveries(); });
} else {
    window.patternRecognitionDiscoveries = new PatternRecognitionDiscoveries();
}

