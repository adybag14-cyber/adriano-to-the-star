/**
 * Planet Shaders Library
 * Q1 2025: Advanced Generation
 * 
 * diverse GLSL shaders for procedural planet generation
 */

const PlanetShaders = {
    // Shared Vertex Shader (Standard Sphere)
    vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `,

    // Lava Planet Fragment Shader
    lavaFragmentShader: `
        uniform float time;
        uniform sampler2D noiseTexture;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;

        // Simple noise function
        float random(vec2 st) {
            return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
        }

        float noise(vec2 st) {
            vec2 i = floor(st);
            vec2 f = fract(st);
            float a = random(i);
            float b = random(i + vec2(1.0, 0.0));
            float c = random(i + vec2(0.0, 1.0));
            float d = random(i + vec2(1.0, 1.0));
            vec2 u = f * f * (3.0 - 2.0 * f);
            return mix(a, b, u.x) + (c - a)* u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        void main() {
            // Animated magma
            float n = noise(vPosition.xy * 2.0 + time * 0.1);
            n += noise(vPosition.yz * 3.0 - time * 0.05) * 0.5;
            
            // Color palette
            vec3 darkRock = vec3(0.1, 0.05, 0.05);
            vec3 magmaRed = vec3(0.8, 0.1, 0.0);
            vec3 magmaBright = vec3(1.0, 0.6, 0.2);
            
            float heat = smoothstep(0.4, 0.8, n);
            vec3 color = mix(darkRock, magmaRed, heat);
            color = mix(color, magmaBright, smoothstep(0.8, 1.0, n));
            
            // Emissive glow
            float glow = heat * 0.8;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,

    // Ice Planet Fragment Shader
    iceFragmentShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
            // Icy blue tint with fresnel
            vec3 iceColor = vec3(0.7, 0.85, 0.95);
            vec3 deepIce = vec3(0.4, 0.6, 0.8);
            
            float fresnel = pow(1.0 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            
            // Simple marble pattern
            float pattern = sin(vPosition.y * 10.0 + sin(vPosition.x * 10.0));
            vec3 color = mix(deepIce, iceColor, pattern * 0.5 + 0.5);
            
            color += fresnel * 0.4;
            
            gl_FragColor = vec4(color, 1.0);
        }
    `,

    // Gas Giant Fragment Shader
    gasGiantFragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            // Bands
            float band = sin(vUv.y * 20.0 + sin(vUv.x * 2.0 + time * 0.1) * 2.0);
            
            vec3 color1 = vec3(0.8, 0.6, 0.4); // Light brown
            vec3 color2 = vec3(0.5, 0.3, 0.2); // Dark brown
            vec3 color3 = vec3(0.9, 0.8, 0.7); // White/Cream
            
            vec3 finalColor = mix(color1, color2, band * 0.5 + 0.5);
            
            // Storms
            float storm = sin(vUv.x * 10.0 + vUv.y * 10.0 + time * 0.2);
            if (storm > 0.9) {
                finalColor = mix(finalColor, vec3(0.7, 0.3, 0.2), 0.5); // Red spot
            }
            
            gl_FragColor = vec4(finalColor, 1.0);
        }
    `
};

// Export
if (typeof window !== 'undefined') {
    window.PlanetShaders = PlanetShaders;
}
