import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'

const Birds = () => {
  const birdsRef = useRef()
  const scroll = useScroll()
  
  // Create bird instances
  const birds = useMemo(() => {
    const birdArray = []
    for (let i = 0; i < 15; i++) {
      birdArray.push({
        id: i,
        position: [
          (Math.random() - 0.5) * 100,
          Math.random() * 20 + 10,
          (Math.random() - 0.5) * 100
        ],
        speed: Math.random() * 0.5 + 0.3,
        phase: Math.random() * Math.PI * 2,
        wingPhase: Math.random() * Math.PI * 2
      })
    }
    return birdArray
  }, [])
  
  const birdMaterial = useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: '#2F4F4F',
      transparent: true,
      opacity: 0.8
    })
  }, [])

  useFrame((state, delta) => {
    if (scroll && birdsRef.current) {
      const scrollOffset = scroll.offset
      
      // Birds become less visible as we go higher
      const birdOpacity = Math.max(0, 0.8 - scrollOffset * 1.2)
      birdMaterial.opacity = birdOpacity
      
      // Animate each bird
      birdsRef.current.children.forEach((birdGroup, index) => {
        const bird = birds[index]
        const time = state.clock.elapsedTime
        
        // Flying motion
        birdGroup.position.x = bird.position[0] + Math.sin(time * bird.speed + bird.phase) * 20
        birdGroup.position.y = bird.position[1] + Math.sin(time * bird.speed * 0.5 + bird.phase) * 3
        birdGroup.position.z = bird.position[2] + Math.cos(time * bird.speed + bird.phase) * 15
        
        // Wing flapping
        const wingFlap = Math.sin(time * 8 + bird.wingPhase) * 0.3
        if (birdGroup.children[1]) birdGroup.children[1].rotation.z = wingFlap
        if (birdGroup.children[2]) birdGroup.children[2].rotation.z = -wingFlap
        
        // Rotation to face movement direction
        birdGroup.rotation.y = Math.sin(time * bird.speed + bird.phase) * 0.5
      })
    }
  })

  return (
    <group ref={birdsRef}>
      {birds.map((bird) => (
        <group key={bird.id} position={bird.position}>
          {/* Bird body */}
          <mesh material={birdMaterial}>
            <sphereGeometry args={[0.3, 8, 8]} />
          </mesh>
          
          {/* Left wing */}
          <mesh position={[-0.4, 0, 0]} material={birdMaterial}>
            <planeGeometry args={[0.8, 0.3]} />
          </mesh>
          
          {/* Right wing */}
          <mesh position={[0.4, 0, 0]} material={birdMaterial}>
            <planeGeometry args={[0.8, 0.3]} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

export default Birds