import React, { useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

const CameraController = () => {
  const { camera } = useThree()
  const scroll = useScroll()
  const targetPosition = useRef(new THREE.Vector3())
  const targetLookAt = useRef(new THREE.Vector3())

  useFrame((state, delta) => {
    if (scroll) {
      const scrollOffset = scroll.offset
      
      // Define camera positions and targets for each scene
      const scenes = [
        // Scene 1: Valley - Low altitude, looking over the valley
        {
          position: [0, 8, 15],
          lookAt: [0, 0, -10]
        },
        // Scene 2: Mountains - Higher altitude, looking at mountains
        {
          position: [10, 25, 20],
          lookAt: [0, 15, -20]
        },
        // Scene 3: Clouds - Very high, looking through clouds
        {
          position: [5, 45, 10],
          lookAt: [0, 40, -15]
        },
        // Scene 4: Ocean - High above ocean, looking at horizon
        {
          position: [0, 35, 25],
          lookAt: [0, 30, -30]
        }
      ]
      
      // Calculate which scene we're in and interpolation factor
      const sceneIndex = Math.floor(scrollOffset * (scenes.length - 1))
      const nextSceneIndex = Math.min(sceneIndex + 1, scenes.length - 1)
      const t = (scrollOffset * (scenes.length - 1)) % 1
      
      // Get current and next scene data
      const currentScene = scenes[sceneIndex]
      const nextScene = scenes[nextSceneIndex]
      
      // Interpolate camera position
      targetPosition.current.set(
        THREE.MathUtils.lerp(currentScene.position[0], nextScene.position[0], t),
        THREE.MathUtils.lerp(currentScene.position[1], nextScene.position[1], t),
        THREE.MathUtils.lerp(currentScene.position[2], nextScene.position[2], t)
      )
      
      // Interpolate look-at target
      targetLookAt.current.set(
        THREE.MathUtils.lerp(currentScene.lookAt[0], nextScene.lookAt[0], t),
        THREE.MathUtils.lerp(currentScene.lookAt[1], nextScene.lookAt[1], t),
        THREE.MathUtils.lerp(currentScene.lookAt[2], nextScene.lookAt[2], t)
      )
      
      // Smooth camera movement
      camera.position.lerp(targetPosition.current, delta * 2)
      camera.lookAt(targetLookAt.current)
      
      // Add subtle camera shake for flying effect
      const shakeIntensity = 0.1
      camera.position.x += Math.sin(state.clock.elapsedTime * 2) * shakeIntensity
      camera.position.y += Math.cos(state.clock.elapsedTime * 1.5) * shakeIntensity * 0.5
    }
  })

  return null
}

export default CameraController