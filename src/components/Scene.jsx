import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import { useSpring, a } from '@react-spring/three'
import * as THREE from 'three'

// Import scene components
import CameraController from './CameraController'
import AtmosphereBackground from './AtmosphereBackground'
import Valley from './scenes/Valley'
import Mountains from './scenes/Mountains'
import Clouds from './scenes/Clouds'
import Ocean from './scenes/Ocean'
import Sun from './elements/Sun'
import Birds from './elements/Birds'

const Scene = () => {
  const scroll = useScroll()
  const groupRef = useRef()

  // Lighting setup
  const ambientLightRef = useRef()
  const directionalLightRef = useRef()

  useFrame((state, delta) => {
    if (scroll) {
      const scrollOffset = scroll.offset
      
      // Update lighting based on scroll position
      if (ambientLightRef.current) {
        // Ambient light gets brighter as we go higher
        ambientLightRef.current.intensity = 0.3 + scrollOffset * 0.4
      }
      
      if (directionalLightRef.current) {
        // Sun position changes throughout the journey
        const sunAngle = scrollOffset * Math.PI * 0.5
        directionalLightRef.current.position.set(
          Math.sin(sunAngle) * 50,
          Math.cos(sunAngle) * 50 + 20,
          30
        )
        
        // Sun intensity varies
        directionalLightRef.current.intensity = 1 + scrollOffset * 0.5
      }
    }
  })

  return (
    <>
      {/* Camera controller */}
      <CameraController />
      
      {/* Atmosphere background */}
      <AtmosphereBackground />
      
      {/* Lighting */}
      <ambientLight ref={ambientLightRef} intensity={0.3} color="#E0F6FF" />
      <directionalLight
        ref={directionalLightRef}
        position={[30, 50, 30]}
        intensity={1.2}
        color="#FFF8DC"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      
      {/* Fog for atmospheric effect */}
      <fog attach="fog" args={['#E0F6FF', 50, 200]} />
      
      {/* Main scene group */}
      <group ref={groupRef}>
        {/* Scene 1: Valley */}
        <Valley />
        
        {/* Scene 2: Mountains */}
        <Mountains />
        
        {/* Scene 3: Clouds */}
        <Clouds />
        
        {/* Scene 4: Ocean */}
        <Ocean />
        
        {/* Persistent elements */}
        <Sun />
        <Birds />
      </group>
    </>
  )
}

export default Scene