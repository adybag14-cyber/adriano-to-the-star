/**
 * Web Worker for SpaceLoader star field calculations
 * Offloads heavy computations to improve main thread performance
 */

// Star field calculation worker
self.onmessage = function(e) {
    const { type, data } = e.data;
    
    if (type === 'init') {
        // Initialize star field
        const { starCount, depth, width, height } = data;
        const stars = [];
        
        for (let i = 0; i < starCount; i++) {
            stars.push({
                x: (Math.random() - 0.5) * depth,
                y: (Math.random() - 0.5) * depth,
                z: Math.random() * depth,
                color: `rgba(${200 + Math.random() * 55}, ${200 + Math.random() * 55}, ${200 + Math.random() * 55}, 0.8)`
            });
        }
        
        self.postMessage({
            type: 'init-complete',
            stars: stars
        });
    } else if (type === 'update') {
        // Update star positions
        const { stars, speed, depth, centerX, centerY, width, height } = data;
        const updatedStars = [];
        const visibleStars = [];
        
        stars.forEach(star => {
            // Update Z position
            star.z -= speed;
            if (star.z <= 0) {
                star.z = depth;
            }
            
            // Calculate screen position
            const k = 128 / star.z;
            const px = star.x * k + centerX;
            const py = star.y * k + centerY;
            
            // Only include visible stars
            if (px >= -50 && px <= width + 50 && py >= -50 && py <= height + 50) {
                const size = (1 - star.z / depth) * 3;
                const opacity = 1 - star.z / depth;
                
                visibleStars.push({
                    x: px,
                    y: py,
                    size: size,
                    opacity: opacity,
                    color: star.color.replace('0.8', opacity),
                    trailX: px + (star.x * k) * 0.02,
                    trailY: py + (star.y * k) * 0.02,
                    trailOpacity: opacity * 0.3
                });
            }
            
            updatedStars.push(star);
        });
        
        self.postMessage({
            type: 'update-complete',
            stars: updatedStars,
            visibleStars: visibleStars
        });
    } else if (type === 'terminate') {
        // Cleanup
        self.close();
    }
};

