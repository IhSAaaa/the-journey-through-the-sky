import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Advanced Procedural Vegetation System
const ProceduralVegetation = ({ 
  grassDensity = 200, 
  flowerDensity = 50, 
  bushDensity = 30,
  area = 100,
  elevationRange = [0, 20]
}) => {
  const vegetationRef = useRef()
  const scroll = useScroll()
  const noise3D = createNoise3D()
  
  // Generate vegetation instances dengan biome-based distribution
  const vegetationInstances = useMemo(() => {
    const instances = {
      grass: [],
      flowers: [],
      bushes: [],
      ferns: [],
      mushrooms: []
    }
    
    // Grass generation
    for (let i = 0; i < grassDensity; i++) {
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      // Elevation-based grass distribution
      const elevation = noise3D(x * 0.02, z * 0.02, 0) * 10
      const moisture = noise3D(x * 0.03, z * 0.03, 100) * 0.5 + 0.5
      
      if (elevation < 15 && moisture > 0.3) {
        const height = 0.5 + Math.random() * 1.5
        const grassType = moisture > 0.7 ? 'lush' : 'dry'
        
        instances.grass.push({
          id: i,
          position: [x, 0, z],
          height,
          type: grassType,
          swayPhase: Math.random() * Math.PI * 2,
          swayAmplitude: 0.1 + Math.random() * 0.2,
          density: moisture
        })
      }
    }
    
    // Flower generation
    for (let i = 0; i < flowerDensity; i++) {
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      const elevation = noise3D(x * 0.02, z * 0.02, 0) * 10
      const sunlight = noise3D(x * 0.04, z * 0.04, 200) * 0.5 + 0.5
      
      if (elevation < 12 && sunlight > 0.4) {
        const flowerTypes = ['daisy', 'poppy', 'wildflower', 'lavender']
        const type = flowerTypes[Math.floor(Math.random() * flowerTypes.length)]
        
        instances.flowers.push({
          id: i,
          position: [x, 0, z],
          type,
          height: 0.3 + Math.random() * 0.8,
          bloomPhase: Math.random() * Math.PI * 2,
          color: getFlowerColor(type),
          petalCount: type === 'daisy' ? 8 : type === 'poppy' ? 5 : 6
        })
      }
    }
    
    // Bush generation
    for (let i = 0; i < bushDensity; i++) {
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      const elevation = noise3D(x * 0.02, z * 0.02, 0) * 10
      const density = noise3D(x * 0.05, z * 0.05, 300) * 0.5 + 0.5
      
      if (elevation < 18 && density > 0.3) {
        const bushTypes = ['berry', 'shrub', 'hedge']
        const type = bushTypes[Math.floor(Math.random() * bushTypes.length)]
        
        instances.bushes.push({
          id: i,
          position: [x, 0, z],
          type,
          size: 1 + Math.random() * 2,
          leafDensity: density,
          hasBerriesOrFlowers: Math.random() > 0.6,
          seasonalColor: getSeasonalColor(elevation)
        })
      }
    }
    
    // Fern generation (shaded areas)
    for (let i = 0; i < 40; i++) {
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      const shade = noise3D(x * 0.06, z * 0.06, 400) * 0.5 + 0.5
      const moisture = noise3D(x * 0.03, z * 0.03, 100) * 0.5 + 0.5
      
      if (shade > 0.6 && moisture > 0.5) {
        instances.ferns.push({
          id: i,
          position: [x, 0, z],
          size: 0.8 + Math.random() * 1.2,
          frondCount: 4 + Math.floor(Math.random() * 4),
          unfurlPhase: Math.random() * Math.PI
        })
      }
    }
    
    // Mushroom generation (damp, shaded areas)
    for (let i = 0; i < 25; i++) {
      const x = (Math.random() - 0.5) * area
      const z = (Math.random() - 0.5) * area
      
      const moisture = noise3D(x * 0.03, z * 0.03, 100) * 0.5 + 0.5
      const shade = noise3D(x * 0.06, z * 0.06, 400) * 0.5 + 0.5
      
      if (moisture > 0.7 && shade > 0.7) {
        const mushroomTypes = ['toadstool', 'bracket', 'cluster']
        const type = mushroomTypes[Math.floor(Math.random() * mushroomTypes.length)]
        
        instances.mushrooms.push({
          id: i,
          position: [x, 0, z],
          type,
          size: 0.1 + Math.random() * 0.4,
          capColor: getMushroomColor(type),
          glowIntensity: type === 'toadstool' ? Math.random() * 0.3 : 0
        })
      }
    }
    
    return instances
  }, [grassDensity, flowerDensity, bushDensity, area, noise3D])
  
  // Helper functions untuk colors
  function getFlowerColor(type) {
    const colors = {
      daisy: '#FFFFFF',
      poppy: '#FF6B6B',
      wildflower: '#FFD93D',
      lavender: '#9B59B6'
    }
    return colors[type] || '#FFFFFF'
  }
  
  function getSeasonalColor(elevation) {
    if (elevation > 10) return '#8B4513' // Brown for higher elevations
    return '#228B22' // Green for lower elevations
  }
  
  function getMushroomColor(type) {
    const colors = {
      toadstool: '#FF4444',
      bracket: '#8B4513',
      cluster: '#DEB887'
    }
    return colors[type] || '#8B4513'
  }
  
  // Generate grass geometry
  const generateGrassGeometry = (instance) => {
    const geometry = new THREE.PlaneGeometry(0.1, instance.height, 1, 3)
    
    // Add some curve to grass blades
    const positions = geometry.attributes.position.array
    for (let i = 0; i < positions.length; i += 3) {
      const y = positions[i + 1]
      const curve = (y / instance.height) ** 2 * 0.1
      positions[i] += curve * (Math.random() - 0.5)
    }
    
    geometry.computeVertexNormals()
    return geometry
  }
  
  // Generate flower geometry
  const generateFlowerGeometry = (instance) => {
    const group = new THREE.Group()
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.01, 0.02, instance.height, 4)
    const stemMaterial = new THREE.MeshLambertMaterial({ color: '#228B22' })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = instance.height * 0.5
    group.add(stem)
    
    // Petals
    for (let i = 0; i < instance.petalCount; i++) {
      const angle = (i / instance.petalCount) * Math.PI * 2
      const petalGeometry = new THREE.PlaneGeometry(0.1, 0.3)
      const petalMaterial = new THREE.MeshLambertMaterial({ 
        color: instance.color,
        side: THREE.DoubleSide
      })
      const petal = new THREE.Mesh(petalGeometry, petalMaterial)
      
      petal.position.set(
        Math.cos(angle) * 0.08,
        instance.height,
        Math.sin(angle) * 0.08
      )
      petal.rotation.z = angle
      petal.rotation.x = Math.PI * 0.5
      
      group.add(petal)
    }
    
    // Center
    const centerGeometry = new THREE.SphereGeometry(0.03, 6, 4)
    const centerMaterial = new THREE.MeshLambertMaterial({ color: '#FFD700' })
    const center = new THREE.Mesh(centerGeometry, centerMaterial)
    center.position.y = instance.height
    group.add(center)
    
    return group
  }
  
  // Generate bush geometry
  const generateBushGeometry = (instance) => {
    const group = new THREE.Group()
    
    // Main bush body
    const bushGeometry = new THREE.SphereGeometry(instance.size, 8, 6)
    const bushMaterial = new THREE.MeshLambertMaterial({ 
      color: instance.seasonalColor,
      transparent: true,
      opacity: 0.8
    })
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.position.y = instance.size
    bush.scale.y = 0.7 // Flatten slightly
    group.add(bush)
    
    // Add berries or flowers if applicable
    if (instance.hasBerriesOrFlowers) {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2
        const height = Math.random() * Math.PI
        const radius = instance.size * 0.8
        
        const x = Math.cos(angle) * Math.sin(height) * radius
        const y = Math.cos(height) * radius + instance.size
        const z = Math.sin(angle) * Math.sin(height) * radius
        
        const berryGeometry = new THREE.SphereGeometry(0.02, 4, 3)
        const berryMaterial = new THREE.MeshLambertMaterial({ 
          color: instance.type === 'berry' ? '#8B0000' : '#FFB6C1'
        })
        const berry = new THREE.Mesh(berryGeometry, berryMaterial)
        berry.position.set(x, y, z)
        
        group.add(berry)
      }
    }
    
    return group
  }
  
  // Generate fern geometry
  const generateFernGeometry = (instance) => {
    const group = new THREE.Group()
    
    for (let i = 0; i < instance.frondCount; i++) {
      const angle = (i / instance.frondCount) * Math.PI * 2
      const frondGeometry = new THREE.PlaneGeometry(0.3, instance.size, 1, 8)
      
      // Add fern-like indentations
      const positions = frondGeometry.attributes.position.array
      for (let j = 0; j < positions.length; j += 3) {
        const y = positions[j + 1]
        const indent = Math.sin((y / instance.size + 1) * Math.PI * 4) * 0.05
        positions[j] += indent
      }
      
      const frondMaterial = new THREE.MeshLambertMaterial({ 
        color: '#006400',
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      })
      const frond = new THREE.Mesh(frondGeometry, frondMaterial)
      
      frond.position.set(
        Math.cos(angle) * 0.1,
        instance.size * 0.5,
        Math.sin(angle) * 0.1
      )
      frond.rotation.y = angle
      frond.rotation.x = -Math.PI * 0.3
      
      group.add(frond)
    }
    
    return group
  }
  
  // Generate mushroom geometry
  const generateMushroomGeometry = (instance) => {
    const group = new THREE.Group()
    
    // Stem
    const stemGeometry = new THREE.CylinderGeometry(0.02, 0.03, instance.size, 6)
    const stemMaterial = new THREE.MeshLambertMaterial({ color: '#F5F5DC' })
    const stem = new THREE.Mesh(stemGeometry, stemMaterial)
    stem.position.y = instance.size * 0.5
    group.add(stem)
    
    // Cap
    const capGeometry = new THREE.SphereGeometry(instance.size * 0.8, 8, 6)
    const capMaterial = new THREE.MeshLambertMaterial({ 
      color: instance.capColor,
      emissive: instance.glowIntensity > 0 ? instance.capColor : '#000000',
      emissiveIntensity: instance.glowIntensity
    })
    const cap = new THREE.Mesh(capGeometry, capMaterial)
    cap.position.y = instance.size
    cap.scale.y = 0.5
    group.add(cap)
    
    // Spots for toadstool
    if (instance.type === 'toadstool') {
      for (let i = 0; i < 5; i++) {
        const spotGeometry = new THREE.SphereGeometry(0.02, 4, 3)
        const spotMaterial = new THREE.MeshLambertMaterial({ color: '#FFFFFF' })
        const spot = new THREE.Mesh(spotGeometry, spotMaterial)
        
        const angle = Math.random() * Math.PI * 2
        const radius = Math.random() * instance.size * 0.6
        spot.position.set(
          Math.cos(angle) * radius,
          instance.size + 0.01,
          Math.sin(angle) * radius
        )
        
        group.add(spot)
      }
    }
    
    return group
  }
  
  useFrame((state) => {
    if (!vegetationRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const progress = scrollOffset * 4
    const time = state.clock.elapsedTime
    
    // Vegetation visibility berdasarkan scene (valley = scene 1)
    let vegetationVisibility = 0
    if (progress >= 0 && progress < 2) {
      if (progress < 1) {
        vegetationVisibility = progress // Fade in
      } else {
        vegetationVisibility = 1 - (progress - 1) * 0.3 // Fade out slowly
      }
    }
    
    // Wind animation
    const windStrength = 0.5 + Math.sin(time * 0.5) * 0.3
    const windDirection = Math.sin(time * 0.2) * 0.5
    
    vegetationRef.current.children.forEach((vegGroup, groupIndex) => {
      vegGroup.scale.setScalar(vegetationVisibility)
      
      vegGroup.children.forEach((item, itemIndex) => {
        // Wind sway animation untuk grass dan flowers
        if (groupIndex === 0 || groupIndex === 1) { // Grass or flowers
          const swayX = Math.sin(time * 2 + itemIndex * 0.1) * windStrength * 0.1
          const swayZ = Math.cos(time * 1.5 + itemIndex * 0.15) * windStrength * 0.05
          item.rotation.x = swayX + windDirection * 0.1
          item.rotation.z = swayZ
        }
        
        // Gentle movement untuk bushes dan ferns
        if (groupIndex === 2 || groupIndex === 3) { // Bushes or ferns
          const gentleSwayY = Math.sin(time * 0.8 + itemIndex * 0.2) * windStrength * 0.02
          item.rotation.y = gentleSwayY
        }
        
        // Mushroom glow animation
        if (groupIndex === 4) { // Mushrooms
          item.children.forEach((part) => {
            if (part.material && part.material.emissiveIntensity !== undefined) {
              const baseIntensity = part.material.emissiveIntensity || 0
              if (baseIntensity > 0) {
                part.material.emissiveIntensity = baseIntensity * (0.8 + Math.sin(time * 3 + itemIndex) * 0.2)
              }
            }
          })
        }
      })
    })
  })
  
  return (
    <group ref={vegetationRef}>
      {/* Grass */}
      <group>
        {vegetationInstances.grass.map((instance) => {
          const grassGeometry = generateGrassGeometry(instance)
          const grassMaterial = new THREE.MeshLambertMaterial({ 
            color: instance.type === 'lush' ? '#32CD32' : '#9ACD32',
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
          })
          
          return (
            <mesh
              key={`grass-${instance.id}`}
              geometry={grassGeometry}
              material={grassMaterial}
              position={instance.position}
              rotation={[0, Math.random() * Math.PI * 2, 0]}
            />
          )
        })}
      </group>
      
      {/* Flowers */}
      <group>
        {vegetationInstances.flowers.map((instance) => {
          const flowerGroup = generateFlowerGeometry(instance)
          
          return (
            <primitive
              key={`flower-${instance.id}`}
              object={flowerGroup}
              position={instance.position}
            />
          )
        })}
      </group>
      
      {/* Bushes */}
      <group>
        {vegetationInstances.bushes.map((instance) => {
          const bushGroup = generateBushGeometry(instance)
          
          return (
            <primitive
              key={`bush-${instance.id}`}
              object={bushGroup}
              position={instance.position}
            />
          )
        })}
      </group>
      
      {/* Ferns */}
      <group>
        {vegetationInstances.ferns.map((instance) => {
          const fernGroup = generateFernGeometry(instance)
          
          return (
            <primitive
              key={`fern-${instance.id}`}
              object={fernGroup}
              position={instance.position}
            />
          )
        })}
      </group>
      
      {/* Mushrooms */}
      <group>
        {vegetationInstances.mushrooms.map((instance) => {
          const mushroomGroup = generateMushroomGeometry(instance)
          
          return (
            <primitive
              key={`mushroom-${instance.id}`}
              object={mushroomGroup}
              position={instance.position}
            />
          )
        })}
      </group>
    </group>
  )
}

export default ProceduralVegetation