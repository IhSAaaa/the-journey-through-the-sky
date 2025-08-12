import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

// Advanced Particle System untuk weather effects dan atmospheric particles
const ParticleSystem = ({ type = 'dust', count = 1000, area = 100 }) => {
  const particlesRef = useRef()
  const scroll = useScroll()
  
  // Particle geometry dan attributes
  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const lifetimes = new Float32Array(count)
    const phases = new Float32Array(count)
    
    // Initialize particles berdasarkan type
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Position
      positions[i3] = (Math.random() - 0.5) * area
      positions[i3 + 1] = Math.random() * area * 0.5
      positions[i3 + 2] = (Math.random() - 0.5) * area
      
      // Velocity berdasarkan particle type
      switch (type) {
        case 'rain':
          velocities[i3] = (Math.random() - 0.5) * 2
          velocities[i3 + 1] = -10 - Math.random() * 5
          velocities[i3 + 2] = (Math.random() - 0.5) * 2
          sizes[i] = 0.1 + Math.random() * 0.1
          break
          
        case 'snow':
          velocities[i3] = (Math.random() - 0.5) * 1
          velocities[i3 + 1] = -2 - Math.random() * 2
          velocities[i3 + 2] = (Math.random() - 0.5) * 1
          sizes[i] = 0.2 + Math.random() * 0.3
          break
          
        case 'dust':
          velocities[i3] = (Math.random() - 0.5) * 0.5
          velocities[i3 + 1] = Math.random() * 0.2
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.5
          sizes[i] = 0.05 + Math.random() * 0.1
          break
          
        case 'leaves':
          velocities[i3] = (Math.random() - 0.5) * 3
          velocities[i3 + 1] = -1 - Math.random() * 2
          velocities[i3 + 2] = (Math.random() - 0.5) * 3
          sizes[i] = 0.3 + Math.random() * 0.4
          break
          
        default:
          velocities[i3] = (Math.random() - 0.5) * 0.1
          velocities[i3 + 1] = Math.random() * 0.1
          velocities[i3 + 2] = (Math.random() - 0.5) * 0.1
          sizes[i] = 0.1 + Math.random() * 0.1
      }
      
      lifetimes[i] = Math.random() * 10
      phases[i] = Math.random() * Math.PI * 2
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('lifetime', new THREE.BufferAttribute(lifetimes, 1))
    geo.setAttribute('phase', new THREE.BufferAttribute(phases, 1))
    
    // Material berdasarkan particle type
    let mat
    switch (type) {
      case 'rain':
        mat = new THREE.PointsMaterial({
          color: '#87CEEB',
          size: 0.1,
          transparent: true,
          opacity: 0.6,
          blending: THREE.AdditiveBlending
        })
        break
        
      case 'snow':
        mat = new THREE.PointsMaterial({
          color: '#FFFFFF',
          size: 0.3,
          transparent: true,
          opacity: 0.8,
          blending: THREE.NormalBlending
        })
        break
        
      case 'dust':
        mat = new THREE.PointsMaterial({
          color: '#DEB887',
          size: 0.05,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending
        })
        break
        
      case 'leaves':
        mat = new THREE.PointsMaterial({
          color: '#8B4513',
          size: 0.4,
          transparent: true,
          opacity: 0.7,
          blending: THREE.NormalBlending
        })
        break
        
      default:
        mat = new THREE.PointsMaterial({
          color: '#FFFFFF',
          size: 0.1,
          transparent: true,
          opacity: 0.5
        })
    }
    
    return { geometry: geo, material: mat }
  }, [type, count, area])
  
  useFrame((state, delta) => {
    if (!particlesRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const positions = particlesRef.current.geometry.attributes.position.array
    const velocities = particlesRef.current.geometry.attributes.velocity.array
    const lifetimes = particlesRef.current.geometry.attributes.lifetime.array
    const phases = particlesRef.current.geometry.attributes.phase.array
    const sizes = particlesRef.current.geometry.attributes.size.array
    
    // Update particles
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      
      // Update lifetime
      lifetimes[i] -= delta
      
      // Reset particle jika lifetime habis
      if (lifetimes[i] <= 0) {
        positions[i3] = (Math.random() - 0.5) * area
        positions[i3 + 1] = area * 0.5
        positions[i3 + 2] = (Math.random() - 0.5) * area
        lifetimes[i] = 5 + Math.random() * 10
      }
      
      // Update position berdasarkan velocity
      positions[i3] += velocities[i3] * delta
      positions[i3 + 1] += velocities[i3 + 1] * delta
      positions[i3 + 2] += velocities[i3 + 2] * delta
      
      // Wind effect untuk dust dan leaves
      if (type === 'dust' || type === 'leaves') {
        const windStrength = 0.5 + scrollOffset * 0.3
        const windPhase = phases[i] + state.clock.elapsedTime
        positions[i3] += Math.sin(windPhase) * windStrength * delta
        positions[i3 + 2] += Math.cos(windPhase * 0.7) * windStrength * delta
      }
      
      // Swirl effect untuk snow
      if (type === 'snow') {
        const swirlPhase = phases[i] + state.clock.elapsedTime * 0.5
        positions[i3] += Math.sin(swirlPhase) * 0.5 * delta
        positions[i3 + 2] += Math.cos(swirlPhase) * 0.5 * delta
      }
      
      // Boundary check
      if (positions[i3 + 1] < -area * 0.25) {
        positions[i3 + 1] = area * 0.5
      }
      
      // Size variation berdasarkan distance
      const distance = Math.sqrt(
        positions[i3] * positions[i3] + 
        positions[i3 + 2] * positions[i3 + 2]
      )
      const sizeFactor = Math.max(0.3, 1 - distance / (area * 0.5))
      
      // Update size attribute jika material mendukung
      if (particlesRef.current.material.size !== undefined) {
        const baseSize = sizes[i]
        particlesRef.current.material.size = baseSize * sizeFactor
      }
    }
    
    // Mark attributes untuk update
    particlesRef.current.geometry.attributes.position.needsUpdate = true
    particlesRef.current.geometry.attributes.lifetime.needsUpdate = true
    
    // Particle visibility berdasarkan scene
    let visibility = 0
    const progress = scrollOffset * 4
    
    switch (type) {
      case 'dust':
        // Dust di valley dan mountains
        visibility = progress < 2 ? 1 - progress * 0.3 : 0
        break
        
      case 'rain':
        // Rain di mountains
        visibility = progress >= 1 && progress < 2 ? (progress - 1) * 2 : 0
        break
        
      case 'snow':
        // Snow di mountains dan clouds
        visibility = progress >= 1.5 && progress < 3 ? 1 : 0
        break
        
      case 'leaves':
        // Leaves di valley
        visibility = progress < 1 ? 1 - progress * 0.5 : 0
        break
        
      default:
        visibility = 1
    }
    
    particlesRef.current.material.opacity = visibility * (material.opacity || 0.5)
  })
  
  return (
    <points ref={particlesRef} geometry={geometry} material={material} />
  )
}

export default ParticleSystem