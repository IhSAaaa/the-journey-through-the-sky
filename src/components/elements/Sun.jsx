import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

const Sun = () => {
  const sunRef = useRef()
  const scroll = useScroll()
  const glowRef = useRef()
  
  // Create sun material with glow effect
  const sunMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#FFF8DC',
      transparent: true,
      opacity: 0.9
    })
  }, [])
  
  // Create glow material
  const glowMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#FFE4B5',
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide
    })
  }, [])

  useFrame((state, delta) => {
    if (scroll && sunRef.current) {
      const scrollOffset = scroll.offset
      
      // Sun position changes throughout the journey
      const sunAngle = scrollOffset * Math.PI * 0.5
      const radius = 80
      
      sunRef.current.position.set(
        Math.sin(sunAngle) * radius,
        Math.cos(sunAngle) * radius + 30,
        -50
      )
      
      // Sun gets brighter as we go higher
      const intensity = 0.8 + scrollOffset * 0.4
      sunMaterial.opacity = intensity
      
      // Glow effect pulsing
      if (glowRef.current) {
        glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.1)
        glowMaterial.opacity = 0.2 + Math.sin(state.clock.elapsedTime * 3) * 0.1
      }
    }
  })

  return (
    <group ref={sunRef}>
      {/* Main sun sphere */}
      <mesh material={sunMaterial}>
        <sphereGeometry args={[3, 32, 32]} />
      </mesh>
      
      {/* Glow effect */}
      <mesh ref={glowRef} material={glowMaterial}>
        <sphereGeometry args={[4, 32, 32]} />
      </mesh>
      
      {/* Sun rays */}
      {Array.from({ length: 8 }).map((_, i) => {
        const angle = (i / 8) * Math.PI * 2
        return (
          <mesh
            key={i}
            position={[
              Math.cos(angle) * 6,
              Math.sin(angle) * 6,
              0
            ]}
            rotation={[0, 0, angle]}
          >
            <planeGeometry args={[0.5, 2]} />
            <meshBasicMaterial
              color="#FFF8DC"
              transparent
              opacity={0.6}
            />
          </mesh>
        )
      })}
    </group>
  )
}

export default Sun