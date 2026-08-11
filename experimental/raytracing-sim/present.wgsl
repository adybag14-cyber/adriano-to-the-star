@group(0) @binding(0) var tex: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

struct VSOutput {
    @builtin(position) pos: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@vertex
fn vs_main(@builtin(vertex_index) id: u32) -> VSOutput {
    // Full screen triangle
    var keys = array<vec2<f32>, 3>(
        vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0)
    );
    // UVs match the triangle (0,1 top-left logic inverted for WebGPU)
    // WebGPU clip space: -1 to 1 Y up.
    // Texture UV: 0 to 1 Y down.
    var uvs = array<vec2<f32>, 3>(
        vec2(0.0, 1.0), vec2(2.0, 1.0), vec2(0.0, -1.0)
    );
    var out: VSOutput;
    out.pos = vec4(keys[id], 0.0, 1.0);
    out.uv = uvs[id];
    return out;
}

@fragment
fn fs_main(in: VSOutput) -> @location(0) vec4<f32> {
    let linearColor = textureSample(tex, samp, in.uv).rgb;
    // Tone Map (Simple Reinhard or just Gamma?)
    // Raytracer was using Gamma only.
    let gammaColor = pow(linearColor, vec3(1.0/2.2));
    return vec4(gammaColor, 1.0);
}
