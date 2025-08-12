import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise2D, createNoise3D } from 'simplex-noise'
import { createTerrainMaterial } from '../../shaders/TerrainShader'
import ParticleSystem from '../particles/ParticleSystem'
import ProceduralTrees from '../procedural/ProceduralTrees'
import ProceduralVegetation from '../procedural/ProceduralVegetation'
import AdvancedGeometry from '../geometry/AdvancedGeometry'
import AdvancedAnimations from '../animation/AdvancedAnimations'

const Valley = () => {
  const valleyRef = useRef()
  const scroll = useScroll()
  
  // Create valley terrain with enhanced geometry
  const valleyGeometry = useMemo(() => {
    const geometry = new THREE.PlaneGeometry(200, 200, 128, 128)
    const positions = geometry.attributes.position.array
    const noise3D = createNoise3D()

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      
      // Create valley shape with multiple noise layers
      const valleyShape = Math.exp(-((x * x) + (z * z)) / 8000)
      const baseNoise = noise3D(x * 0.01, z * 0.01, 0) * 5
      const detailNoise = noise3D(x * 0.05, z * 0.05, 100) * 2
      const microNoise = noise3D(x * 0.1, z * 0.1, 200) * 0.5
      
      positions[i + 1] = valleyShape * 12 + baseNoise + detailNoise + microNoise
    }

    geometry.computeVertexNormals()
    return geometry
  }, [])
  
  // Enhanced valley material with terrain shader
  const valleyMaterial = useMemo(() => {
    return createTerrainMaterial({
      grassColor: new THREE.Color('#4a7c59'),
      dirtColor: new THREE.Color('#8b4513'),
      rockColor: new THREE.Color('#696969'),
      snowColor: new THREE.Color('#ffffff'),
      grassScale: 20.0,
      dirtScale: 15.0,
      rockScale: 10.0,
      snowScale: 25.0
    })
  }, [])
  
  // Trees data
  const trees = useMemo(() => {
    const treeArray = []
    for (let i = 0; i < 30; i++) {
      treeArray.push({
        position: [
          (Math.random() - 0.5) * 150,
          Math.random() * 5 - 10,
          (Math.random() - 0.5) * 150
        ],
        scale: Math.random() * 0.5 + 0.8,
        rotation: Math.random() * Math.PI * 2
      })
    }
    return treeArray
  }, [])
  
  // Rocks data
  const rocks = useMemo(() => {
    const rockArray = []
    for (let i = 0; i < 20; i++) {
      rockArray.push({
        position: [
          (Math.random() - 0.5) * 180,
          Math.random() * 3 - 8,
          (Math.random() - 0.5) * 180
        ],
        scale: Math.random() * 0.8 + 0.5,
        rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]
      })
    }
    return rockArray
  }, [])

  useFrame((state, delta) => {
    if (scroll && valleyRef.current) {
      const scrollOffset = scroll.offset
      
      // Valley becomes less visible as we scroll up
      const valleyOpacity = Math.max(0, 1 - scrollOffset * 2)
      if (valleyMaterial && valleyMaterial.uniforms) {
        valleyMaterial.uniforms.uTime.value = state.clock.elapsedTime
        valleyMaterial.uniforms.uOpacity.value = valleyOpacity
        valleyMaterial.uniforms.uSnowLine.value = 15 - scrollOffset * 10
      }
      
      // Gentle swaying animation for trees
      valleyRef.current.children.forEach((child, index) => {
        if (child.userData.type === 'tree') {
          child.rotation.z = Math.sin(state.clock.elapsedTime + index) * 0.05
        }
      })
    }
  })

  return (
    <AdvancedAnimations animationType="organic" intensity={1.2}>
      <group ref={valleyRef}>
        {/* Enhanced Terrain dengan Advanced Geometry */}
        <AdvancedGeometry 
          type="terrain"
          resolution={128}
          size={100}
          heightScale={10}
          enableLOD={true}
          enableTessellation={true}
        />
        
        {/* Original Valley Mesh sebagai fallback */}
        <mesh
          geometry={valleyGeometry}
          material={valleyMaterial}
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
          visible={false}
        />
        
        {/* Procedural Trees */}
        <ProceduralTrees 
          count={50}
          area={80}
          heightRange={[3, 12]}
        />
        
        {/* Procedural Vegetation */}
        <ProceduralVegetation 
          grassDensity={300}
          flowerDensity={80}
          bushDensity={40}
          area={90}
        />
        
        {/* Particle Effects */}
        <ParticleSystem 
          type="dust"
          count={100}
          area={100}
          height={20}
        />
        
        <ParticleSystem 
          type="leaves"
          count={50}
          area={60}
          height={15}
        />
        
        {/* Original Trees - kept for reference */}
        {trees.map((tree, index) => (
          <group
            key={`tree-${index}`}
            position={tree.position}
            scale={tree.scale}
            rotation={[0, tree.rotation, 0]}
            userData={{ type: 'tree' }}
            visible={false}
          >
            {/* Tree trunk */}
            <mesh position={[0, 2, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.5, 4]} />
              <meshLambertMaterial color="#8B4513" />
            </mesh>
            
            {/* Tree foliage */}
            <mesh position={[0, 5, 0]} castShadow>
              <sphereGeometry args={[2.5, 8, 8]} />
              <meshLambertMaterial color="#228B22" />
            </mesh>
          </group>
        ))}
        
        {/* Original Rocks - kept for reference */}
        {rocks.map((rock, index) => (
          <mesh
            key={`rock-${index}`}
            position={rock.position}
            scale={rock.scale}
            rotation={rock.rotation}
            castShadow
            visible={false}
          >
            <boxGeometry args={[2, 1.5, 2]} />
            <meshLambertMaterial color="#696969" />
          </mesh>
        ))}
        
        {/* Original Grass patches - kept for reference */}
        {Array.from({ length: 50 }).map((_, index) => (
          <mesh
            key={`grass-${index}`}
            position={[
              (Math.random() - 0.5) * 160,
              Math.random() * 2 - 5,
              (Math.random() - 0.5) * 160
            ]}
            rotation={[0, Math.random() * Math.PI * 2, 0]}
            visible={false}
          >
            <planeGeometry args={[1, 0.5]} />
            <meshLambertMaterial
              color="#32CD32"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </AdvancedAnimations>
  )
}

export default Valley