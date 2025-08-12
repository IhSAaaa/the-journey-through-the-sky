import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise2D } from 'simplex-noise'
import ProceduralRocks from '../procedural/ProceduralRocks'
import ParticleSystem from '../particles/ParticleSystem'
import AdvancedAnimations from '../animation/AdvancedAnimations'

const Mountains = () => {
  const mountainsRef = useRef()
  const scroll = useScroll()
  
  // Create mountain layers for parallax effect
  const mountainLayers = useMemo(() => {
    const layers = []
    
    // Create 3 layers of mountains
    for (let layer = 0; layer < 3; layer++) {
      const mountains = []
      const numMountains = 8 - layer * 2
      
      for (let i = 0; i < numMountains; i++) {
        const angle = (i / numMountains) * Math.PI * 2
        const radius = 60 + layer * 30
        
        mountains.push({
          position: [
            Math.cos(angle) * radius,
            Math.random() * 10 + 15 + layer * 5,
            Math.sin(angle) * radius
          ],
          height: Math.random() * 20 + 25 - layer * 5,
          width: Math.random() * 8 + 10,
          depth: Math.random() * 8 + 10,
          snowLevel: Math.random() * 0.3 + 0.6
        })
      }
      
      layers.push({
        mountains,
        distance: layer,
        opacity: 1 - layer * 0.2
      })
    }
    
    return layers
  }, [])
  
  // Mountain materials
  const mountainMaterial = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: '#708090',
      transparent: true
    })
  }, [])
  
  const snowMaterial = useMemo(() => {
    return new THREE.MeshLambertMaterial({
      color: '#FFFAFA',
      transparent: true
    })
  }, [])

  useFrame((state, delta) => {
    if (scroll && mountainsRef.current) {
      const scrollOffset = scroll.offset
      
      // Mountains are most visible in scene 2 (scroll 0.25 - 0.5)
      const mountainVisibility = scrollOffset < 0.25 ? 0 :
                                scrollOffset < 0.5 ? (scrollOffset - 0.25) * 4 :
                                scrollOffset < 0.75 ? 1 - (scrollOffset - 0.5) * 4 : 0
      
      // Update each layer with parallax effect
      mountainsRef.current.children.forEach((layerGroup, layerIndex) => {
        const layer = mountainLayers[layerIndex]
        if (!layer) return // Skip if layer is undefined
        
        // Parallax movement - closer layers move faster
        const parallaxSpeed = 1 + layerIndex * 0.5
        layerGroup.position.z = scrollOffset * parallaxSpeed * 20
        
        // Opacity based on visibility and layer distance
        layerGroup.children.forEach((mountainGroup) => {
          mountainGroup.children.forEach((mesh) => {
            if (mesh.material && mesh.material === mountainMaterial) {
              mesh.material.opacity = mountainVisibility * layer.opacity
            } else if (mesh.material && mesh.material === snowMaterial) {
              mesh.material.opacity = mountainVisibility * layer.opacity * 0.9
            }
          })
        })
      })
    }
  })

  return (
    <AdvancedAnimations animationType="physics" intensity={0.8}>
      <group ref={mountainsRef}>
        {/* Procedural Rock Formations */}
        <ProceduralRocks 
          count={40}
          area={120}
          heightRange={[8, 30]}
        />
        
        {/* Mountain Particle Effects */}
        <ParticleSystem 
          type="snow"
          count={200}
          area={100}
          height={40}
        />
        
        <ParticleSystem 
          type="dust"
          count={80}
          area={80}
          height={25}
        />
        
        {/* Original Mountains */}
        {mountainLayers.map((layer, layerIndex) => (
          <group key={`layer-${layerIndex}`}>
            {layer.mountains.map((mountain, mountainIndex) => (
              <group
                key={`mountain-${layerIndex}-${mountainIndex}`}
                position={mountain.position}
              >
                {/* Mountain base */}
                <mesh
                  material={mountainMaterial}
                  castShadow
                  receiveShadow
                >
                  <coneGeometry args={[
                    mountain.width,
                    mountain.height,
                    8
                  ]} />
                </mesh>
                
                {/* Snow cap */}
                <mesh
                  position={[0, mountain.height * mountain.snowLevel, 0]}
                  material={snowMaterial}
                  castShadow
                >
                  <coneGeometry args={[
                    mountain.width * (1 - mountain.snowLevel),
                    mountain.height * (1 - mountain.snowLevel),
                    8
                  ]} />
                </mesh>
                
                {/* Rocky details */}
                {Array.from({ length: 3 }).map((_, rockIndex) => {
                  const rockAngle = (rockIndex / 3) * Math.PI * 2
                  const rockRadius = mountain.width * 0.7
                  return (
                    <mesh
                      key={`rock-${rockIndex}`}
                      position={[
                        Math.cos(rockAngle) * rockRadius,
                        mountain.height * 0.3,
                        Math.sin(rockAngle) * rockRadius
                      ]}
                      rotation={[
                        Math.random() * Math.PI,
                        Math.random() * Math.PI,
                        Math.random() * Math.PI
                      ]}
                      scale={0.5 + Math.random() * 0.3}
                    >
                      <boxGeometry args={[1, 1, 1]} />
                      <meshLambertMaterial color="#2F4F4F" transparent />
                    </mesh>
                  )
                })}
              </group>
            ))}
          </group>
        ))}
        
        {/* Mountain mist/fog */}
        {Array.from({ length: 10 }).map((_, index) => (
          <mesh
            key={`mist-${index}`}
            position={[
              (Math.random() - 0.5) * 200,
              Math.random() * 20 + 20,
              (Math.random() - 0.5) * 200
            ]}
            scale={[5 + Math.random() * 5, 2, 5 + Math.random() * 5]}
          >
            <sphereGeometry args={[1, 8, 8]} />
            <meshBasicMaterial
              color="#F0F8FF"
              transparent
              opacity={0.1}
            />
          </mesh>
        ))}
      </group>
    </AdvancedAnimations>
  )
}

export default Mountains