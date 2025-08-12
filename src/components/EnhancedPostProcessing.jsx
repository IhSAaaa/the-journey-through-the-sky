import React, { useMemo, useRef } from 'react'
import { extend, useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import {
  EffectComposer,
  Bloom,
  DepthOfField,
  Noise,
  Vignette,
  ChromaticAberration,
  ColorAverage,
  BrightnessContrast,
  HueSaturation,
  ToneMapping,
  SMAA
} from '@react-three/postprocessing'
import {
  BlendFunction,
  KernelSize,
  SMAAPreset,
  ToneMappingMode
} from 'postprocessing'
import * as THREE from 'three'

// Custom Lens Flare Effect
class LensFlareEffect {
  constructor(options = {}) {
    this.uniforms = new Map([
      ['uTime', new THREE.Uniform(0)],
      ['uSunPosition', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
      ['uIntensity', new THREE.Uniform(options.intensity || 1.0)],
      ['uFlareSize', new THREE.Uniform(options.flareSize || 0.1)],
      ['uFlareCount', new THREE.Uniform(options.flareCount || 6)]
    ])

    this.fragmentShader = `
      uniform float uTime;
      uniform vec2 uSunPosition;
      uniform float uIntensity;
      uniform float uFlareSize;
      uniform float uFlareCount;
      
      float circle(vec2 uv, vec2 pos, float radius) {
        float d = length(uv - pos);
        return 1.0 - smoothstep(radius - 0.01, radius + 0.01, d);
      }
      
      float hexagon(vec2 uv, vec2 pos, float size) {
        uv = abs(uv - pos);
        return max(uv.x * 0.866025 + uv.y * 0.5, uv.y) - size;
      }
      
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec2 sunPos = uSunPosition;
        vec2 flareVec = uv - sunPos;
        float flareDist = length(flareVec);
        
        vec3 flareColor = vec3(0.0);
        
        // Main sun flare
        float mainFlare = circle(uv, sunPos, uFlareSize * 0.5);
        flareColor += vec3(1.0, 0.9, 0.7) * mainFlare * 2.0;
        
        // Secondary flares
        for(float i = 1.0; i <= uFlareCount; i++) {
          vec2 flarePos = sunPos - flareVec * (i * 0.15);
          float flareSize = uFlareSize * (1.0 - i * 0.1);
          
          // Circular flares
          float flare = circle(uv, flarePos, flareSize);
          vec3 flareCol = mix(vec3(1.0, 0.8, 0.6), vec3(0.8, 0.9, 1.0), i / uFlareCount);
          flareColor += flareCol * flare * (1.0 - i * 0.15);
          
          // Hexagonal flares
          if(mod(i, 2.0) == 0.0) {
            float hexFlare = 1.0 - smoothstep(0.0, flareSize, hexagon(uv, flarePos, flareSize * 0.7));
            flareColor += vec3(0.9, 0.7, 1.0) * hexFlare * 0.5;
          }
        }
        
        // Lens dirt effect
        vec2 dirtUV = uv * 2.0 - 1.0;
        float dirt = sin(dirtUV.x * 10.0) * cos(dirtUV.y * 8.0) * 0.1;
        dirt += sin(dirtUV.x * 15.0 + uTime) * cos(dirtUV.y * 12.0 - uTime) * 0.05;
        flareColor *= (1.0 + dirt);
        
        // Fade dengan distance dari sun
        float fadeFactor = 1.0 - smoothstep(0.0, 0.8, flareDist);
        flareColor *= fadeFactor * uIntensity;
        
        outputColor = inputColor + vec4(flareColor, 0.0);
      }
    `
  }
}

// Custom God Rays Effect
class GodRaysEffect {
  constructor(options = {}) {
    this.uniforms = new Map([
      ['uTime', new THREE.Uniform(0)],
      ['uSunPosition', new THREE.Uniform(new THREE.Vector2(0.5, 0.5))],
      ['uIntensity', new THREE.Uniform(options.intensity || 0.5)],
      ['uDensity', new THREE.Uniform(options.density || 0.8)],
      ['uWeight', new THREE.Uniform(options.weight || 0.4)],
      ['uSamples', new THREE.Uniform(options.samples || 50)]
    ])

    this.fragmentShader = `
      uniform float uTime;
      uniform vec2 uSunPosition;
      uniform float uIntensity;
      uniform float uDensity;
      uniform float uWeight;
      uniform float uSamples;
      
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec2 deltaTextCoord = vec2(uv - uSunPosition);
        deltaTextCoord *= 1.0 / uSamples * uDensity;
        
        vec2 textCoo = uv;
        float illuminationDecay = 1.0;
        vec4 color = inputColor;
        
        for(int i = 0; i < int(uSamples); i++) {
          textCoo -= deltaTextCoord;
          vec4 sample = texture2D(inputBuffer, textCoo);
          
          sample *= illuminationDecay * uWeight;
          color += sample;
          illuminationDecay *= uDensity;
        }
        
        outputColor = color * uIntensity;
      }
    `
  }
}

// Register custom effects
extend({ LensFlareEffect, GodRaysEffect })

export default function EnhancedPostProcessing() {
  const scroll = useScroll()
  const { camera, scene } = useThree()
  const composerRef = useRef()
  const lensFlareRef = useRef()
  const godRaysRef = useRef()
  const bloomRef = useRef()
  const dofRef = useRef()
  const vignetteRef = useRef()
  const chromaticRef = useRef()
  const brightnessRef = useRef()
  const hueRef = useRef()
  
  // Dynamic post-processing parameters berdasarkan scene
  const sceneEffects = useMemo(() => {
    return {
      valley: {
        bloom: { intensity: 0.8, luminanceThreshold: 0.9, luminanceSmoothing: 0.4 },
        dof: { focusDistance: 0.02, focalLength: 0.05, bokehScale: 3.0 },
        vignette: { offset: 0.3, darkness: 0.5 },
        chromatic: { offset: [0.001, 0.001] },
        brightness: { brightness: 0.1, contrast: 0.1 },
        hue: { hue: 0.05, saturation: 0.2 },
        lensFlare: { intensity: 0.3, flareSize: 0.08 },
        godRays: { intensity: 0.2, density: 0.7 }
      },
      mountains: {
        bloom: { intensity: 1.2, luminanceThreshold: 0.8, luminanceSmoothing: 0.5 },
        dof: { focusDistance: 0.05, focalLength: 0.08, bokehScale: 4.0 },
        vignette: { offset: 0.2, darkness: 0.6 },
        chromatic: { offset: [0.002, 0.001] },
        brightness: { brightness: 0.05, contrast: 0.15 },
        hue: { hue: -0.02, saturation: 0.1 },
        lensFlare: { intensity: 0.6, flareSize: 0.12 },
        godRays: { intensity: 0.4, density: 0.8 }
      },
      clouds: {
        bloom: { intensity: 1.8, luminanceThreshold: 0.6, luminanceSmoothing: 0.7 },
        dof: { focusDistance: 0.1, focalLength: 0.12, bokehScale: 6.0 },
        vignette: { offset: 0.1, darkness: 0.4 },
        chromatic: { offset: [0.003, 0.002] },
        brightness: { brightness: 0.2, contrast: 0.2 },
        hue: { hue: 0.1, saturation: -0.1 },
        lensFlare: { intensity: 1.0, flareSize: 0.15 },
        godRays: { intensity: 0.8, density: 0.9 }
      },
      ocean: {
        bloom: { intensity: 1.5, luminanceThreshold: 0.7, luminanceSmoothing: 0.6 },
        dof: { focusDistance: 0.08, focalLength: 0.1, bokehScale: 5.0 },
        vignette: { offset: 0.25, darkness: 0.7 },
        chromatic: { offset: [0.001, 0.002] },
        brightness: { brightness: -0.05, contrast: 0.25 },
        hue: { hue: -0.05, saturation: 0.3 },
        lensFlare: { intensity: 0.8, flareSize: 0.1 },
        godRays: { intensity: 0.6, density: 0.85 }
      }
    }
  }, [])
  
  useFrame((state) => {
    if (!scroll) return
    
    const offset = scroll.offset
    const progress = offset * 4 // 4 scenes
    
    // Determine current scene
    let currentScene = 'valley'
    let sceneProgress = progress
    
    if (progress >= 3) {
      currentScene = 'ocean'
      sceneProgress = progress - 3
    } else if (progress >= 2) {
      currentScene = 'clouds'
      sceneProgress = progress - 2
    } else if (progress >= 1) {
      currentScene = 'mountains'
      sceneProgress = progress - 1
    }
    
    const effects = sceneEffects[currentScene]
    
    // Update Bloom
    if (bloomRef.current) {
      bloomRef.current.intensity = effects.bloom.intensity
      bloomRef.current.luminanceThreshold = effects.bloom.luminanceThreshold
      bloomRef.current.luminanceSmoothing = effects.bloom.luminanceSmoothing
    }
    
    // Update Depth of Field
    if (dofRef.current) {
      dofRef.current.target = effects.dof.focusDistance
      dofRef.current.focalLength = effects.dof.focalLength
      dofRef.current.bokehScale = effects.dof.bokehScale
    }
    
    // Update Vignette
    if (vignetteRef.current) {
      vignetteRef.current.offset = effects.vignette.offset
      vignetteRef.current.darkness = effects.vignette.darkness
    }
    
    // Update Chromatic Aberration
    if (chromaticRef.current) {
      chromaticRef.current.offset.set(...effects.chromatic.offset)
    }
    
    // Update Brightness/Contrast
    if (brightnessRef.current) {
      brightnessRef.current.brightness = effects.brightness.brightness
      brightnessRef.current.contrast = effects.brightness.contrast
    }
    
    // Update Hue/Saturation
    if (hueRef.current) {
      hueRef.current.hue = effects.hue.hue
      hueRef.current.saturation = effects.hue.saturation
    }
    
    // Update Lens Flare
    if (lensFlareRef.current) {
      lensFlareRef.current.uniforms.get('uTime').value = state.clock.elapsedTime
      lensFlareRef.current.uniforms.get('uIntensity').value = effects.lensFlare.intensity
      lensFlareRef.current.uniforms.get('uFlareSize').value = effects.lensFlare.flareSize
      
      // Calculate sun position in screen space
      const sunPosition = new THREE.Vector3(50, 50, 50)
      sunPosition.project(camera)
      lensFlareRef.current.uniforms.get('uSunPosition').value.set(
        (sunPosition.x + 1) / 2,
        (sunPosition.y + 1) / 2
      )
    }
    
    // Update God Rays
    if (godRaysRef.current) {
      godRaysRef.current.uniforms.get('uTime').value = state.clock.elapsedTime
      godRaysRef.current.uniforms.get('uIntensity').value = effects.godRays.intensity
      godRaysRef.current.uniforms.get('uDensity').value = effects.godRays.density
      
      // Same sun position calculation
      const sunPosition = new THREE.Vector3(50, 50, 50)
      sunPosition.project(camera)
      godRaysRef.current.uniforms.get('uSunPosition').value.set(
        (sunPosition.x + 1) / 2,
        (sunPosition.y + 1) / 2
      )
    }
  })
  
  return (
    <EffectComposer ref={composerRef} multisampling={4}>
      {/* Anti-aliasing */}
      <SMAA preset={SMAAPreset.HIGH} />
      
      {/* Depth of Field */}
      <DepthOfField
        ref={dofRef}
        focusDistance={0.02}
        focalLength={0.05}
        bokehScale={3.0}
        height={480}
      />
      
      {/* God Rays */}
      <godRaysEffect
        ref={godRaysRef}
        blendFunction={BlendFunction.SCREEN}
        intensity={0.2}
        density={0.7}
        weight={0.4}
        samples={50}
      />
      
      {/* Bloom */}
      <Bloom
        ref={bloomRef}
        intensity={0.8}
        kernelSize={KernelSize.LARGE}
        luminanceThreshold={0.9}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      
      {/* Lens Flare */}
      <lensFlareEffect
        ref={lensFlareRef}
        blendFunction={BlendFunction.SCREEN}
        intensity={0.3}
        flareSize={0.08}
        flareCount={6}
      />
      
      {/* Chromatic Aberration */}
      <ChromaticAberration
        ref={chromaticRef}
        blendFunction={BlendFunction.NORMAL}
        offset={[0.001, 0.001]}
      />
      
      {/* Color Grading */}
      <BrightnessContrast
        ref={brightnessRef}
        brightness={0.1}
        contrast={0.1}
      />
      
      <HueSaturation
        ref={hueRef}
        blendFunction={BlendFunction.NORMAL}
        hue={0.05}
        saturation={0.2}
      />
      
      {/* Vignette */}
      <Vignette
        ref={vignetteRef}
        offset={0.3}
        darkness={0.5}
        eskil={false}
        blendFunction={BlendFunction.NORMAL}
      />
      
      {/* Tone Mapping */}
      <ToneMapping
        blendFunction={BlendFunction.NORMAL}
        adaptive={true}
        resolution={256}
        middleGrey={0.6}
        maxLuminance={16.0}
        averageLuminance={1.0}
        adaptationRate={1.0}
        mode={ToneMappingMode.ACES_FILMIC}
      />
      
      {/* Film Grain */}
      <Noise
        blendFunction={BlendFunction.OVERLAY}
        opacity={0.1}
        premultiply
      />
    </EffectComposer>
  )
}