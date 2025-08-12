import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useScroll } from '@react-three/drei'
import * as THREE from 'three'
import { createNoise3D } from 'simplex-noise'

// Advanced Geometry System dengan Tessellation dan LOD
const AdvancedGeometry = ({ 
  type = 'terrain',
  resolution = 128,
  size = 100,
  heightScale = 10,
  enableLOD = true,
  enableTessellation = true
}) => {
  const geometryRef = useRef()
  const scroll = useScroll()
  const noise3D = createNoise3D()
  
  // Generate advanced terrain geometry dengan multiple detail levels
  const geometryData = useMemo(() => {
    const geometries = {
      high: null,
      medium: null,
      low: null
    }
    
    // High detail geometry
    if (enableTessellation) {
      geometries.high = generateTessellatedTerrain(resolution, size, heightScale)
    } else {
      geometries.high = generateStandardTerrain(resolution, size, heightScale)
    }
    
    // Medium detail geometry (half resolution)
    geometries.medium = generateStandardTerrain(resolution / 2, size, heightScale)
    
    // Low detail geometry (quarter resolution)
    geometries.low = generateStandardTerrain(resolution / 4, size, heightScale)
    
    return geometries
  }, [resolution, size, heightScale, enableTessellation])
  
  // Generate standard terrain dengan noise layers
  function generateStandardTerrain(res, terrainSize, hScale) {
    const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, res - 1, res - 1)
    const positions = geometry.attributes.position.array
    const normals = new Float32Array(positions.length)
    const uvs = geometry.attributes.uv.array
    
    // Enhanced UV mapping untuk better texture sampling
    for (let i = 0; i < uvs.length; i += 2) {
      const u = uvs[i]
      const v = uvs[i + 1]
      
      // Add texture coordinate variations
      uvs[i] = u * 4 // Tile texture 4x
      uvs[i + 1] = v * 4
    }
    
    // Multi-octave noise untuk realistic terrain
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i]
      const z = positions[i + 2]
      
      // Base terrain shape
      const baseNoise = noise3D(x * 0.01, z * 0.01, 0) * hScale
      
      // Detail layers
      const detailNoise1 = noise3D(x * 0.05, z * 0.05, 100) * hScale * 0.3
      const detailNoise2 = noise3D(x * 0.1, z * 0.1, 200) * hScale * 0.1
      const detailNoise3 = noise3D(x * 0.2, z * 0.2, 300) * hScale * 0.05
      
      // Ridge noise untuk mountain ridges
      const ridgeNoise = Math.abs(noise3D(x * 0.02, z * 0.02, 400)) * hScale * 0.5
      
      // Combine all noise layers
      const finalHeight = baseNoise + detailNoise1 + detailNoise2 + detailNoise3 + ridgeNoise
      
      positions[i + 1] = finalHeight
    }
    
    // Calculate enhanced normals untuk better lighting
    geometry.computeVertexNormals()
    
    // Add custom attributes untuk advanced shading
    const slopes = new Float32Array(positions.length / 3)
    const elevations = new Float32Array(positions.length / 3)
    
    for (let i = 0; i < positions.length; i += 3) {
      const vertexIndex = i / 3
      const height = positions[i + 1]
      
      // Calculate slope
      const normal = new THREE.Vector3(
        geometry.attributes.normal.array[i],
        geometry.attributes.normal.array[i + 1],
        geometry.attributes.normal.array[i + 2]
      )
      const slope = 1 - normal.y // 0 = flat, 1 = vertical
      
      slopes[vertexIndex] = slope
      elevations[vertexIndex] = (height + hScale) / (hScale * 2) // Normalize to 0-1
    }
    
    geometry.setAttribute('slope', new THREE.BufferAttribute(slopes, 1))
    geometry.setAttribute('elevation', new THREE.BufferAttribute(elevations, 1))
    
    return geometry
  }
  
  // Generate tessellated terrain dengan adaptive subdivision
  function generateTessellatedTerrain(res, terrainSize, hScale) {
    const baseGeometry = generateStandardTerrain(res, terrainSize, hScale)
    
    // Adaptive tessellation berdasarkan slope dan curvature
    const tessellatedGeometry = new THREE.BufferGeometry()
    const positions = baseGeometry.attributes.position.array
    const indices = baseGeometry.index.array
    
    const newPositions = []
    const newIndices = []
    const newUvs = []
    
    // Process each triangle untuk adaptive subdivision
    for (let i = 0; i < indices.length; i += 3) {
      const i1 = indices[i] * 3
      const i2 = indices[i + 1] * 3
      const i3 = indices[i + 2] * 3
      
      const v1 = new THREE.Vector3(positions[i1], positions[i1 + 1], positions[i1 + 2])
      const v2 = new THREE.Vector3(positions[i2], positions[i2 + 1], positions[i2 + 2])
      const v3 = new THREE.Vector3(positions[i3], positions[i3 + 1], positions[i3 + 2])
      
      // Calculate triangle properties
      const area = calculateTriangleArea(v1, v2, v3)
      const curvature = calculateCurvature(v1, v2, v3)
      
      // Decide if subdivision is needed
      const shouldSubdivide = area > 2 || curvature > 0.5
      
      if (shouldSubdivide && newPositions.length < 50000) { // Limit untuk performance
        subdivideTriangle(v1, v2, v3, newPositions, newIndices, newUvs)
      } else {
        // Add original triangle
        const baseIndex = newPositions.length / 3
        
        newPositions.push(v1.x, v1.y, v1.z)
        newPositions.push(v2.x, v2.y, v2.z)
        newPositions.push(v3.x, v3.y, v3.z)
        
        newIndices.push(baseIndex, baseIndex + 1, baseIndex + 2)
        
        // UV coordinates
        newUvs.push(
          (v1.x + terrainSize/2) / terrainSize, (v1.z + terrainSize/2) / terrainSize,
          (v2.x + terrainSize/2) / terrainSize, (v2.z + terrainSize/2) / terrainSize,
          (v3.x + terrainSize/2) / terrainSize, (v3.z + terrainSize/2) / terrainSize
        )
      }
    }
    
    tessellatedGeometry.setAttribute('position', new THREE.Float32BufferAttribute(newPositions, 3))
    tessellatedGeometry.setIndex(newIndices)
    tessellatedGeometry.setAttribute('uv', new THREE.Float32BufferAttribute(newUvs, 2))
    tessellatedGeometry.computeVertexNormals()
    
    return tessellatedGeometry
  }
  
  // Helper functions untuk tessellation
  function calculateTriangleArea(v1, v2, v3) {
    const edge1 = v2.clone().sub(v1)
    const edge2 = v3.clone().sub(v1)
    return edge1.cross(edge2).length() * 0.5
  }
  
  function calculateCurvature(v1, v2, v3) {
    const center = v1.clone().add(v2).add(v3).divideScalar(3)
    const normal1 = v2.clone().sub(v1).cross(v3.clone().sub(v1)).normalize()
    
    // Simple curvature approximation
    const deviation = Math.abs(center.y - (v1.y + v2.y + v3.y) / 3)
    return deviation / 10 // Normalize
  }
  
  function subdivideTriangle(v1, v2, v3, positions, indices, uvs) {
    // Calculate midpoints
    const m1 = v1.clone().add(v2).divideScalar(2)
    const m2 = v2.clone().add(v3).divideScalar(2)
    const m3 = v3.clone().add(v1).divideScalar(2)
    
    // Apply noise to midpoints untuk detail
    m1.y += noise3D(m1.x * 0.1, m1.z * 0.1, 500) * heightScale * 0.1
    m2.y += noise3D(m2.x * 0.1, m2.z * 0.1, 600) * heightScale * 0.1
    m3.y += noise3D(m3.x * 0.1, m3.z * 0.1, 700) * heightScale * 0.1
    
    const baseIndex = positions.length / 3
    
    // Add vertices
    positions.push(
      v1.x, v1.y, v1.z,
      m1.x, m1.y, m1.z,
      m3.x, m3.y, m3.z,
      
      m1.x, m1.y, m1.z,
      v2.x, v2.y, v2.z,
      m2.x, m2.y, m2.z,
      
      m3.x, m3.y, m3.z,
      m2.x, m2.y, m2.z,
      v3.x, v3.y, v3.z,
      
      m1.x, m1.y, m1.z,
      m2.x, m2.y, m2.z,
      m3.x, m3.y, m3.z
    )
    
    // Add indices untuk 4 new triangles
    for (let i = 0; i < 4; i++) {
      const offset = baseIndex + i * 3
      indices.push(offset, offset + 1, offset + 2)
    }
    
    // Add UV coordinates
    const terrainSize = size
    uvs.push(
      (v1.x + terrainSize/2) / terrainSize, (v1.z + terrainSize/2) / terrainSize,
      (m1.x + terrainSize/2) / terrainSize, (m1.z + terrainSize/2) / terrainSize,
      (m3.x + terrainSize/2) / terrainSize, (m3.z + terrainSize/2) / terrainSize,
      
      (m1.x + terrainSize/2) / terrainSize, (m1.z + terrainSize/2) / terrainSize,
      (v2.x + terrainSize/2) / terrainSize, (v2.z + terrainSize/2) / terrainSize,
      (m2.x + terrainSize/2) / terrainSize, (m2.z + terrainSize/2) / terrainSize,
      
      (m3.x + terrainSize/2) / terrainSize, (m3.z + terrainSize/2) / terrainSize,
      (m2.x + terrainSize/2) / terrainSize, (m2.z + terrainSize/2) / terrainSize,
      (v3.x + terrainSize/2) / terrainSize, (v3.z + terrainSize/2) / terrainSize,
      
      (m1.x + terrainSize/2) / terrainSize, (m1.z + terrainSize/2) / terrainSize,
      (m2.x + terrainSize/2) / terrainSize, (m2.z + terrainSize/2) / terrainSize,
      (m3.x + terrainSize/2) / terrainSize, (m3.z + terrainSize/2) / terrainSize
    )
  }
  
  // LOD system untuk performance optimization
  const currentGeometry = useMemo(() => {
    if (!enableLOD) return geometryData.high
    
    // Placeholder untuk camera distance calculation
    // Dalam implementasi nyata, ini akan menggunakan camera position
    const distance = 50 // Simplified
    
    if (distance < 30) return geometryData.high
    if (distance < 60) return geometryData.medium
    return geometryData.low
  }, [geometryData, enableLOD])
  
  // Advanced material dengan custom attributes
  const advancedMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uHeightScale: { value: heightScale },
        uSize: { value: size },
        uGrassColor: { value: new THREE.Color('#4a7c59') },
        uRockColor: { value: new THREE.Color('#8b7355') },
        uSnowColor: { value: new THREE.Color('#ffffff') },
        uSlopeThreshold: { value: 0.7 },
        uSnowLine: { value: 0.8 }
      },
      vertexShader: `
        attribute float slope;
        attribute float elevation;
        
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vSlope;
        varying float vElevation;
        
        uniform float uTime;
        
        void main() {
          vPosition = position;
          vNormal = normal;
          vUv = uv;
          vSlope = slope;
          vElevation = elevation;
          
          vec3 pos = position;
          
          // Subtle vertex animation
          pos.y += sin(pos.x * 0.1 + uTime * 0.5) * 0.1;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        varying vec3 vPosition;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying float vSlope;
        varying float vElevation;
        
        uniform vec3 uGrassColor;
        uniform vec3 uRockColor;
        uniform vec3 uSnowColor;
        uniform float uSlopeThreshold;
        uniform float uSnowLine;
        
        void main() {
          vec3 color = uGrassColor;
          
          // Rock on steep slopes
          if (vSlope > uSlopeThreshold) {
            color = mix(color, uRockColor, (vSlope - uSlopeThreshold) / (1.0 - uSlopeThreshold));
          }
          
          // Snow at high elevations
          if (vElevation > uSnowLine) {
            float snowFactor = (vElevation - uSnowLine) / (1.0 - uSnowLine);
            color = mix(color, uSnowColor, snowFactor);
          }
          
          // Simple lighting
          float light = dot(vNormal, normalize(vec3(1.0, 1.0, 1.0))) * 0.5 + 0.5;
          color *= light;
          
          gl_FragColor = vec4(color, 1.0);
        }
      `
    })
  }, [heightScale, size])
  
  useFrame((state) => {
    if (!geometryRef.current || !scroll) return
    
    const scrollOffset = scroll.offset
    const progress = scrollOffset * 4
    const time = state.clock.elapsedTime
    
    // Update material uniforms
    if (advancedMaterial.uniforms) {
      advancedMaterial.uniforms.uTime.value = time
      
      // Adjust snow line berdasarkan scroll progress
      const snowLine = 0.8 - Math.max(0, (progress - 1) * 0.2)
      advancedMaterial.uniforms.uSnowLine.value = snowLine
    }
    
    // Geometry visibility berdasarkan scene
    let visibility = 0
    if (progress >= 0 && progress < 3) {
      if (progress < 1) {
        visibility = progress
      } else if (progress < 2) {
        visibility = 1
      } else {
        visibility = 1 - (progress - 2)
      }
    }
    
    geometryRef.current.scale.setScalar(visibility)
  })
  
  return (
    <mesh
      ref={geometryRef}
      geometry={currentGeometry}
      material={advancedMaterial}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
      castShadow
    />
  )
}

export default AdvancedGeometry