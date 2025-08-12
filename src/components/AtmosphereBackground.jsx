import React, { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createAtmosphereMaterial, createFogMaterial } from '../shaders/AtmosphereShader'

const AtmosphereBackground = () => {
  const atmosphereRef = useRef()
  const fogRef = useRef()
  const scroll = useScroll()
  const { camera } = useThree()
  
  // Atmosphere sphere geometry (large sphere surrounding the scene)
  const atmosphereGeometry = useMemo(() => {
    return new THREE.SphereGeometry(1000, 32, 32)
  }, [])
  
  // Fog plane geometry
  const fogGeometry = useMemo(() => {
    return new THREE.PlaneGeometry(800, 800, 64, 64)
  }, [])
  
  // Atmosphere material
  const atmosphereMaterial = useMemo(() => {
    return createAtmosphereMaterial()
  }, [])
  
  // Fog material
  const fogMaterial = useMemo(() => {
    return createFogMaterial()
  }, [])
  
  useFrame((state) => {
    if (!scroll) return
    
    const offset = scroll.offset
    const progress = offset * 4 // 4 scenes
    
    // Update atmosphere shader uniforms
    if (atmosphereMaterial && atmosphereMaterial.uniforms) {
      atmosphereMaterial.uniforms.uTime.value = state.clock.elapsedTime
      atmosphereMaterial.uniforms.uCameraPosition.value.copy(camera.position)
      
      // Dynamic sun position based on scroll
      const sunHeight = 20 + progress * 30
      const sunX = 50 + Math.sin(progress * 0.5) * 20
      const sunZ = 50 + Math.cos(progress * 0.5) * 20
      atmosphereMaterial.uniforms.uSunPosition.value.set(sunX, sunHeight, sunZ)
      
      // Dynamic atmosphere colors based on scene
      if (progress < 1) {
        // Valley - warm morning colors
        atmosphereMaterial.uniforms.uHorizonColor.value.setHex(0xFFE4B5)
        atmosphereMaterial.uniforms.uZenithColor.value.setHex(0x87CEEB)
        atmosphereMaterial.uniforms.uAtmosphereColor.value.setHex(0xF0F8FF)
      } else if (progress < 2) {
        // Mountains - cooler colors
        atmosphereMaterial.uniforms.uHorizonColor.value.setHex(0xDDA0DD)
        atmosphereMaterial.uniforms.uZenithColor.value.setHex(0x4169E1)
        atmosphereMaterial.uniforms.uAtmosphereColor.value.setHex(0xE6E6FA)
      } else if (progress < 3) {
        // Clouds - bright daylight
        atmosphereMaterial.uniforms.uHorizonColor.value.setHex(0xFFFACD)
        atmosphereMaterial.uniforms.uZenithColor.value.setHex(0x00BFFF)
        atmosphereMaterial.uniforms.uAtmosphereColor.value.setHex(0xF5F5F5)
      } else {
        // Ocean - sunset colors
        atmosphereMaterial.uniforms.uHorizonColor.value.setHex(0xFF6347)
        atmosphereMaterial.uniforms.uZenithColor.value.setHex(0x191970)
        atmosphereMaterial.uniforms.uAtmosphereColor.value.setHex(0xFFE4E1)
      }
      
      // Dynamic fog parameters
      atmosphereMaterial.uniforms.uFogDensity.value = 0.5 + progress * 0.3
      atmosphereMaterial.uniforms.uScatteringStrength.value = 0.8 + progress * 0.4
      atmosphereMaterial.uniforms.uSunIntensity.value = 1.0 + progress * 0.5
    }
    
    // Update fog shader uniforms
    if (fogMaterial && fogMaterial.uniforms) {
      fogMaterial.uniforms.uTime.value = state.clock.elapsedTime
      fogMaterial.uniforms.uCameraPosition.value.copy(camera.position)
      fogMaterial.uniforms.uSunPosition.value.copy(
        atmosphereMaterial.uniforms.uSunPosition.value
      )
      
      // Fog visibility based on scene
      let fogOpacity = 0
      if (progress < 1) {
        // Valley fog
        fogOpacity = 0.3 * (1 - progress)
      } else if (progress >= 2 && progress < 3) {
        // Cloud layer fog
        fogOpacity = 0.2 * (progress - 2)
      }
      
      fogMaterial.uniforms.uFogOpacity.value = fogOpacity
      fogMaterial.uniforms.uFogDensity.value = 1.0 + progress * 0.5
      
      // Dynamic fog color
      if (progress < 1) {
        fogMaterial.uniforms.uFogColor.value.setHex(0xF5F5F5)
      } else if (progress < 2) {
        fogMaterial.uniforms.uFogColor.value.setHex(0xE0E0E0)
      } else if (progress < 3) {
        fogMaterial.uniforms.uFogColor.value.setHex(0xFFFFFF)
      } else {
        fogMaterial.uniforms.uFogColor.value.setHex(0xFFF8DC)
      }
    }
    
    // Position fog plane at ground level
    if (fogRef.current) {
      fogRef.current.position.y = -5
      fogRef.current.rotation.x = -Math.PI / 2
    }
  })
  
  return (
    <>
      {/* Atmosphere sphere */}
      <mesh ref={atmosphereRef} geometry={atmosphereGeometry} material={atmosphereMaterial} />
      
      {/* Ground fog */}
      <mesh ref={fogRef} geometry={fogGeometry} material={fogMaterial} />
    </>
  )
}

export default AtmosphereBackground