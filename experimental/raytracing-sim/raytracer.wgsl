
struct Ray {
    origin: vec3<f32>,
    direction: vec3<f32>,
};

struct Sphere {
    center: vec3<f32>,
    radius: f32,
    color: vec3<f32>,
    materialType: u32, // 0: Lambert, 1: Metal, 2: Emissive, 3: Dielectric
    roughness: f32,
};

struct HitInfo {
    hit: bool,
    dist: f32,
    point: vec3<f32>,
    normal: vec3<f32>,
    sphereIndex: i32,
    frontFace: bool,
};

struct Uniforms {
    block1: vec4<f32>, 
    block2: vec4<f32>,
    block3: vec4<f32>,
    bounces: u32,
    samples: u32,
    lightIntensity: f32,
    fov: f32,
    seed: f32,
    frame: u32,
    aperture: f32,
    focusDist: f32,
    dayMode: u32,
};

@group(0) @binding(0) var outputTex: texture_storage_2d<rgba32float, write>;
@group(0) @binding(1) var<uniform> u: Uniforms;
@group(0) @binding(2) var<storage, read> spheres: array<Sphere>;
@group(0) @binding(3) var previousTex: texture_2d<f32>;

// PCG Random Number Generator
 fn pcg_hash(input: u32) -> u32 {
     var state = input * 747796405u + 2891336453u;
     let word = ((state >> ((state >> 28u) + 4u)) ^ state) * 277803737u;
     return (word >> 22u) ^ word;
 }
 
 fn nfr(xy: vec2<f32>, seed: f32) -> f32 {
     // Use pixel coordinates and seed to generate a unique hash input
     // Cast to u32 to use bitwise operations
     let p = vec2<u32>(u32(abs(xy.x)), u32(abs(xy.y)));
     let s = u32(abs(seed * 10000.0)); // Scale seed to preserve fractional entropy
     
     // Combine inputs (X XOR Y XOR Seed) -> Hash
     let h = pcg_hash(p.x ^ pcg_hash(p.y ^ s));
     
     // Convert to float [0, 1]
     return f32(h) * 2.3283064365386963e-10; // 1 / 2^32
 }
 
 // Random vec3 in unit sphere
 fn randomInUnitSphere(uv: vec2<f32>, seed: f32) -> vec3<f32> {
     let phi = nfr(uv, seed) * 6.283185;
     let costheta = nfr(uv + vec2(1.0,1.0), seed) * 2.0 - 1.0;
     let theta = acos(costheta);
     let r = pow(nfr(uv + vec2(2.0,2.0), seed), 0.333);
     
     let x = r * sin(theta) * cos(phi);
     let y = r * sin(theta) * sin(phi);
     let z = r * cos(theta);
     return vec3(x, y, z);
 }

// Random vec2 in unit disk (for aperture)
fn randomInUnitDisk(uv: vec2<f32>, seed: f32) -> vec2<f32> {
    let a = nfr(uv, seed) * 2.0 * 3.14159;
    let r = sqrt(nfr(uv + vec2(1.0), seed));
    return vec2(r * cos(a), r * sin(a));
}

fn schlick(cosine: f32, refIdx: f32) -> f32 {
    var r0 = (1.0 - refIdx) / (1.0 + refIdx);
    r0 = r0 * r0;
    return r0 + (1.0 - r0) * pow((1.0 - cosine), 5.0);
}

fn intersectSphere(ray: Ray, sphere: Sphere) -> f32 {
    let oc = ray.origin - sphere.center;
    let a = dot(ray.direction, ray.direction);
    let b = 2.0 * dot(oc, ray.direction);
    let c = dot(oc, oc) - sphere.radius * sphere.radius;
    let discriminant = b * b - 4.0 * a * c;

    if (discriminant < 0.0) {
        return -1.0;
    } else {
        return (-b - sqrt(discriminant)) / (2.0 * a);
    }
}

