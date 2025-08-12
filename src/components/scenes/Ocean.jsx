import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createWaterMaterial } from '../../shaders/WaterShader'
import ParticleSystem from '../particles/ParticleSystem'
import AdvancedAnimations from '../animation/AdvancedAnimations'

const Ocean = () => {
  const oceanRef = useRef()
  const scroll = useScroll()
  
  // Enhanced ocean geometry with higher resolution
  const oceanGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(500, 500, 256, 256)
    return geometry
  }, [])
  
  // Enhanced ocean material with water shader
  const oceanMaterial = useMemo(() => {
    // Create simple environment map for reflections
    const envMap = new THREE.CubeTextureLoader().load([
      // Placeholder URLs - in real project, use actual skybox textures
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
    ])
    
    return createWaterMaterial(envMap)
  }, [])
  
  // Create wave data
  const waveData = useMemo(() => {
    const waves = []
    for (let i = 0; i < 20; i++) {
      waves.push({
        position: [
          (Math.random() - 0.5) * 200,
          0,
          (Math.random() - 0.5) * 200
        ],
        speed: Math.random() * 0.5 + 0.3,
        amplitude: Math.random() * 0.5 + 0.5,
        frequency: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      })
    }
    return waves
  }, [])
  
  // Sun reflection data
  const reflectionData = useMemo(() => {
    const reflections = []
    for (let i = 0; i < 15; i++) {
      reflections.push({
        position: [
          (Math.random() - 0.5) * 100,
          0.1,
          (Math.random() - 0.5) * 100
        ],
        scale: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      })
    }
    return reflections
  }, [])

  useFrame((state, delta) => {
    if (scroll && oceanRef.current) {
      const scrollOffset = scroll.offset
      
      // Ocean is most visible in scene 4 (scroll 0.75 - 1)
      const oceanVisibility = scrollOffset < 0.75 ? 0 : (scrollOffset - 0.75) * 4
      
      // Ocean visibility and transparency
      if (oceanMaterial && oceanMaterial.uniforms) {
        oceanMaterial.uniforms.uTransparency.value = 0.8 * oceanVisibility
      } else {
        oceanMaterial.opacity = oceanVisibility * 0.8
      }
      
      // Enhanced ocean animation with water shader
      if (oceanMaterial && oceanMaterial.uniforms) {
        oceanMaterial.uniforms.uTime.value = state.clock.elapsedTime
        oceanMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)
        oceanMaterial.uniforms.uSunPosition.value.set(50, 50, 50)
        
        // Dynamic wave parameters based on scroll
        const waveIntensity = 1.0 + scrollOffset * 2.0
        oceanMaterial.uniforms.uWaveHeight.value = waveIntensity
        oceanMaterial.uniforms.uWaveFrequency.value = 0.5 + scrollOffset * 0.3
      }
      
      // Animate sun reflections
      oceanRef.current.children.forEach((child, index) => {
        if (child.userData.type === 'reflection') {
          const reflection = reflectionData[index - 1] // -1 because first child is ocean mesh
          if (reflection) {
            const time = state.clock.elapsedTime
            child.material.opacity = oceanVisibility * 0.6 * (0.5 + Math.sin(time * 3 + reflection.phase) * 0.5)
            child.scale.setScalar(reflection.scale * (1 + Math.sin(time * 2 + reflection.phase) * 0.2))
          }
        }
        
        if (child.userData.type === 'foam') {
          child.material.opacity = oceanVisibility * 0.4
        }
      })
    }
  })

  return (
    <AdvancedAnimations animationType="physics" intensity={2.0}>
      <group ref={oceanRef}>
        {/* Ocean Particle Effects */}
        <ParticleSystem 
          type="rain"
          count={250}
          area={150}
          height={60}
        />
        
        <ParticleSystem 
          type="dust"
          count={120}
          area={120}
          height={40}
        />
        
        {/* Main ocean surface */}
        <mesh
          geometry={oceanGeometry}
          material={oceanMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, 0]}
          receiveShadow
          userData={{
            physicsEnabled: true,
            physicsType: 'wave',
            waveParams: {
              amplitude: 0.8,
              frequency: 2.5,
              speed: 2.0,
              direction: new THREE.Vector2(1, 0.3)
            },
            sceneType: 'water'
          }}
        />
      
      {/* Sun reflections on water */}
      {reflectionData.map((reflection, index) => (
        <mesh
          key={`reflection-${index}`}
          position={reflection.position}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={reflection.scale}
          userData={{ type: 'reflection' }}
        >
          <circleGeometry args={[1, 8]} />
          <meshBasicMaterial
            color="#FFD700"
            transparent
            opacity={0.3}
          />
        </mesh>
      ))}
      
      {/* Wave foam */}
      {Array.from({ length: 25 }).map((_, index) => (
        <mesh
          key={`foam-${index}`}
          position={[
            (Math.random() - 0.5) * 250,
            0.2,
            (Math.random() - 0.5) * 250
          ]}
          rotation={[-Math.PI / 2, 0, Math.random() * Math.PI * 2]}
          scale={Math.random() * 3 + 1}
          userData={{ type: 'foam' }}
        >
          <circleGeometry args={[1, 6]} />
          <meshBasicMaterial
            color="#F0F8FF"
            transparent
            opacity={0.2}
          />
        </mesh>
      ))}
      
      {/* Distant islands */}
      {Array.from({ length: 3 }).map((_, index) => {
        const angle = (index / 3) * Math.PI * 2
        const distance = 150 + index * 20
        return (
          <group
            key={`island-${index}`}
            position={[
              Math.cos(angle) * distance,
              -2,
              Math.sin(angle) * distance
            ]}
          >
            {/* Island base */}
            <mesh>
              <cylinderGeometry args={[8, 12, 6, 8]} />
              <meshLambertMaterial color="#8FBC8F" transparent />
            </mesh>
            
            {/* Island vegetation */}
            <mesh position={[0, 4, 0]}>
              <sphereGeometry args={[6, 8, 8]} />
              <meshLambertMaterial color="#228B22" transparent />
            </mesh>
          </group>
        )
      })}
      
      {/* Seagulls in the distance */}
      {Array.from({ length: 8 }).map((_, index) => (
        <mesh
          key={`seagull-${index}`}
          position={[
            (Math.random() - 0.5) * 200,
            Math.random() * 10 + 15,
            (Math.random() - 0.5) * 200
          ]}
          scale={0.5}
        >
          <sphereGeometry args={[0.3, 6, 6]} />
          <meshBasicMaterial
            color="#FFFFFF"
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
      </group>
    </AdvancedAnimations>
  )
}

export default Ocean