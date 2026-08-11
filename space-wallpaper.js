// 3D Space Wallpaper Background
class SpaceWallpaper {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.stars = [];
        this.nebulaClouds = [];
        this.planets = [];
        this.asteroids = [];
        this.init();
    }

    init() {
        this.createCanvas();
        this.createStars();
        this.createNebulaClouds();
        this.createPlanets();
        this.createAsteroids();
        this.animate();
        window.addEventListener('resize', () => this.handleResize());
        this.addMouseParallax();
    }

    createCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'space-wallpaper';
        this.canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -10;
            pointer-events: none;
        `;
        document.body.insertBefore(this.canvas, document.body.firstChild);
        this.ctx = this.canvas.getContext('2d');
        this.handleResize();
    }

    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStars() {
        const starCount = 300;
        for (let i = 0; i < starCount; i++) {
            this.stars.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                z: Math.random() * 1000,
                size: Math.random() * 2,
                brightness: Math.random(),
                twinkleSpeed: Math.random() * 0.02 + 0.01,
                color: this.getStarColor()
            });
        }
    }

    getStarColor() {
        const colors = [
            'rgba(255, 255, 255',      // White
            'rgba(186, 148, 79',       // Gold
            'rgba(135, 206, 250',      // Light blue
            'rgba(255, 200, 200',      // Pink
            'rgba(200, 200, 255'       // Light purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createNebulaClouds() {
        const cloudCount = 5;
        for (let i = 0; i < cloudCount; i++) {
            this.nebulaClouds.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 300 + 200,
                color1: this.getNebulaColor(),
                color2: this.getNebulaColor(),
                opacity: Math.random() * 0.15 + 0.05,
                driftSpeed: Math.random() * 0.1 + 0.05,
                driftAngle: Math.random() * Math.PI * 2,
                pulseSpeed: Math.random() * 0.01 + 0.005,
                pulsePhase: Math.random() * Math.PI * 2
            });
        }
    }

    getNebulaColor() {
        const colors = [
            { r: 138, g: 43, b: 226 },   // Purple
            { r: 0, g: 191, b: 255 },    // Blue
            { r: 186, g: 148, b: 79 },   // Gold
            { r: 255, g: 20, b: 147 },   // Pink
            { r: 50, g: 205, b: 50 }     // Green
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createPlanets() {
        const planetCount = 3;
        for (let i = 0; i < planetCount; i++) {
            const radius = Math.random() * 80 + 40;
            this.planets.push({
                x: Math.random() * (this.canvas.width + 400) - 200,
                y: Math.random() * (this.canvas.height + 400) - 200,
                radius: radius,
                color: this.getPlanetColor(),
                orbitSpeed: Math.random() * 0.0005 + 0.0002,
                orbitRadius: Math.random() * 200 + 100,
                angle: Math.random() * Math.PI * 2,
                centerX: Math.random() * this.canvas.width,
                centerY: Math.random() * this.canvas.height,
                hasRing: Math.random() > 0.5,
                ringColor: `rgba(${Math.random() * 100 + 150}, ${Math.random() * 100 + 150}, ${Math.random() * 100 + 150}, 0.3)`,
                atmosphereColor: this.getPlanetColor(),
                rotationSpeed: Math.random() * 0.01 + 0.005
            });
        }
    }

    getPlanetColor() {
        const colors = [
            { r: 186, g: 148, b: 79 },   // Gold
            { r: 139, g: 69, b: 19 },    // Brown
            { r: 70, g: 130, b: 180 },   // Blue
            { r: 255, g: 140, b: 0 },    // Orange
            { r: 147, g: 112, b: 219 }   // Purple
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    createAsteroids() {
        const asteroidCount = 20;
        for (let i = 0; i < asteroidCount; i++) {
            this.asteroids.push({
                x: Math.random() * this.canvas.width * 2,
                y: Math.random() * this.canvas.height,
                size: Math.random() * 3 + 1,
                speed: Math.random() * 0.5 + 0.2,
                opacity: Math.random() * 0.5 + 0.3
            });
        }
    }

    drawStars() {
        this.stars.forEach(star => {
            // Twinkling effect
            star.brightness += star.twinkleSpeed;
            if (star.brightness > 1 || star.brightness < 0.3) {
                star.twinkleSpeed *= -1;
            }

            // 3D perspective
            const scale = 1000 / (1000 - star.z);
            const x2d = (star.x - this.canvas.width / 2) * scale + this.canvas.width / 2;
            const y2d = (star.y - this.canvas.height / 2) * scale + this.canvas.height / 2;
            const size = star.size * scale;

            // Draw star
            this.ctx.fillStyle = `${star.color}, ${star.brightness})`;
            this.ctx.beginPath();
            this.ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw glow for larger stars
            if (size > 1.5) {
                const gradient = this.ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 3);
                gradient.addColorStop(0, `${star.color}, ${star.brightness * 0.5})`);
                gradient.addColorStop(1, `${star.color}, 0)`);
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(x2d, y2d, size * 3, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
    }

    drawNebulaClouds() {
        this.nebulaClouds.forEach(cloud => {
            // Drift movement
            cloud.x += Math.cos(cloud.driftAngle) * cloud.driftSpeed;
            cloud.y += Math.sin(cloud.driftAngle) * cloud.driftSpeed;

            // Wrap around screen
            if (cloud.x < -cloud.radius) cloud.x = this.canvas.width + cloud.radius;
            if (cloud.x > this.canvas.width + cloud.radius) cloud.x = -cloud.radius;
            if (cloud.y < -cloud.radius) cloud.y = this.canvas.height + cloud.radius;
            if (cloud.y > this.canvas.height + cloud.radius) cloud.y = -cloud.radius;

            // Pulsing effect
            cloud.pulsePhase += cloud.pulseSpeed;
            const pulseOpacity = cloud.opacity * (1 + Math.sin(cloud.pulsePhase) * 0.3);

            // Create radial gradient
            const gradient = this.ctx.createRadialGradient(
                cloud.x, cloud.y, 0,
                cloud.x, cloud.y, cloud.radius
            );
            gradient.addColorStop(0, `rgba(${cloud.color1.r}, ${cloud.color1.g}, ${cloud.color1.b}, ${pulseOpacity})`);
            gradient.addColorStop(0.5, `rgba(${cloud.color2.r}, ${cloud.color2.g}, ${cloud.color2.b}, ${pulseOpacity * 0.5})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    drawPlanets() {
        this.planets.forEach(planet => {
            // Update orbit position
            planet.angle += planet.orbitSpeed;
            planet.x = planet.centerX + Math.cos(planet.angle) * planet.orbitRadius;
            planet.y = planet.centerY + Math.sin(planet.angle) * planet.orbitRadius;

            // Draw planet shadow/3D effect
            const shadowGradient = this.ctx.createRadialGradient(
                planet.x + planet.radius * 0.3,
                planet.y + planet.radius * 0.3,
                planet.radius * 0.2,
                planet.x,
                planet.y,
                planet.radius
            );
            shadowGradient.addColorStop(0, `rgba(${planet.color.r}, ${planet.color.g}, ${planet.color.b}, 1)`);
            shadowGradient.addColorStop(0.7, `rgba(${planet.color.r * 0.5}, ${planet.color.g * 0.5}, ${planet.color.b * 0.5}, 0.8)`);
            shadowGradient.addColorStop(1, `rgba(0, 0, 0, 0.9)`);

            this.ctx.fillStyle = shadowGradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw atmosphere glow
            const glowGradient = this.ctx.createRadialGradient(
                planet.x, planet.y, planet.radius * 0.8,
                planet.x, planet.y, planet.radius * 1.5
            );
            glowGradient.addColorStop(0, `rgba(${planet.atmosphereColor.r}, ${planet.atmosphereColor.g}, ${planet.atmosphereColor.b}, 0)`);
            glowGradient.addColorStop(1, `rgba(${planet.atmosphereColor.r}, ${planet.atmosphereColor.g}, ${planet.atmosphereColor.b}, 0.3)`);

            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(planet.x, planet.y, planet.radius * 1.5, 0, Math.PI * 2);
            this.ctx.fill();

            // Draw ring if planet has one
            if (planet.hasRing) {
                this.ctx.save();
                this.ctx.translate(planet.x, planet.y);
                this.ctx.scale(1, 0.3);
                
                this.ctx.strokeStyle = planet.ringColor;
                this.ctx.lineWidth = planet.radius * 0.4;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, planet.radius * 1.8, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.restore();
            }
        });
    }

    drawAsteroids() {
        this.asteroids.forEach(asteroid => {
            asteroid.x -= asteroid.speed;
            
            if (asteroid.x < -10) {
                asteroid.x = this.canvas.width + 10;
                asteroid.y = Math.random() * this.canvas.height;
            }

            this.ctx.fillStyle = `rgba(150, 150, 150, ${asteroid.opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(asteroid.x, asteroid.y, asteroid.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    animate() {
        // Clear with slight trail effect
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw layers in order
        this.drawNebulaClouds();
        this.drawStars();
        this.drawAsteroids();
        this.drawPlanets();

        requestAnimationFrame(() => this.animate());
    }

    addMouseParallax() {
        document.addEventListener('mousemove', (e) => {
            const mouseX = e.clientX / window.innerWidth;
            const mouseY = e.clientY / window.innerHeight;

            // Subtle parallax effect on nebula clouds
            this.nebulaClouds.forEach((cloud, index) => {
                cloud.driftAngle = Math.atan2(mouseY - 0.5, mouseX - 0.5) + (index * 0.5);
            });

            // Adjust planet positions slightly
            this.planets.forEach((planet, index) => {
                planet.centerX = (this.canvas.width * 0.5) + (mouseX - 0.5) * 100 * (index + 1);
                planet.centerY = (this.canvas.height * 0.5) + (mouseY - 0.5) * 100 * (index + 1);
            });
        });
    }
}

// Initialize space wallpaper after loader
window.addEventListener('load', () => {
    setTimeout(() => {
        new SpaceWallpaper();
        console.log('🌌 3D Space Wallpaper initialized!');
    }, 3500);
});
