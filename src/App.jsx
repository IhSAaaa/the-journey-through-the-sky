import React, { Suspense, useRef, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { ScrollControls, Scroll, useScroll } from '@react-three/drei'
import EnhancedPostProcessing from './components/EnhancedPostProcessing'
import Scene from './components/Scene'
import StoryText from './components/StoryText'
import LoadingScreen from './components/LoadingScreen'

function App() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return <LoadingScreen />
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{ position: [0, 5, 10], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
      >
        <Suspense fallback={null}>
          {/* Setup scroll controls dengan 4 pages untuk 4 scene */}
          <ScrollControls pages={4} damping={0.1}>
            {/* Scene 3D utama */}
            <Scene />
            
            {/* HTML overlay untuk teks cerita */}
            <Scroll html>
              <StoryText />
            </Scroll>
          </ScrollControls>
          
          {/* Enhanced post-processing effects */}
          <EnhancedPostProcessing />
        </Suspense>
      </Canvas>
    </div>
  )
}

export default App