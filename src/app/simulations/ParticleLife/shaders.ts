export const COMPUTE_SHADER = `
struct Particle {
  pos : vec2<f32>,
  vel : vec2<f32>,
  color : f32,
  padding0 : f32,
  padding1 : vec2<f32>,
};

struct Params {
  width : f32,
  height : f32,
  count : f32,
  friction : f32,
  dt : f32,
  rMax : f32,
  forceFactor : f32,
  particleSize : f32,
};

// Force Matrix: Flattened NxN matrix. Max 16 colors supported.
struct Rules {
  matrix : array<vec4<f32>, 64>,
  colorsCount : f32,
  _pad0 : vec3<f32>,
};

@group(0) @binding(0) var<storage, read_write> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<uniform> rules : Rules;

var<workgroup> sharedParticles : array<Particle, 64>;

@compute @workgroup_size(64)
fn main(
  @builtin(global_invocation_id) GlobalInvocationID : vec3<u32>,
  @builtin(local_invocation_id) LocalInvocationID : vec3<u32>
) {
  let index = GlobalInvocationID.x;
  let localIndex = LocalInvocationID.x;
  
  // We need to keep 'p' even if index >= count to participate in loading shared memory
  // But we only update if index < count.
  var p : Particle;
  if (index < u32(params.count)) {
    p = particles[index];
  } else {
    // Initialize dummy to avoid undefined behavior or validation errors
    p.pos = vec2<f32>(0.0);
    p.vel = vec2<f32>(0.0);
    p.color = 0.0;
  }

  var force = vec2<f32>(0.0, 0.0);

  // Tiled optimization
  let tileCount = (u32(params.count) + 63u) / 64u;

  for (var t = 0u; t < tileCount; t = t + 1u) {
    // Collaborative loading
    let loadIndex = t * 64u + localIndex;
    if (loadIndex < u32(params.count)) {
      sharedParticles[localIndex] = particles[loadIndex];
    } else {
      // Load dummy for padding
      sharedParticles[localIndex].pos = vec2<f32>(-99999.0, -99999.0); // Far away
      sharedParticles[localIndex].color = 0.0;
    }
    
    workgroupBarrier();

    // Process tile
    // Optimization: if my index is invalid, I still participate in barrier, but I don't compute force.
    if (index < u32(params.count)) {
      for (var i = 0u; i < 64u; i = i + 1u) {
        let otherIndex = t * 64u + i;
        if (otherIndex >= u32(params.count)) { break; } // End of valid particles
        
        if (otherIndex == index) { continue; }

        let other = sharedParticles[i];
        var d = other.pos - p.pos;

        // Wrap around logic (Toroidal world)
        if (d.x > params.width * 0.5) { d.x = d.x - params.width; }
        if (d.x < -params.width * 0.5) { d.x = d.x + params.width; }
        if (d.y > params.height * 0.5) { d.y = d.y - params.height; }
        if (d.y < -params.height * 0.5) { d.y = d.y + params.height; }

        let distSq = dot(d, d);
        let rMax = params.rMax;
        
        if (distSq > 0.0 && distSq < rMax * rMax) {
          let dist = sqrt(distSq);
          var f = 0.0;
          
          let row = u32(p.color);
          let col = u32(other.color);
          let idx = row * 16u + col;
          let v = rules.matrix[idx / 4u];
          let ruleVal = v[i32(idx % 4u)];
          
          let rNorm = dist / rMax;
          
          if (rNorm < 0.3) {
            f = rNorm / 0.3 - 1.0; 
          } else if (rNorm < 1.0) {
            let mid = (1.0 + 0.3) * 0.5;
            if (rNorm < mid) {
                 f = ruleVal * (rNorm - 0.3) / (mid - 0.3);
            } else {
                 f = ruleVal * (1.0 - rNorm) / (1.0 - mid);
            }
          }
          
          force = force + (d / dist) * f * params.forceFactor;
        }
      }
    }
    
    workgroupBarrier();
  }

  if (index < u32(params.count)) {
    // Update Velocity
    p.vel = p.vel * params.friction + force * params.dt;
    
    // Update Position
    p.pos = p.pos + p.vel * params.dt;

    // Wrap Position
    if (p.pos.x < 0.0) { p.pos.x = p.pos.x + params.width; }
    if (p.pos.x > params.width) { p.pos.x = p.pos.x - params.width; }
    if (p.pos.y < 0.0) { p.pos.y = p.pos.y + params.height; }
    if (p.pos.y > params.height) { p.pos.y = p.pos.y - params.height; }

    particles[index] = p;
  }
}
`;

export const INSTANCED_VERTEX_SHADER = `
struct VertexOutput {
  @builtin(position) position : vec4<f32>,
  @location(0) color : vec4<f32>,
  @location(1) uv : vec2<f32>,
};

struct Particle {
  pos : vec2<f32>,
  vel : vec2<f32>,
  color : f32,
  padding0 : f32,
  padding1 : vec2<f32>,
};

struct Params {
  width : f32,
  height : f32,
  count : f32,
  friction : f32,
  dt : f32,
  rMax : f32,
  forceFactor : f32,
  particleSize : f32,
};

struct Colors {
  values : array<vec4<f32>, 16>, // Max 16 colors
};

@group(0) @binding(0) var<storage, read> particles : array<Particle>;
@group(0) @binding(1) var<uniform> params : Params;
@group(0) @binding(2) var<uniform> colors : Colors;

@vertex
fn main(
  @builtin(instance_index) instanceIdx : u32,
  @builtin(vertex_index) vertexIdx : u32
) -> VertexOutput {
  var output : VertexOutput;
  let p = particles[instanceIdx];
  
  // Quad vertices (Triangle Strip: 0, 1, 2, 3)
  var offset = vec2<f32>(0.0, 0.0);
  if (vertexIdx == 0u) { offset = vec2<f32>(-1.0, -1.0); }
  else if (vertexIdx == 1u) { offset = vec2<f32>(1.0, -1.0); }
  else if (vertexIdx == 2u) { offset = vec2<f32>(-1.0, 1.0); }
  else if (vertexIdx == 3u) { offset = vec2<f32>(1.0, 1.0); }
  
  // Pass UV to fragment shader for circle rendering
  output.uv = offset;
  
  // Screen space conversion
  let x = (p.pos.x / params.width) * 2.0 - 1.0;
  let y = (1.0 - (p.pos.y / params.height)) * 2.0 - 1.0;
  
  // Size correction
  let sizeX = params.particleSize / params.width * 2.0;
  let sizeY = params.particleSize / params.height * 2.0;
  
  output.position = vec4<f32>(x + offset.x * sizeX, y + offset.y * sizeY, 0.0, 1.0);
  
  // Get color
  let cIdx = u32(p.color);
  let c = colors.values[cIdx];
  output.color = vec4<f32>(c.rgb, 1.0);
  
  return output;
}
`;

export const FRAGMENT_SHADER = `
@fragment
fn main(
  @location(0) color : vec4<f32>,
  @location(1) uv : vec2<f32>
) -> @location(0) vec4<f32> {
  // Circular shape with soft edges
  let dist = length(uv);
  
  // Soft edge anti-aliasing
  // Start fading at 0.8, fully transparent at 1.0
  let alpha = 1.0 - smoothstep(0.8, 1.0, dist);
  
  if (alpha <= 0.0) {
    discard;
  }
  
  return vec4<f32>(color.rgb, color.a * alpha);
}
`;
