import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Procedural Rock Formation System
const ProceduralRocks = ({ count = 30, area = 150, heightRange = [5, 25] }) => {
  const rocksRef = useRef()
  const scroll = useScroll()
  const noise3D = createNoise3D()
  
  // Generate rock instances dengan procedural placement
  const rockInstances = useMemo(() => {
    const instances = []
    
    for (let i = 0; i < count; i++) {
      // Random position dalam area
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      // Height berdasarkan noise dan distance dari center
      const distanceFromCenter = Math.sqrt(x * x + z * z)
      const heightNoise = noise3D(x * 0.02, z * 0.02, 0)
      const baseHeight = heightRange[0] + (heightRange[1] - heightRange[0]) * Math.random()
      const height = baseHeight * (1 + heightNoise * 0.5) * Math.max(0.3, 1 - distanceFromCenter / (area * 0.7))
      
      // Rock type berdasarkan height dan noise
      const typeNoise = noise3D(x * 0.05, z * 0.05, 100)
      let rockType = 'boulder'
      if (height > 15) rockType = 'cliff'
      else if (height < 8) rockType = 'stone'
      else if (typeNoise > 0.3) rockType = 'spire'
      
      // Size dan shape parameters
      const width = height * (0.6 + Math.random() * 0.8)
      const depth = height * (0.5 + Math.random() * 0.7)
      const irregularity = 0.3 + Math.random() * 0.4
      
      instances.push({
        id: i,
        position: [x, height * 0.5, z],
        type: rockType,
        height,
        width,
        depth,
        irregularity,
        rotation: [Math.random() * 0.3, Math.random() * Math.PI * 2, Math.random() * 0.2],
        weathering: Math.random(),
        snowCoverage: Math.max(0, (height - 10) / 15)
      })
    }
    
    return instances
  }, [count, area, heightRange, noise3D])
  
  // Generate procedural rock geometry
  const generateRockGeometry = (instance) => {
    const { type, height, width, depth, irregularity } = instance
    
    let baseGeometry
    
    switch (type) {
      case 'cliff':
        // Tall, vertical rock formation
        baseGeometry = new THREE.BoxGeometry(width, height, depth, 4, 8, 4)
        break
        
      case 'spire':
        // Pointed rock formation
        baseGeometry = new THREE.ConeGeometry(width * 0.5, height, 8, 4)
        break
        
      case 'boulder':
        // Rounded rock
        baseGeometry = new THREE.SphereGeometry(width * 0.5, 8, 6)
        break
        
      case 'stone':
        // Small irregular rock
        baseGeometry = new THREE.DodecahedronGeometry(width * 0.4, 1)
        break
        
      default:
        baseGeometry = new THREE.BoxGeometry(width, height, depth, 3, 3, 3)
    }
    
    // Apply noise displacement untuk irregular shape
    const positions = baseGeometry.attributes.position.array
    
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const y = positions[i + 1]
      const z = positions[i + 2]
      
      // Multiple noise layers untuk detail
      const noise1 = noise3D(x * 0.1, y * 0.1, z * 0.1) * irregularity
      const noise2 = noise3D(x * 0.3, y * 0.3, z * 0.3) * irregularity * 0.3
      const noise3 = noise3D(x * 0.8, y * 0.8, z * 0.8) * irregularity * 0.1
      
      const totalNoise = noise1 + noise2 + noise3
      
      // Apply displacement
      const length = Math.sqrt(x * x + y * y + z * z)
      if (length > 0) {
        const factor = 1 + totalNoise
        positions[i] = x * factor
        positions[i + 1] = y * factor
        positions[i + 2] = z * factor
      }
    }
    
    baseGeometry.computeVertexNormals()
    return baseGeometry
  }
  
  // Rock materials dengan weathering effects
  const rockMaterials = useMemo(() => {
    const baseMaterial = new THREE.MeshLambertMaterial({
      color: '#696969'
    })
    
    const weatheredMaterial = new THREE.MeshLambertMaterial({
      color: '#A0A0A0'
    })
    
    const snowMaterial = new THREE.MeshLambertMaterial({
      color: '#FFFFFF'
    })
    
    return { baseMaterial, weatheredMaterial, snowMaterial }
  }, [])
  
  // Generate debris around large rocks
  const generateDebris = (instance) => {
    if (instance.height < 10) return []
    
    const debris = []
    const debrisCount = Math.floor(instance.height * 0.3)
    
    for (let i = 0; i < debrisCount; i++) {
      const angle = Math.random() * Math.PI * 2
      const distance = instance.width * (0.8 + Math.random() * 1.2)
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      const size = 0.5 + Math.random() * 1.5
      
      debris.push({
        position: [x, size * 0.5, z],
        size,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      })
    }
    
    return debris
  }
  
  useFrame((state) => {
    if (!rocksRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const progress = scrollOffset * 4
    
    // Rock visibility berdasarkan scene (mountains = scene 2)
    let rockVisibility = 0
    if (progress >= 1 && progress < 3) {
      if (progress < 2) {
        rockVisibility = (progress - 1) * 2 // Fade in
      } else {
        rockVisibility = 1 - (progress - 2) * 0.5 // Fade out slowly
      }
    }
    
    rocksRef.current.children.forEach((rockGroup, index) => {
      const instance = rockInstances[index]
      if (!instance) return
      
      // Scale berdasarkan visibility
      rockGroup.scale.setScalar(rockVisibility)
      
      // Snow coverage animation berdasarkan scroll
      const snowIntensity = Math.max(0, (progress - 1.5) * 0.5) * instance.snowCoverage
      
      rockGroup.children.forEach((mesh, meshIndex) => {
        if (mesh.material) {
          // Blend between rock dan snow material
          if (snowIntensity > 0.3 && meshIndex === 0) { // Main rock
            mesh.material = rockMaterials.snowMaterial
          } else if (instance.weathering > 0.7) {
            mesh.material = rockMaterials.weatheredMaterial
          } else {
            mesh.material = rockMaterials.baseMaterial
          }
          
          mesh.material.opacity = rockVisibility
          mesh.material.transparent = rockVisibility < 1
        }
      })
    })
  })
  
  return (
    <group ref={rocksRef}>
      {rockInstances.map((instance) => {
        const rockGeometry = generateRockGeometry(instance)
        const debris = generateDebris(instance)
        
        return (
          <group
            key={instance.id}
            position={instance.position}
            rotation={instance.rotation}
          >
            {/* Main rock */}
            <mesh
              geometry={rockGeometry}
              material={rockMaterials.baseMaterial}
            />
            
            {/* Rock debris */}
            {debris.map((debrisItem, debrisIndex) => (
              <mesh
                key={`debris-${debrisIndex}`}
                geometry={new THREE.DodecahedronGeometry(debrisItem.size, 0)}
                material={rockMaterials.baseMaterial}
                position={debrisItem.position}
                rotation={debrisItem.rotation}
              />
            ))}
            
            {/* Moss/vegetation pada weathered rocks */}
            {instance.weathering > 0.5 && instance.height > 8 && (
              <mesh
                geometry={new THREE.SphereGeometry(instance.width * 0.3, 6, 4)}
                material={new THREE.MeshLambertMaterial({ 
                  color: '#2F4F2F',
                  transparent: true,
                  opacity: 0.6
                })}
                position={[0, instance.height * 0.3, 0]}
              />
            )}
            
            {/* Ice formations untuk high altitude rocks */}
            {instance.snowCoverage > 0.7 && (
              <>
                {Array.from({ length: 3 }, (_, i) => {
                  const iceAngle = (i / 3) * Math.PI * 2
                  const iceX = Math.cos(iceAngle) * instance.width * 0.4
                  const iceZ = Math.sin(iceAngle) * instance.width * 0.4
                  
                  return (
                    <mesh
                      key={`ice-${i}`}
                      geometry={new THREE.ConeGeometry(0.2, 1 + Math.random(), 4)}
                      material={new THREE.MeshLambertMaterial({ 
                        color: '#E0FFFF',
                        transparent: true,
                        opacity: 0.8
                      })}
                      position={[iceX, instance.height * 0.8, iceZ]}
                      rotation={[Math.random() * 0.3, iceAngle, Math.random() * 0.3]}
                    />
                  )
                })}
              </>
            )}
          </group>
        )
      })}
    </group>
  )
}

export default ProceduralRocks