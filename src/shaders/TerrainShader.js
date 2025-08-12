import * as THREE from 'three'

// Advanced Terrain Shader dengan multi-layer texturing dan procedural details
export const TerrainVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vElevation;
  
  uniform float uTime;
  uniform float uElevationScale;
  
  // Simplex noise function untuk procedural height
  vec3 mod289(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
  }
  
  vec4 permute(vec4 x) {
    return mod289(((x*34.0)+1.0)*x);
  }
  
  vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
  }
  
  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    
    i = mod289(i);
    vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    
    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    
    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    
    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
    
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    
    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    
    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // Procedural elevation dengan multiple octaves
    float elevation = 0.0;
    elevation += snoise(position * 0.01) * 8.0;
    elevation += snoise(position * 0.02) * 4.0;
    elevation += snoise(position * 0.04) * 2.0;
    elevation += snoise(position * 0.08) * 1.0;
    
    // Gentle animation untuk living terrain
    elevation += sin(uTime * 0.5 + position.x * 0.01) * 0.5;
    
    vElevation = elevation;
    
    vec3 newPosition = position;
    newPosition.y += elevation * uElevationScale;
    
    // Calculate normal untuk lighting
    float eps = 0.1;
    vec3 dx = vec3(eps, 0.0, 0.0);
    vec3 dz = vec3(0.0, 0.0, eps);
    
    float hL = snoise((position - dx) * 0.01) * 8.0;
    float hR = snoise((position + dx) * 0.01) * 8.0;
    float hD = snoise((position - dz) * 0.01) * 8.0;
    float hU = snoise((position + dz) * 0.01) * 8.0;
    
    vNormal = normalize(vec3(hL - hR, 2.0, hD - hU));
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
  }
`

export const TerrainFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vElevation;
  
  uniform float uTime;
  uniform vec3 uGrassColor;
  uniform vec3 uDirtColor;
  uniform vec3 uRockColor;
  uniform vec3 uSnowColor;
  uniform float uTextureScale;
  uniform float uOpacity;
  uniform float uSnowLine;
  
  // Procedural texture generation
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
    vec2 st = vUv * uTextureScale;
    
    // Calculate slope and elevation factors
    float slope = 1.0 - abs(dot(vNormal, vec3(0.0, 1.0, 0.0)));
    float elevationFactor = clamp(vElevation / 10.0, 0.0, 1.0);
    
    // Generate texture variations
    vec3 grassTexture = uGrassColor;
    grassTexture *= 0.8 + 0.4 * noise(st * 8.0);
    grassTexture *= 0.9 + 0.2 * noise(st * 32.0);
    
    // Dirt texture with procedural variation
    vec3 dirtTexture = uDirtColor;
    dirtTexture *= 0.7 + 0.6 * noise(st * 4.0);
    dirtTexture *= 0.8 + 0.4 * noise(st * 16.0);
    
    // Rock texture with procedural variation
    vec3 rockTexture = uRockColor;
    rockTexture *= 0.6 + 0.8 * noise(st * 2.0);
    rockTexture *= 0.7 + 0.6 * noise(st * 8.0);
    
    // Snow texture with procedural variation
    vec3 snowTexture = uSnowColor;
    snowTexture *= 0.9 + 0.2 * noise(st * 16.0);
    
    // Base color mixing
    vec3 finalColor = grassTexture;
    
    // Mix based on slope (steeper = more dirt/rock)
    finalColor = mix(finalColor, dirtTexture, smoothstep(0.2, 0.6, slope));
    
    // Mix rock on very steep slopes
    finalColor = mix(finalColor, rockTexture, smoothstep(0.5, 0.8, slope));
    
    // Apply dynamic snow line based on uSnowLine uniform
    float snowFactor = smoothstep(uSnowLine - 0.1, uSnowLine + 0.1, elevationFactor);
    finalColor = mix(finalColor, snowTexture, snowFactor);
    
    // Ambient occlusion
    float ao = 1.0 - smoothstep(0.0, 1.0, slope * 0.5);
    finalColor *= ao;
    
    // Subtle animation
    finalColor += sin(uTime + vPosition.x * 0.1 + vPosition.z * 0.1) * 0.02;
    
    gl_FragColor = vec4(finalColor, uOpacity);
  }
`

// Material factory function
export function createTerrainMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: TerrainVertexShader,
    fragmentShader: TerrainFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uElevationScale: { value: 1.0 },
      uGrassColor: { value: new THREE.Color('#228B22') },
      uDirtColor: { value: new THREE.Color('#8B4513') },
      uRockColor: { value: new THREE.Color('#696969') },
      uSnowColor: { value: new THREE.Color('#FFFAFA') },
      uTextureScale: { value: 1.0 },
      uOpacity: { value: 1.0 },
      uSnowLine: { value: 0.6 }
    },
    side: THREE.DoubleSide,
    transparent: true
  })
}