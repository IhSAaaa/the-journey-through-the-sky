import * as THREE from 'three'

// Advanced Atmosphere Shader dengan volumetric fog dan atmospheric scattering
export const AtmosphereVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vDistance;
  
  uniform vec3 uCameraPosition;
  
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Distance dari camera untuk fog calculation
    vDistance = length(worldPosition.xyz - uCameraPosition);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

export const AtmosphereFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying vec3 vNormal;
  varying float vDistance;
  
  uniform float uTime;
  uniform vec3 uSunPosition;
  uniform vec3 uCameraPosition;
  uniform vec3 uAtmosphereColor;
  uniform vec3 uHorizonColor;
  uniform vec3 uZenithColor;
  uniform float uFogDensity;
  uniform float uFogHeight;
  uniform float uScatteringStrength;
  uniform float uMieScattering;
  uniform float uRayleighScattering;
  uniform float uSunIntensity;
  
  // Rayleigh scattering coefficient (wavelength dependent)
  vec3 rayleighCoeff = vec3(5.8e-6, 13.5e-6, 33.1e-6);
  
  // Mie scattering coefficient
  float mieCoeff = 2e-5;
  
  // Phase function untuk Rayleigh scattering
  float rayleighPhase(float cosTheta) {
    return (3.0 / (16.0 * 3.14159)) * (1.0 + cosTheta * cosTheta);
  }
  
  // Phase function untuk Mie scattering
  float miePhase(float cosTheta, float g) {
    float g2 = g * g;
    return (3.0 / (8.0 * 3.14159)) * ((1.0 - g2) * (1.0 + cosTheta * cosTheta)) / 
           ((2.0 + g2) * pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5));
  }
  
  // Atmospheric density function
  float atmosphericDensity(float height) {
    return exp(-height / 8000.0); // Scale height 8km
  }
  
  // Sun disk calculation
  float sunDisk(vec3 viewDir, vec3 sunDir, float size) {
    float cosTheta = dot(viewDir, sunDir);
    return smoothstep(size - 0.01, size, cosTheta);
  }
  
  // Volumetric fog calculation
  float volumetricFog(vec3 worldPos, vec3 cameraPos, vec3 sunPos) {
    vec3 viewDir = normalize(worldPos - cameraPos);
    vec3 sunDir = normalize(sunPos);
    
    float distance = length(worldPos - cameraPos);
    float height = worldPos.y;
    
    // Height-based fog density
    float heightFog = exp(-max(0.0, height) / uFogHeight);
    
    // Distance-based fog
    float distanceFog = 1.0 - exp(-distance * uFogDensity * 0.0001);
    
    // Light scattering dalam fog
    float cosTheta = dot(viewDir, sunDir);
    float scattering = miePhase(cosTheta, 0.8);
    
    return heightFog * distanceFog * (1.0 + scattering * 0.5);
  }
  
  // Atmospheric scattering calculation
  vec3 atmosphericScattering(vec3 viewDir, vec3 sunDir, float distance) {
    float cosTheta = dot(viewDir, sunDir);
    
    // Rayleigh scattering (blue sky)
    vec3 rayleigh = rayleighCoeff * uRayleighScattering * rayleighPhase(cosTheta);
    
    // Mie scattering (haze, sun glow)
    float mie = mieCoeff * uMieScattering * miePhase(cosTheta, 0.8);
    
    // Optical depth calculation
    float opticalDepth = distance * 0.00001;
    
    // Extinction
    vec3 extinction = exp(-(rayleighCoeff + mieCoeff) * opticalDepth);
    
    // In-scattering
    vec3 inscattering = (rayleigh + vec3(mie)) * (1.0 - extinction);
    
    return inscattering * uSunIntensity;
  }
  
  // Sky gradient calculation
  vec3 skyGradient(vec3 viewDir, vec3 sunDir) {
    float elevation = viewDir.y;
    float azimuth = atan(viewDir.z, viewDir.x);
    
    // Vertical gradient dari horizon ke zenith
    float t = smoothstep(-0.1, 0.3, elevation);
    vec3 skyColor = mix(uHorizonColor, uZenithColor, t);
    
    // Sun influence pada sky color
    float sunInfluence = max(0.0, dot(viewDir, sunDir));
    vec3 sunColor = vec3(1.0, 0.9, 0.7);
    skyColor = mix(skyColor, sunColor, pow(sunInfluence, 8.0) * 0.3);
    
    return skyColor;
  }
  
  void main() {
    vec3 viewDirection = normalize(vWorldPosition - uCameraPosition);
    vec3 sunDirection = normalize(uSunPosition);
    
    // Base sky color
    vec3 skyColor = skyGradient(viewDirection, sunDirection);
    
    // Atmospheric scattering
    vec3 scattering = atmosphericScattering(viewDirection, sunDirection, vDistance);
    
    // Volumetric fog
    float fog = volumetricFog(vWorldPosition, uCameraPosition, uSunPosition);
    
    // Sun disk
    float sun = sunDisk(viewDirection, sunDirection, 0.9995);
    vec3 sunColor = vec3(1.0, 0.9, 0.7) * sun * uSunIntensity;
    
    // Combine all effects
    vec3 finalColor = skyColor + scattering + sunColor;
    
    // Apply fog
    finalColor = mix(finalColor, uAtmosphereColor, fog * 0.5);
    
    // Atmospheric perspective
    float atmosphericFade = exp(-vDistance * 0.00005);
    finalColor *= atmosphericFade;
    
    // Tone mapping untuk realistic colors
    finalColor = finalColor / (finalColor + vec3(1.0));
    finalColor = pow(finalColor, vec3(1.0/2.2)); // Gamma correction
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`

// Fog Shader untuk ground fog effects
export const FogVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vElevation;
  
  uniform float uTime;
  uniform float uFogSpeed;
  uniform vec3 uWindDirection;
  
  // Simple noise function
  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }
  
  void main() {
    vUv = uv;
    
    // Wind animation
    vec3 windOffset = uWindDirection * uTime * uFogSpeed;
    vec3 animatedPosition = position + windOffset;
    
    // Fog displacement
    float noiseValue = noise(animatedPosition.xz * 0.1 + uTime * 0.1);
    animatedPosition.y += sin(noiseValue * 6.28) * 0.5;
    
    vPosition = animatedPosition;
    vWorldPosition = (modelMatrix * vec4(animatedPosition, 1.0)).xyz;
    vElevation = animatedPosition.y;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(animatedPosition, 1.0);
  }
`

export const FogFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vElevation;
  
  uniform float uTime;
  uniform vec3 uFogColor;
  uniform float uFogDensity;
  uniform float uFogOpacity;
  uniform vec3 uCameraPosition;
  uniform vec3 uSunPosition;
  
  // Improved noise function
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = fract(sin(dot(i, vec2(12.9898, 78.233))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(12.9898, 78.233))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(12.9898, 78.233))) * 43758.5453);
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // Fractal noise
  float fbm(vec2 p) {
    float value = 0.0;
    float amplitude = 0.5;
    
    for(int i = 0; i < 4; i++) {
      value += amplitude * noise(p);
      p *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  void main() {
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    
    // Fog density calculation
    vec2 noisePos = vWorldPosition.xz * 0.01 + uTime * 0.02;
    float fogNoise = fbm(noisePos);
    
    // Height-based fog density
    float heightFactor = exp(-max(0.0, vElevation) * 0.1);
    
    // Distance-based fog
    float distance = length(vWorldPosition - uCameraPosition);
    float distanceFactor = smoothstep(0.0, 100.0, distance);
    
    // Final fog density
    float density = fogNoise * heightFactor * distanceFactor * uFogDensity;
    
    // Light scattering dalam fog
    float lightScatter = max(0.0, dot(viewDirection, sunDirection));
    vec3 scatterColor = mix(uFogColor, vec3(1.0, 0.9, 0.7), pow(lightScatter, 4.0) * 0.3);
    
    // Final opacity
    float opacity = density * uFogOpacity;
    opacity = smoothstep(0.0, 1.0, opacity);
    
    gl_FragColor = vec4(scatterColor, opacity);
  }
`

// Material factory functions
export function createAtmosphereMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: AtmosphereVertexShader,
    fragmentShader: AtmosphereFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uSunPosition: { value: new THREE.Vector3(50, 50, 50) },
      uCameraPosition: { value: new THREE.Vector3() },
      uAtmosphereColor: { value: new THREE.Color('#87CEEB') },
      uHorizonColor: { value: new THREE.Color('#FFE4B5') },
      uZenithColor: { value: new THREE.Color('#4169E1') },
      uFogDensity: { value: 1.0 },
      uFogHeight: { value: 10.0 },
      uScatteringStrength: { value: 1.0 },
      uMieScattering: { value: 1.0 },
      uRayleighScattering: { value: 1.0 },
      uSunIntensity: { value: 1.0 }
    },
    side: THREE.BackSide,
    depthWrite: false
  })
}

export function createFogMaterial() {
  return new THREE.ShaderMaterial({
    vertexShader: FogVertexShader,
    fragmentShader: FogFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uFogSpeed: { value: 0.1 },
      uWindDirection: { value: new THREE.Vector3(1.0, 0.0, 0.5) },
      uFogColor: { value: new THREE.Color('#ffffff') },
      uFogDensity: { value: 1.0 },
      uFogOpacity: { value: 0.3 },
      uCameraPosition: { value: new THREE.Vector3() },
      uSunPosition: { value: new THREE.Vector3(50, 50, 50) }
    },
    transparent: true,
    side: THREE.DoubleSide,
    depthWrite: false
  })
}