fn trace(ray: Ray) -> HitInfo {
    var closestDist = 10000.0;
    var hitIdx = -1;

    let numSpheres = arrayLength(&spheres);
    for (var i = 0u; i < numSpheres; i++) {
        let sphere = spheres[i];
        let d = intersectSphere(ray, sphere);
        if (d > 0.001 && d < closestDist) {
            closestDist = d;
            hitIdx = i32(i);
        }
    }

    var info: HitInfo;
    if (hitIdx != -1) {
        info.hit = true;
        info.dist = closestDist;
        info.point = ray.origin + ray.direction * closestDist;
        let outwardNormal = normalize(info.point - spheres[hitIdx].center);
        info.sphereIndex = hitIdx;
        
        info.frontFace = dot(ray.direction, outwardNormal) < 0.0;
        info.normal = select(-outwardNormal, outwardNormal, info.frontFace);
    } else {
        info.hit = false;
    }
    return info;
}

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) id: vec3<u32>) {
    // Unpack Uniforms
    let resolution = u.block1.xy;
    let time = u.block1.z;
    let cameraPos = u.block2.xyz;
    let cameraDir = u.block3.xyz;

    let width = u32(resolution.x);
    let height = u32(resolution.y);

    if (id.x >= width || id.y >= height) {
        return;
    }

    let uv = (vec2<f32>(id.xy) / resolution) * 2.0 - 1.0;
    let aspectRatio = resolution.x / resolution.y;

    // Camera Basis
    let lookFrom = cameraPos;
    let lookAt = cameraPos + cameraDir;
    let vup = vec3(0.0, 1.0, 0.0);
    let w = normalize(lookFrom - lookAt);
    let u_vec = normalize(cross(vup, w));
    let v_vec = cross(w, u_vec);

    let viewportHeight = 2.0 * tan(radians(u.fov) / 2.0);
    let viewportWidth = viewportHeight * aspectRatio;
    let horizontal = u_vec * viewportWidth;
    let vertical = v_vec * viewportHeight;
    // Focus plane at dist 1.0 is default, but we use u.focusDist
    let focusDist = u.focusDist;
    let lensRadius = u.aperture / 2.0;

    let horizontalFocus = horizontal * focusDist;
    let verticalFocus = vertical * focusDist;
    let lowerLeftFocus = lookFrom - horizontalFocus/2.0 - verticalFocus/2.0 - w * focusDist;

    var finalColor = vec3(0.0);
    // Seed includes frame count for temporal noise usage
    // Wrap frame to prevent precision loss/NaN in tan() for high frame counts
    // OPTIMIZATION: Removed u.frame interaction as u.seed is already randomized per frame in JS
    var seed = u.seed + f32(id.x) * 0.123 + f32(id.y) * 0.456;

    for (var s = 0u; s < u.samples; s++) {
        let uvJitter = vec2(nfr(vec2(f32(id.x), f32(id.y)), seed + f32(s)), 
                           nfr(vec2(f32(id.x), f32(id.y)), seed + f32(s) + 1.0)) * 0.002;
                           
        var ray: Ray;
        var rd = vec2(0.0);
        if (lensRadius > 0.0) {
            rd = randomInUnitDisk(vec2(f32(id.x), f32(id.y)), seed + f32(s) + 2.0) * lensRadius;
        }
        let offset = u_vec * rd.x + v_vec * rd.y;

        ray.origin = lookFrom + offset;
        let uvTarget = uv + uvJitter;
        let rayTarget = lowerLeftFocus + horizontalFocus * (uvTarget.x * 0.5 + 0.5) + verticalFocus * (uvTarget.y * 0.5 + 0.5);
        ray.direction = normalize(rayTarget - ray.origin);

        var currentAtten = vec3(1.0);
        var currentLight = vec3(0.0);

        // Usage of loops for bounces
        for (var b = 0u; b < u.bounces; b++) {
            let hit = trace(ray);
            
            if (hit.hit) {
                let sphere = spheres[hit.sphereIndex];
                
                if (sphere.materialType == 2u) {
                    // Emissive
                    currentLight += currentAtten * sphere.color * u.lightIntensity;
                    break;
                }

                if (sphere.materialType == 3u) {
                    // Dielectric (Glass)
                    let refIdx = 1.5;
                    let etaiOverEtat = select(refIdx, 1.0 / refIdx, hit.frontFace);
                    let unitDir = normalize(ray.direction);
                    let cosTheta = min(dot(-unitDir, hit.normal), 1.0);
                    let sinTheta = sqrt(1.0 - cosTheta * cosTheta);

                    if (etaiOverEtat * sinTheta > 1.0 || nfr(hit.point.xy, seed + f32(b)) < schlick(cosTheta, etaiOverEtat)) {
                        let reflected = reflect(unitDir, hit.normal);
                        ray.origin = hit.point;
                        ray.direction = normalize(reflected);
                    } else {
                        let refracted = refract(unitDir, hit.normal, etaiOverEtat);
                        ray.origin = hit.point + refracted * 0.01; // Push
                        ray.direction = normalize(refracted);
                    }
                    currentAtten *= sphere.color;
                } 
                else if (sphere.materialType == 1u) {
                     // Metal
                    let reflected = reflect(normalize(ray.direction), hit.normal);
                    let fuzz = sphere.roughness;
                    ray.origin = hit.point;
                    ray.direction = normalize(reflected + randomInUnitSphere(hit.point.xy, seed + f32(b)) * fuzz);
                    currentAtten *= sphere.color;
                } 
                else {
                    // Lambert (Diffuse)
                     let scatterTarget = hit.point + hit.normal + randomInUnitSphere(hit.point.xy, seed + f32(b));
                     ray.origin = hit.point;
                     ray.direction = normalize(scatterTarget - hit.point);
                     currentAtten *= sphere.color;
                }
            } else {
                // MISS - Sky Color
                var sky = vec3(0.0);
                
                if (u.dayMode == 1u) {
                    // DAYTIME SKY
                    let sunDir = normalize(vec3(0.5, 0.8, -0.3));
                    let sunDot = max(dot(ray.direction, sunDir), 0.0);
                    
                    let horizonColor = vec3(1.0, 0.6, 0.4); 
                    let zenithColor = vec3(0.3, 0.5, 0.9);
                    let midColor = vec3(0.6, 0.7, 0.95);
                    
                    let horizonBlend = smoothstep(-0.1, 0.3, ray.direction.y);
                    let zenithBlend = smoothstep(0.3, 0.8, ray.direction.y);
                    
                    sky = mix(horizonColor, midColor, horizonBlend);
                    sky = mix(sky, zenithColor, zenithBlend);
                    
                    let sunGlow = pow(sunDot, 64.0) * 5.0 + pow(sunDot, 8.0) * 0.5;
                    sky += vec3(1.0, 0.9, 0.7) * sunGlow;
                    
                    let atmosphereGlow = pow(1.0 - abs(ray.direction.y), 4.0) * 0.3;
                    sky += vec3(1.0, 0.8, 0.6) * atmosphereGlow;
                } else {
                    // SPACE MODE
                    let spaceDeep = vec3(0.01, 0.01, 0.02);
                    let spaceHorizon = vec3(0.02, 0.03, 0.05);
                    
                    sky = mix(spaceHorizon, spaceDeep, abs(ray.direction.y));
                    
                    // Stars
                    let starNoise = nfr(ray.direction.xy * 100.0, u.seed + ray.direction.z * 50.0);
                    if (starNoise > 0.995) {
                        let starBrightness = (starNoise - 0.995) * 200.0;
                        let starColorIdx = nfr(ray.direction.yx * 50.0, u.seed);
                        var starColor = vec3(1.0);
                        if (starColorIdx > 0.8) { starColor = vec3(0.8, 0.9, 1.0); }
                        else if (starColorIdx > 0.6) { starColor = vec3(1.0, 0.95, 0.8); }
                        else if (starColorIdx > 0.4) { starColor = vec3(1.0, 0.7, 0.5); }
                        sky += starColor * starBrightness;
                    }
                }
                currentLight += currentAtten * sky;
                break;
            }
        }
        finalColor += currentLight;
    }
    
    finalColor = finalColor / f32(u.samples);

    var blendedColor = finalColor;
    if (u.frame > 0u) {
         let prevLinear = textureLoad(previousTex, vec2<i32>(id.xy), 0).rgb;
         let cumLinear = mix(prevLinear, finalColor, 1.0 / (f32(u.frame) + 1.0));
         blendedColor = cumLinear;
    }
    
    textureStore(outputTex, id.xy, vec4<f32>(blendedColor, 1.0));
}
