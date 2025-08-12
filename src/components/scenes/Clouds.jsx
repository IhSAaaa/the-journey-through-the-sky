import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createCloudMaterial } from '../../shaders/CloudShader'
import ParticleSystem from '../particles/ParticleSystem'
import AdvancedAnimations from '../animation/AdvancedAnimations'

const Clouds = () => {
  const cloudsRef = useRef()
  const scroll = useScroll()
  
  // Create cloud data with procedural shapes
  const cloudData = useMemo(() => {
    const clouds = []
    
    // Large clouds for main scene
    for (let i = 0; i < 12; i++) {
      const cloudParts = []
      const numParts = 4 + Math.floor(Math.random() * 4)
      
      for (let j = 0; j < numParts; j++) {
        cloudParts.push({
          position: [
            (Math.random() - 0.5) * 8,
            (Math.random() - 0.5) * 3,
            (Math.random() - 0.5) * 8
          ],
          scale: Math.random() * 2 + 1.5,
          opacity: Math.random() * 0.3 + 0.6
        })
      }
      
      clouds.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 150,
          Math.random() * 30 + 35,
          (Math.random() - 0.5) * 150
        ],
        parts: cloudParts,
        speed: Math.random() * 0.2 + 0.1,
        phase: Math.random() * Math.PI * 2
      })
    }
    
    return clouds
  }, [])
  
  // Enhanced cloud materials with volumetric shader
  const cloudMaterial = useMemo(() => {
    return createCloudMaterial()
  }, [])
  
  // Volumetric light rays
  const lightRays = useMemo(() => {
    const rays = []
    for (let i = 0; i < 8; i++) {
      rays.push({
        position: [
          (Math.random() - 0.5) * 100,
          Math.random() * 20 + 40,
          (Math.random() - 0.5) * 100
        ],
        rotation: Math.random() * Math.PI,
        length: Math.random() * 30 + 20
      })
    }
    return rays
  }, [])

  useFrame((state, delta) => {
    if (scroll && cloudsRef.current) {
      const scrollOffset = scroll.offset
      
      // Clouds are most visible in scene 3 (scroll 0.5 - 0.75)
      const cloudVisibility = scrollOffset < 0.5 ? 0 :
                             scrollOffset < 0.75 ? (scrollOffset - 0.5) * 4 :
                             scrollOffset < 1 ? 1 - (scrollOffset - 0.75) * 4 : 0
      
      // Enhanced cloud animation with volumetric effects
      if (cloudMaterial && cloudMaterial.uniforms) {
        cloudMaterial.uniforms.uTime.value = state.clock.elapsedTime
        cloudMaterial.uniforms.uOpacity.value = cloudVisibility
        cloudMaterial.uniforms.uDensity.value = 0.8 + scrollOffset * 0.4
        cloudMaterial.uniforms.uSunPosition.value.set(50, 50, 50)
        cloudMaterial.uniforms.uCameraPosition.value.copy(state.camera.position)
        
        // Dynamic wind based on scroll
        const windStrength = 0.3 + scrollOffset * 0.2
        cloudMaterial.uniforms.uWindDirection.value.set(1.0, 0.0, 0.5 + scrollOffset)
      }
      
      // Animate clouds
      cloudsRef.current.children.forEach((cloudGroup, index) => {
        if (cloudGroup.userData.type === 'cloud') {
          const cloud = cloudData[index]
          if (cloud && cloud.position) {
            const time = state.clock.elapsedTime
            
            // Gentle floating motion
            cloudGroup.position.x = cloud.position[0] + Math.sin(time * cloud.speed + cloud.phase) * 5
            cloudGroup.position.y = cloud.position[1] + Math.sin(time * cloud.speed * 0.5 + cloud.phase) * 2
            cloudGroup.position.z = cloud.position[2] + Math.cos(time * cloud.speed + cloud.phase) * 3
            
            // Update opacity
            cloudGroup.children.forEach((part) => {
              if (part.material) {
                part.material.opacity = cloudVisibility * 0.8
              }
            })
          }
        }
        
        // Animate light rays
        if (cloudGroup.userData.type === 'lightRay') {
          cloudGroup.material.opacity = cloudVisibility * 0.3 * (0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.5)
        }
      })
    }
  })

  return (
    <AdvancedAnimations animationType="organic" intensity={1.5}>
      <group ref={cloudsRef}>
        {/* Enhanced Cloud Particle Effects */}
        <ParticleSystem 
          type="rain"
          count={150}
          area={120}
          height={50}
        />
        
        <ParticleSystem 
          type="dust"
          count={100}
          area={100}
          height={30}
        />
        
        {/* Main clouds */}
        {cloudData.map((cloud) => (
          <group
            key={`cloud-${cloud.id}`}
            position={cloud.position}
            userData={{ 
              type: 'cloud',
              animationType: 'floating',
              animationParams: {
                amplitude: 1.5,
                frequency: 0.2,
                drift: 0.05
              },
              sceneType: 'clouds'
            }}
          >
            {cloud.parts.map((part, partIndex) => (
              <mesh
                key={`part-${partIndex}`}
                position={part.position}
                scale={part.scale}
                material={cloudMaterial.clone()}
              >
                <sphereGeometry args={[1, 12, 12]} />
              </mesh>
            ))}
          </group>
        ))}
        
        {/* Volumetric light rays */}
        {lightRays.map((ray, index) => (
          <mesh
            key={`ray-${index}`}
            position={ray.position}
            rotation={[ray.rotation, 0, 0]}
            userData={{ type: 'lightRay' }}
          >
            <cylinderGeometry args={[0.5, 2, ray.length, 8]} />
            <meshBasicMaterial
              color="#FFF8DC"
              transparent
              opacity={0.2}
            />
          </mesh>
        ))}
        
        {/* Cloud particles for atmosphere */}
        {Array.from({ length: 30 }).map((_, index) => (
          <mesh
            key={`particle-${index}`}
            position={[
              (Math.random() - 0.5) * 200,
              Math.random() * 40 + 30,
              (Math.random() - 0.5) * 200
            ]}
            scale={Math.random() * 0.5 + 0.3}
          >
            <sphereGeometry args={[1, 6, 6]} />
            <meshBasicMaterial
              color="#F0F8FF"
              transparent
              opacity={0.1}
            />
          </mesh>
        ))}
        
        {/* God rays effect */}
        <group>
          {Array.from({ length: 5 }).map((_, index) => {
            const angle = (index / 5) * Math.PI * 2
            return (
              <mesh
                key={`godray-${index}`}
                position={[
                  Math.cos(angle) * 30,
                  50,
                  Math.sin(angle) * 30
                ]}
                rotation={[Math.PI / 4, angle, 0]}
              >
                <planeGeometry args={[3, 40]} />
                <meshBasicMaterial
                  color="#FFF8DC"
                  transparent
                  opacity={0.1}
                  side={THREE.DoubleSide}
                />
              </mesh>
            )
          })}
        </group>
      </group>
    </AdvancedAnimations>
  )
}

export default Clouds