import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Advanced Animation System dengan Procedural Motion
const AdvancedAnimations = ({ 
  children,
  animationType = 'organic',
  intensity = 1.0,
  enableMorphing = true,
  enablePhysics = true
}) => {
  const animationRef = useRef()
  const scroll = useScroll()
  const noise3D = createNoise3D()
  
  // Animation state management
  const animationState = useMemo(() => {
    return {
      morphTargets: [],
      physicsObjects: [],
      organicMotion: {
        amplitude: intensity,
        frequency: 1.0,
        phase: Math.random() * Math.PI * 2
      },
      cinematicTransitions: {
        currentScene: 0,
        transitionProgress: 0,
        transitionDuration: 2.0
      }
    }
  }, [intensity])
  
  // Organic motion system dengan natural movement patterns
  const organicMotion = {
    // Breathing animation untuk living objects
    breathing: (time, object, params = {}) => {
      const { amplitude = 0.05, frequency = 0.8, offset = 0 } = params
      const breathe = Math.sin(time * frequency + offset) * amplitude + 1
      
      if (object.scale) {
        object.scale.setScalar(breathe)
      }
    },
    
    // Swaying motion untuk trees, grass, etc.
    swaying: (time, object, params = {}) => {
      const { amplitude = 0.1, frequency = 0.5, windDirection = 0 } = params
      
      const swayX = Math.sin(time * frequency + windDirection) * amplitude
      const swayZ = Math.cos(time * frequency * 0.7 + windDirection) * amplitude * 0.5
      
      if (object.rotation) {
        object.rotation.x = swayX
        object.rotation.z = swayZ
      }
    },
    
    // Floating motion untuk clouds, particles
    floating: (time, object, params = {}) => {
      const { amplitude = 0.5, frequency = 0.3, drift = 0.01 } = params
      
      const floatY = Math.sin(time * frequency) * amplitude
      const driftX = Math.sin(time * 0.1) * drift
      const driftZ = Math.cos(time * 0.15) * drift
      
      if (object.position) {
        object.position.y += floatY * 0.01
        object.position.x += driftX
        object.position.z += driftZ
      }
    },
    
    // Pulsing motion untuk magical/energy effects
    pulsing: (time, object, params = {}) => {
      const { amplitude = 0.2, frequency = 2.0, colorShift = false } = params
      
      const pulse = Math.sin(time * frequency) * amplitude + 1
      
      if (object.scale) {
        object.scale.setScalar(pulse)
      }
      
      if (colorShift && object.material && object.material.emissiveIntensity !== undefined) {
        object.material.emissiveIntensity = pulse * 0.5
      }
    },
    
    // Spiral motion untuk complex patterns
    spiraling: (time, object, params = {}) => {
      const { radius = 1, height = 0.5, frequency = 0.5, axis = 'y' } = params
      
      const angle = time * frequency
      const spiralX = Math.cos(angle) * radius
      const spiralZ = Math.sin(angle) * radius
      const spiralY = Math.sin(time * frequency * 2) * height
      
      if (object.position) {
        if (axis === 'y') {
          object.position.x += spiralX * 0.01
          object.position.z += spiralZ * 0.01
          object.position.y += spiralY * 0.01
        }
      }
    }
  }
  
  // Morphing system untuk shape transitions
  const morphingSystem = {
    // Initialize morph targets
    initializeMorphTargets: (geometry) => {
      if (!geometry.attributes.position) return
      
      const positions = geometry.attributes.position.array
      const morphTargets = []
      
      // Create multiple morph targets dengan different deformations
      for (let i = 0; i < 3; i++) {
        const morphPositions = new Float32Array(positions.length)
        
        for (let j = 0; j < positions.length; j += 3) {
          const x = positions[j]
          const y = positions[j + 1]
          const z = positions[j + 2]
          
          // Apply different noise patterns untuk each morph target
          const noiseScale = 0.1 + i * 0.05
          const noiseX = noise3D(x * noiseScale, y * noiseScale, z * noiseScale + i * 100)
          const noiseY = noise3D(x * noiseScale, y * noiseScale, z * noiseScale + i * 200)
          const noiseZ = noise3D(x * noiseScale, y * noiseScale, z * noiseScale + i * 300)
          
          morphPositions[j] = x + noiseX * 0.5
          morphPositions[j + 1] = y + noiseY * 0.5
          morphPositions[j + 2] = z + noiseZ * 0.5
        }
        
        morphTargets.push({
          name: `morph${i}`,
          positions: morphPositions
        })
      }
      
      return morphTargets
    },
    
    // Apply morphing animation
    applyMorphing: (geometry, time, intensity = 1.0) => {
      if (!geometry.morphAttributes || !geometry.morphAttributes.position) return
      
      const morphTargets = geometry.morphAttributes.position
      const influences = []
      
      // Calculate morph influences berdasarkan time
      for (let i = 0; i < morphTargets.length; i++) {
        const phase = (time * 0.5 + i * Math.PI * 0.5) % (Math.PI * 2)
        const influence = (Math.sin(phase) + 1) * 0.5 * intensity
        influences.push(influence)
      }
      
      // Apply influences
      if (geometry.morphTargetsRelative) {
        for (let i = 0; i < influences.length; i++) {
          geometry.morphTargetsRelative[i] = influences[i]
        }
      }
    }
  }
  
  // Physics simulation untuk realistic motion
  const physicsSystem = {
    // Simple particle physics
    updateParticles: (particles, deltaTime, forces = {}) => {
      const { gravity = -9.81, wind = { x: 0, y: 0, z: 0 }, damping = 0.98 } = forces
      
      particles.forEach(particle => {
        if (!particle.velocity) particle.velocity = new THREE.Vector3()
        if (!particle.acceleration) particle.acceleration = new THREE.Vector3()
        
        // Apply forces
        particle.acceleration.set(wind.x, gravity, wind.z)
        
        // Update velocity
        particle.velocity.add(particle.acceleration.clone().multiplyScalar(deltaTime))
        particle.velocity.multiplyScalar(damping)
        
        // Update position
        if (particle.position) {
          particle.position.add(particle.velocity.clone().multiplyScalar(deltaTime))
        }
        
        // Reset acceleration
        particle.acceleration.set(0, 0, 0)
      })
    },
    
    // Spring physics untuk elastic motion
    springMotion: (object, target, springConstant = 0.1, damping = 0.9) => {
      if (!object.velocity) object.velocity = new THREE.Vector3()
      
      const force = target.clone().sub(object.position).multiplyScalar(springConstant)
      object.velocity.add(force)
      object.velocity.multiplyScalar(damping)
      object.position.add(object.velocity)
    },
    
    // Wave physics untuk water-like motion
    waveMotion: (object, time, waveParams = {}) => {
      const { amplitude = 1, frequency = 1, speed = 1, direction = new THREE.Vector2(1, 0) } = waveParams
      
      if (object.position) {
        const phase = object.position.x * direction.x + object.position.z * direction.y
        const wave = Math.sin(phase * frequency + time * speed) * amplitude
        object.position.y += wave * 0.01
      }
    }
  }
  
  // Cinematic transitions berdasarkan scroll
  const cinematicTransitions = {
    // Scene transition effects
    sceneTransition: (progress, fromScene, toScene) => {
      const transitions = {
        fade: (t) => {
          return {
            opacity: t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2,
            scale: 1
          }
        },
        
        zoom: (t) => {
          const scale = t < 0.5 ? 1 + t : 2 - t
          return {
            opacity: 1,
            scale: scale
          }
        },
        
        slide: (t) => {
          const offset = (t - 0.5) * 100
          return {
            opacity: 1,
            scale: 1,
            position: { x: offset, y: 0, z: 0 }
          }
        },
        
        morph: (t) => {
          return {
            opacity: 1,
            scale: 1,
            morphInfluence: Math.sin(t * Math.PI)
          }
        }
      }
      
      return transitions.fade(progress) // Default transition
    },
    
    // Camera movement patterns
    cameraMovement: (progress, pattern = 'smooth') => {
      const patterns = {
        smooth: (t) => {
          return {
            position: new THREE.Vector3(
              Math.sin(t * Math.PI * 2) * 5,
              2 + Math.sin(t * Math.PI) * 3,
              Math.cos(t * Math.PI * 2) * 5
            ),
            lookAt: new THREE.Vector3(0, 0, 0)
          }
        },
        
        dramatic: (t) => {
          const height = 10 + Math.sin(t * Math.PI) * 15
          const radius = 20 + Math.cos(t * Math.PI) * 10
          return {
            position: new THREE.Vector3(
              Math.sin(t * Math.PI * 4) * radius,
              height,
              Math.cos(t * Math.PI * 4) * radius
            ),
            lookAt: new THREE.Vector3(0, height * 0.3, 0)
          }
        },
        
        flythrough: (t) => {
          const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(-20, 5, -20),
            new THREE.Vector3(0, 15, 0),
            new THREE.Vector3(20, 8, 20),
            new THREE.Vector3(0, 20, 40)
          ])
          
          return {
            position: path.getPoint(t),
            lookAt: path.getPoint(Math.min(1, t + 0.1))
          }
        }
      }
      
      return patterns[pattern] ? patterns[pattern](progress) : patterns.smooth(progress)
    }
  }
  
  // Main animation loop
  useFrame((state, deltaTime) => {
    if (!animationRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const progress = scrollOffset * 4
    const time = state.clock.elapsedTime
    
    // Apply animations berdasarkan type
    animationRef.current.children.forEach((child, index) => {
      if (!child) return
      
      switch (animationType) {
        case 'organic':
          // Apply organic motions
          if (child.userData.animationType === 'breathing') {
            organicMotion.breathing(time, child, child.userData.animationParams)
          } else if (child.userData.animationType === 'swaying') {
            organicMotion.swaying(time, child, child.userData.animationParams)
          } else if (child.userData.animationType === 'floating') {
            organicMotion.floating(time, child, child.userData.animationParams)
          }
          break
          
        case 'physics':
          if (enablePhysics && child.userData.physicsEnabled) {
            // Apply physics-based animations
            if (child.userData.physicsType === 'particle') {
              physicsSystem.updateParticles([child], deltaTime)
            } else if (child.userData.physicsType === 'wave') {
              physicsSystem.waveMotion(child, time, child.userData.waveParams)
            }
          }
          break
          
        case 'cinematic':
          // Apply cinematic transitions
          const sceneProgress = (progress % 1)
          const transition = cinematicTransitions.sceneTransition(sceneProgress)
          
          if (child.material) {
            child.material.opacity = transition.opacity
            child.material.transparent = transition.opacity < 1
          }
          
          if (transition.scale) {
            child.scale.setScalar(transition.scale)
          }
          break
      }
      
      // Apply morphing if enabled
      if (enableMorphing && child.geometry) {
        morphingSystem.applyMorphing(child.geometry, time, intensity)
      }
      
      // Scene-specific animations
      const currentScene = Math.floor(progress)
      
      switch (currentScene) {
        case 0: // Valley
          if (child.userData.sceneType === 'vegetation') {
            organicMotion.swaying(time, child, { 
              amplitude: 0.05, 
              frequency: 0.8,
              windDirection: Math.sin(time * 0.3) * 0.5
            })
          }
          break
          
        case 1: // Mountains
          if (child.userData.sceneType === 'rocks') {
            // Subtle breathing untuk living mountains
            organicMotion.breathing(time, child, { 
              amplitude: 0.01, 
              frequency: 0.1 
            })
          }
          break
          
        case 2: // Clouds
          if (child.userData.sceneType === 'clouds') {
            organicMotion.floating(time, child, { 
              amplitude: 2, 
              frequency: 0.2,
              drift: 0.1
            })
          }
          break
          
        case 3: // Ocean
          if (child.userData.sceneType === 'water') {
            physicsSystem.waveMotion(time, child, {
              amplitude: 0.5,
              frequency: 2,
              speed: 1.5
            })
          }
          break
      }
    })
  })
  
  return (
    <group ref={animationRef}>
      {children}
    </group>
  )
}

export default AdvancedAnimations