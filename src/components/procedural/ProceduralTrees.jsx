import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Procedural Tree Generation System
const ProceduralTrees = ({ count = 50, area = 100, terrainFunction }) => {
  const treesRef = useRef()
  const scroll = useScroll()
  const noise3D = createNoise3D()
  
  // Generate tree instances dengan procedural placement
  const treeInstances = useMemo(() => {
    const instances = []
    
    for (let i = 0; i < count; i++) {
      // Random position dalam area
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      // Get terrain height jika terrainFunction tersedia
      const y = terrainFunction ? terrainFunction(x, z) : 0
      
      // Tree parameters berdasarkan noise
      const noiseValue = noise3D(x * 0.01, z * 0.01, 0)
      const treeType = noiseValue > 0.3 ? 'pine' : noiseValue > -0.3 ? 'oak' : 'birch'
      
      // Size variation berdasarkan position dan noise
      const distanceFromCenter = Math.sqrt(x * x + z * z)
      const sizeFactor = Math.max(0.3, 1 - distanceFromCenter / (area * 0.6))
      const noiseSizeFactor = 0.7 + noise3D(x * 0.05, z * 0.05, 100) * 0.6
      
      const baseHeight = treeType === 'pine' ? 8 : treeType === 'oak' ? 6 : 4
      const height = baseHeight * sizeFactor * noiseSizeFactor
      const trunkRadius = height * 0.05
      const crownRadius = height * (treeType === 'pine' ? 0.15 : 0.25)
      
      instances.push({
        id: i,
        position: [x, y, z],
        type: treeType,
        height,
        trunkRadius,
        crownRadius,
        rotation: Math.random() * Math.PI * 2,
        swayPhase: Math.random() * Math.PI * 2,
        swayAmplitude: 0.02 + Math.random() * 0.03
      })
    }
    
    return instances
  }, [count, area, terrainFunction, noise3D])
  
  // Generate tree geometries
  const treeGeometries = useMemo(() => {
    const geometries = {
      pine: {
        trunk: new THREE.CylinderGeometry(0.1, 0.15, 1, 8),
        crown: new THREE.ConeGeometry(1, 1, 8)
      },
      oak: {
        trunk: new THREE.CylinderGeometry(0.12, 0.18, 1, 8),
        crown: new THREE.SphereGeometry(1, 8, 6)
      },
      birch: {
        trunk: new THREE.CylinderGeometry(0.08, 0.12, 1, 8),
        crown: new THREE.SphereGeometry(1, 8, 6)
      }
    }
    
    return geometries
  }, [])
  
  // Tree materials
  const treeMaterials = useMemo(() => {
    return {
      trunk: {
        pine: new THREE.MeshLambertMaterial({ color: '#4A4A4A' }),
        oak: new THREE.MeshLambertMaterial({ color: '#8B4513' }),
        birch: new THREE.MeshLambertMaterial({ color: '#F5F5DC' })
      },
      crown: {
        pine: new THREE.MeshLambertMaterial({ color: '#0F4F0F' }),
        oak: new THREE.MeshLambertMaterial({ color: '#228B22' }),
        birch: new THREE.MeshLambertMaterial({ color: '#90EE90' })
      }
    }
  }, [])
  
  // Generate detailed tree geometry untuk setiap type
  const generateTreeCrown = (type, radius, height) => {
    const geometry = new THREE.BufferGeometry()
    const vertices = []
    const indices = []
    
    if (type === 'pine') {
      // Pine tree - multiple cone layers
      const layers = 4
      for (let layer = 0; layer < layers; layer++) {
        const layerHeight = height * (1 - layer / layers)
        const layerRadius = radius * (1 - layer / (layers + 1))
        const segments = 8
        
        // Center vertex untuk layer
        const centerIndex = vertices.length / 3
        vertices.push(0, layerHeight, 0)
        
        // Ring vertices
        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * Math.PI * 2
          const x = Math.cos(angle) * layerRadius
          const z = Math.sin(angle) * layerRadius
          const y = layerHeight - height * 0.3
          
          vertices.push(x, y, z)
          
          // Create triangles
          if (i < segments) {
            const ringStart = centerIndex + 1
            indices.push(
              centerIndex,
              ringStart + i,
              ringStart + i + 1
            )
          }
        }
      }
    } else {
      // Oak/Birch - sphere dengan irregularities
      const segments = 12
      const rings = 8
      
      for (let ring = 0; ring <= rings; ring++) {
        const phi = (ring / rings) * Math.PI
        const y = Math.cos(phi) * radius
        const ringRadius = Math.sin(phi) * radius
        
        for (let segment = 0; segment <= segments; segment++) {
          const theta = (segment / segments) * Math.PI * 2
          
          // Add noise untuk irregular shape
          const noiseValue = noise3D(
            Math.cos(theta) * 0.5,
            y * 0.1,
            Math.sin(theta) * 0.5
          )
          const irregularity = 1 + noiseValue * 0.3
          
          const x = Math.cos(theta) * ringRadius * irregularity
          const z = Math.sin(theta) * ringRadius * irregularity
          
          vertices.push(x, y, z)
          
          // Create triangles
          if (ring < rings && segment < segments) {
            const current = ring * (segments + 1) + segment
            const next = current + segments + 1
            
            indices.push(
              current, next, current + 1,
              current + 1, next, next + 1
            )
          }
        }
      }
    }
    
    geometry.setIndex(indices)
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
    geometry.computeVertexNormals()
    
    return geometry
  }
  
  useFrame((state) => {
    if (!treesRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const time = state.clock.elapsedTime
    
    // Tree visibility berdasarkan scroll (valley scene)
    const treeVisibility = Math.max(0, 1 - scrollOffset * 2)
    
    treesRef.current.children.forEach((treeGroup, index) => {
      const instance = treeInstances[index]
      if (!instance) return
      
      // Wind sway animation
      const swayX = Math.sin(time * 0.5 + instance.swayPhase) * instance.swayAmplitude
      const swayZ = Math.cos(time * 0.3 + instance.swayPhase) * instance.swayAmplitude * 0.5
      
      treeGroup.rotation.x = swayX
      treeGroup.rotation.z = swayZ
      
      // Scale berdasarkan visibility
      const scale = treeVisibility
      treeGroup.scale.setScalar(scale)
      
      // Fade out effect
      treeGroup.children.forEach(part => {
        if (part.material) {
          part.material.opacity = treeVisibility
          part.material.transparent = true
        }
      })
    })
  })
  
  return (
    <group ref={treesRef}>
      {treeInstances.map((instance) => {
        const trunkGeometry = treeGeometries[instance.type].trunk.clone()
        const crownGeometry = generateTreeCrown(
          instance.type,
          instance.crownRadius,
          instance.height * 0.7
        )
        
        return (
          <group
            key={instance.id}
            position={instance.position}
            rotation={[0, instance.rotation, 0]}
          >
            {/* Tree trunk */}
            <mesh
              geometry={trunkGeometry}
              material={treeMaterials.trunk[instance.type]}
              scale={[instance.trunkRadius, instance.height, instance.trunkRadius]}
              position={[0, instance.height * 0.5, 0]}
            />
            
            {/* Tree crown */}
            <mesh
              geometry={crownGeometry}
              material={treeMaterials.crown[instance.type]}
              position={[0, instance.height * 0.8, 0]}
            />
            
            {/* Additional details untuk oak trees */}
            {instance.type === 'oak' && (
              <>
                {/* Branches */}
                {Array.from({ length: 3 }, (_, i) => {
                  const branchAngle = (i / 3) * Math.PI * 2 + instance.rotation
                  const branchLength = instance.height * 0.3
                  const branchX = Math.cos(branchAngle) * branchLength
                  const branchZ = Math.sin(branchAngle) * branchLength
                  
                  return (
                    <mesh
                      key={`branch-${i}`}
                      geometry={new THREE.CylinderGeometry(0.02, 0.04, branchLength, 4)}
                      material={treeMaterials.trunk[instance.type]}
                      position={[branchX * 0.5, instance.height * 0.7, branchZ * 0.5]}
                      rotation={[0, branchAngle, Math.PI * 0.1]}
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

export default ProceduralTrees