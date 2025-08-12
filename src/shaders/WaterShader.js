import * as THREE from 'three'

// Advanced Water Shader dengan realistic waves, refraction, dan reflection
export const WaterVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec4 vScreenPosition;
  
  uniform float uTime;
  uniform float uWaveHeight;
  uniform float uWaveFrequency;
  uniform vec2 uWaveDirection;
  
  // Gerstner wave function untuk realistic ocean waves
  vec3 gerstnerWave(vec2 position, vec2 direction, float amplitude, float frequency, float phase) {
    float steepness = 0.5;
    float k = frequency;
    float c = sqrt(9.8 / k);
    vec2 d = normalize(direction);
    float f = k * (dot(d, position) - c * uTime + phase);
    float a = steepness / k;
    
    return vec3(
      d.x * (a * amplitude * sin(f)),
      a * amplitude * cos(f),
      d.y * (a * amplitude * sin(f))
    );
  }
  
  // Multiple wave calculation
  vec3 calculateWaves(vec2 position) {
    vec3 wave = vec3(0.0);
    
    // Primary wave
    wave += gerstnerWave(position, uWaveDirection, uWaveHeight, uWaveFrequency, 0.0);
    
    // Secondary waves untuk complexity
    wave += gerstnerWave(position, vec2(0.8, 0.6), uWaveHeight * 0.5, uWaveFrequency * 1.5, 1.0);
    wave += gerstnerWave(position, vec2(-0.3, 0.9), uWaveHeight * 0.3, uWaveFrequency * 2.0, 2.0);
    wave += gerstnerWave(position, vec2(0.5, -0.8), uWaveHeight * 0.2, uWaveFrequency * 3.0, 3.0);
    
    // High frequency detail waves
    wave += gerstnerWave(position, vec2(0.2, 0.7), uWaveHeight * 0.1, uWaveFrequency * 8.0, 4.0);
    wave += gerstnerWave(position, vec2(-0.6, 0.4), uWaveHeight * 0.05, uWaveFrequency * 16.0, 5.0);
    
    return wave;
  }
  
  // Calculate normal dari wave displacement
  vec3 calculateNormal(vec2 position) {
    float eps = 0.1;
    vec3 center = calculateWaves(position);
    vec3 right = calculateWaves(position + vec2(eps, 0.0));
    vec3 forward = calculateWaves(position + vec2(0.0, eps));
    
    vec3 dx = right - center;
    vec3 dz = forward - center;
    
    return normalize(cross(dx, dz));
  }
  
  void main() {
    vUv = uv;
    
    vec2 worldPos = position.xz;
    vec3 waveDisplacement = calculateWaves(worldPos);
    
    vec3 newPosition = position + waveDisplacement;
    vPosition = newPosition;
    vWorldPosition = (modelMatrix * vec4(newPosition, 1.0)).xyz;
    
    // Calculate normal untuk realistic lighting
    vNormal = calculateNormal(worldPos);
    
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Screen position untuk reflection/refraction
    vScreenPosition = gl_Position;
  }
`

export const WaterFragmentShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec4 vScreenPosition;
  
  uniform float uTime;
  uniform vec3 uWaterColor;
  uniform vec3 uDeepWaterColor;
  uniform float uTransparency;
  uniform float uReflectionStrength;
  uniform float uRefractionStrength;
  uniform vec3 uSunPosition;
  uniform vec3 uCameraPosition;
  uniform samplerCube uEnvironmentMap;
  
  // Fresnel calculation
  float fresnel(vec3 viewDirection, vec3 normal, float power) {
    return pow(1.0 - max(0.0, dot(viewDirection, normal)), power);
  }
  
  // Procedural foam generation
  float foam(vec2 position, float time) {
    vec2 st = position * 0.1;
    float noise1 = sin(st.x * 10.0 + time * 2.0) * cos(st.y * 8.0 + time * 1.5);
    float noise2 = sin(st.x * 15.0 - time * 1.8) * cos(st.y * 12.0 - time * 2.2);
    return smoothstep(0.7, 1.0, (noise1 + noise2) * 0.5 + 0.5);
  }
  
  // Caustics simulation
  float caustics(vec2 position, float time) {
    vec2 st = position * 0.05;
    float c1 = sin((st.x + st.y) * 20.0 + time * 3.0);
    float c2 = sin((st.x - st.y) * 15.0 - time * 2.0);
    float c3 = sin(st.x * 25.0 + time * 4.0) * sin(st.y * 18.0 - time * 3.5);
    return max(0.0, (c1 + c2 + c3) * 0.3);
  }
  
  void main() {
    vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
    vec3 normal = normalize(vNormal);
    
    // Screen coordinates untuk reflection/refraction
    vec2 screenUV = (vScreenPosition.xy / vScreenPosition.w) * 0.5 + 0.5;
    
    // Fresnel effect
    float fresnelFactor = fresnel(viewDirection, normal, 2.0);
    
    // Environment reflection
    vec3 reflectionDirection = reflect(-viewDirection, normal);
    vec3 reflectionColor = textureCube(uEnvironmentMap, reflectionDirection).rgb;
    
    // Water color berdasarkan depth dan angle
    float depth = length(vWorldPosition - uCameraPosition) * 0.01;
    vec3 waterColor = mix(uWaterColor, uDeepWaterColor, clamp(depth, 0.0, 1.0));
    
    // Sun reflection (specular)
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    vec3 halfVector = normalize(viewDirection + sunDirection);
    float specular = pow(max(0.0, dot(normal, halfVector)), 128.0);
    
    // Foam effect
    float foamMask = foam(vWorldPosition.xz, uTime);
    vec3 foamColor = vec3(1.0);
    
    // Caustics effect
    float causticsEffect = caustics(vWorldPosition.xz, uTime);
    
    // Combine all effects
    vec3 finalColor = waterColor;
    
    // Add reflection
    finalColor = mix(finalColor, reflectionColor, fresnelFactor * uReflectionStrength);
    
    // Add sun specular
    finalColor += vec3(1.0, 0.9, 0.7) * specular * 0.5;
    
    // Add caustics
    finalColor += vec3(0.3, 0.6, 1.0) * causticsEffect * 0.3;
    
    // Add foam
    finalColor = mix(finalColor, foamColor, foamMask * 0.8);
    
    // Underwater tint effect
    if (viewDirection.y < 0.0) {
      finalColor *= vec3(0.6, 0.8, 1.0);
    }
    
    // Transparency berdasarkan fresnel
    float alpha = mix(uTransparency, 1.0, fresnelFactor);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

// Material factory function
export function createWaterMaterial(environmentMap) {
  return new THREE.ShaderMaterial({
    vertexShader: WaterVertexShader,
    fragmentShader: WaterFragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uWaveHeight: { value: 1.0 },
      uWaveFrequency: { value: 0.5 },
      uWaveDirection: { value: new THREE.Vector2(1.0, 0.5) },
      uWaterColor: { value: new THREE.Color('#4682B4') },
      uDeepWaterColor: { value: new THREE.Color('#191970') },
      uTransparency: { value: 0.8 },
      uReflectionStrength: { value: 0.6 },
      uRefractionStrength: { value: 0.3 },
      uSunPosition: { value: new THREE.Vector3(50, 50, 50) },
      uCameraPosition: { value: new THREE.Vector3() },
      uEnvironmentMap: { value: environmentMap }
    },
    transparent: true,
    side: THREE.DoubleSide
  })
}